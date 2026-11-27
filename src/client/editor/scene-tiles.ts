import { parsePathData } from '../../shared/path/index.js'

const TILE = 1024
const OVERSCAN = 128
const MAX_BUCKETS_PER_NODE = 64

interface TileNode {
  key: string
  type: string
  absX: number
  absY: number
  width: number
  height: number
  children?: TileNode[]
  visible?: boolean
  rotation?: number
  effects?: unknown[]
  strokes?: { width?: number }[]
  d?: string
  viewBox?: { x: number; y: number; width: number; height: number }
}
type Bounds = { left: number; top: number; right: number; bottom: number }
type Entry = { node: TileNode; parent: Entry | null; order: number; bounds: Bounds | null }

function paintBounds(node: TileNode): Bounds | null {
  let left = node.absX, top = node.absY
  let right = left + node.width, bottom = top + node.height
  let strokeScale = 1
  if (node.type === 'path') {
    const box = node.viewBox ?? { x: 0, y: 0, width: node.width, height: node.height }
    // Arc extrema and reflected controls are not calculated by the shared path parser.
    if (!node.d || /[aAsStT]/.test(node.d) || !box.width || !box.height) return null
    try {
      const { bounds } = parsePathData(node.d)
      const sx = node.width / box.width, sy = node.height / box.height
      strokeScale = Math.max(1, sx, sy)
      right = Math.max(right, left + (bounds.maxX - box.x) * sx)
      bottom = Math.max(bottom, top + (bounds.maxY - box.y) * sy)
      left += Math.min(0, (bounds.minX - box.x) * sx)
      top += Math.min(0, (bounds.minY - box.y) * sy)
    } catch { return null }
  }
  const pad = (node.strokes ?? []).reduce((max, stroke) => Math.max(max, stroke.width ?? 1), 0) * strokeScale
  return { left: left - pad, top: top - pad, right: right + pad, bottom: bottom + pad }
}

/** Index individual painted layers. Restore ancestors and sibling order for the DOM. */
export class SceneTiles {
  private cells = new Map<string, Entry[]>()
  private wide: Entry[] = []
  private entries: Entry[] = []

  constructor(roots: TileNode[]) {
    const visit = (node: TileNode, parent: Entry | null, unbounded: boolean) => {
      if (node.visible === false) return
      // Transforms and filters can paint descendants beyond their layout boxes.
      unbounded ||= !!node.rotation || !!node.effects?.length
      const bounds = unbounded ? null : paintBounds(node)
      const entry = { node, parent, order: this.entries.length, bounds }
      this.entries.push(entry)
      if (bounds) {
        const x0 = Math.floor(bounds.left / TILE), x1 = Math.floor(bounds.right / TILE)
        const y0 = Math.floor(bounds.top / TILE), y1 = Math.floor(bounds.bottom / TILE)
        if ([x0, x1, y0, y1].every(Number.isSafeInteger) && (x1 - x0 + 1) * (y1 - y0 + 1) <= MAX_BUCKETS_PER_NODE) {
          for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
            const key = x + ',' + y
            const bucket = this.cells.get(key)
            if (bucket) bucket.push(entry)
            else this.cells.set(key, [entry])
          }
        } else this.wide.push(entry)
      } else this.wide.push(entry)
      for (const child of node.children ?? []) visit(child, entry, unbounded)
    }
    for (const root of roots) visit(root, null, false)
  }

  query(view: { x: number; y: number; zoom: number }, size: { width: number; height: number }) {
    const left = (-view.x - OVERSCAN) / view.zoom, top = (-view.y - OVERSCAN) / view.zoom
    const right = (size.width - view.x + OVERSCAN) / view.zoom, bottom = (size.height - view.y + OVERSCAN) / view.zoom
    const x0 = Math.floor(left / TILE), x1 = Math.floor(right / TILE)
    const y0 = Math.floor(top / TILE), y1 = Math.floor(bottom / TILE)
    const included = new Set<Entry>()
    function include(entry: Entry) {
      const b = entry.bounds
      if (b && (b.right < left || b.bottom < top || b.left > right || b.top > bottom)) return
      for (let item = entry; item && !included.has(item); item = item.parent) included.add(item)
    }
    if (![x0, x1, y0, y1].every(Number.isSafeInteger) || (x1 - x0 + 1) * (y1 - y0 + 1) > this.cells.size + 1) {
      this.entries.forEach(include)
    } else {
      this.wide.forEach(include)
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.cells.get(x + ',' + y)?.forEach(include)
    }
    const children = new Map<string | null, TileNode[]>()
    for (const entry of [...included].sort((a, b) => a.order - b.order)) {
      const parent = entry.parent?.node.key ?? null
      const siblings = children.get(parent)
      if (siblings) siblings.push(entry.node)
      else children.set(parent, [entry.node])
    }
    return children
  }
}
