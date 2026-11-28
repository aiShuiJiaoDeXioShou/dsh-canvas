/** Hit testing over the resolved scene. Pure; shared by CanvasView and tests. */

import { pointInNode, rectsIntersect, toLocal, toPage } from './geometry.js'

interface Point {
  x: number
  y: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

const COMMAND_RE = /[MmZzLlHhVvCcSsQqTtAa]/
const NUMBER_RE = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/
const SEGMENT_CACHE = new Map<string, Segment[]>()
const MAX_SEGMENT_CACHE = 512

export function isInteractionWire(node: any): boolean {
  return Boolean(node && (node.type === 'path' || node.type === 'line') && (node.interaction || node.sourceNode?.interaction))
}

function tokenizePath(data: string): Array<{ command?: string; value?: number }> {
  const tokens: Array<{ command?: string; value?: number }> = []
  let index = 0
  while (index < data.length) {
    const ch = data[index]!
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === ',') {
      index += 1
      continue
    }
    if (COMMAND_RE.test(ch)) {
      tokens.push({ command: ch })
      index += 1
      continue
    }
    const match = NUMBER_RE.exec(data.slice(index))
    if (!match) return []
    const value = Number(match[0])
    if (!Number.isFinite(value)) return []
    tokens.push({ value })
    index += match[0].length
  }
  return tokens
}

function samplePathSegments(data: string): Segment[] {
  const cached = SEGMENT_CACHE.get(data)
  if (cached) return cached

  const tokens = tokenizePath(data)
  const segments: Segment[] = []
  let index = 0
  let command = ''
  let prevUpper = ''
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0
  let lastCtrlX = 0
  let lastCtrlY = 0

  const nextNum = (): number | null => {
    const tok = tokens[index]
    if (!tok || tok.value === undefined) return null
    index += 1
    return tok.value
  }

  const pushSeg = (x1: number, y1: number, x2: number, y2: number) => {
    if (x1 !== x2 || y1 !== y2) segments.push({ x1, y1, x2, y2 })
  }

  while (index < tokens.length) {
    const tok = tokens[index]!
    if (tok.command) {
      command = tok.command
      index += 1
    } else if (!command) {
      break
    }
    const upper = command.toUpperCase()
    const rel = command !== upper

    if (upper === 'Z') {
      pushSeg(cx, cy, sx, sy)
      cx = sx
      cy = sy
      prevUpper = 'Z'
      continue
    }

    const first = nextNum()
    if (first === null) break

    if (upper === 'H') {
      const nx = rel ? cx + first : first
      pushSeg(cx, cy, nx, cy)
      cx = nx
      prevUpper = 'H'
      continue
    }
    if (upper === 'V') {
      const ny = rel ? cy + first : first
      pushSeg(cx, cy, cx, ny)
      cy = ny
      prevUpper = 'V'
      continue
    }

    const second = nextNum()
    if (second === null) break

    if (upper === 'M') {
      cx = rel ? cx + first : first
      cy = rel ? cy + second : second
      sx = cx
      sy = cy
      command = rel ? 'l' : 'L'
      prevUpper = 'M'
      continue
    }
    if (upper === 'L') {
      const nx = rel ? cx + first : first
      const ny = rel ? cy + second : second
      pushSeg(cx, cy, nx, ny)
      cx = nx
      cy = ny
      prevUpper = 'L'
      continue
    }
    if (upper === 'C' || upper === 'S') {
      let c1x: number
      let c1y: number
      let c2x: number
      let c2y: number
      let ex: number
      let ey: number
      if (upper === 'C') {
        const n3 = nextNum()
        const n4 = nextNum()
        const n5 = nextNum()
        const n6 = nextNum()
        if (n3 === null || n4 === null || n5 === null || n6 === null) break
        c1x = rel ? cx + first : first
        c1y = rel ? cy + second : second
        c2x = rel ? cx + n3 : n3
        c2y = rel ? cy + n4 : n4
        ex = rel ? cx + n5 : n5
        ey = rel ? cy + n6 : n6
      } else {
        const n3 = nextNum()
        const n4 = nextNum()
        if (n3 === null || n4 === null) break
        if (prevUpper === 'C' || prevUpper === 'S') {
          c1x = 2 * cx - lastCtrlX
          c1y = 2 * cy - lastCtrlY
        } else {
          c1x = cx
          c1y = cy
        }
        c2x = rel ? cx + first : first
        c2y = rel ? cy + second : second
        ex = rel ? cx + n3 : n3
        ey = rel ? cy + n4 : n4
      }
      const steps = 16
      let px = cx
      let py = cy
      for (let step = 1; step <= steps; step++) {
        const t = step / steps
        const u = 1 - t
        const nx = u * u * u * cx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex
        const ny = u * u * u * cy + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey
        pushSeg(px, py, nx, ny)
        px = nx
        py = ny
      }
      cx = ex
      cy = ey
      lastCtrlX = c2x
      lastCtrlY = c2y
      prevUpper = upper
      continue
    }
    if (upper === 'Q' || upper === 'T') {
      let qx: number
      let qy: number
      let ex: number
      let ey: number
      if (upper === 'Q') {
        const n3 = nextNum()
        const n4 = nextNum()
        if (n3 === null || n4 === null) break
        qx = rel ? cx + first : first
        qy = rel ? cy + second : second
        ex = rel ? cx + n3 : n3
        ey = rel ? cy + n4 : n4
      } else {
        if (prevUpper === 'Q' || prevUpper === 'T') {
          qx = 2 * cx - lastCtrlX
          qy = 2 * cy - lastCtrlY
        } else {
          qx = cx
          qy = cy
        }
        ex = rel ? cx + first : first
        ey = rel ? cy + second : second
      }
      const steps = 12
      let px = cx
      let py = cy
      for (let step = 1; step <= steps; step++) {
        const t = step / steps
        const u = 1 - t
        const nx = u * u * cx + 2 * u * t * qx + t * t * ex
        const ny = u * u * cy + 2 * u * t * qy + t * t * ey
        pushSeg(px, py, nx, ny)
        px = nx
        py = ny
      }
      cx = ex
      cy = ey
      lastCtrlX = qx
      lastCtrlY = qy
      prevUpper = upper
      continue
    }
    if (upper === 'A') {
      const rot = nextNum()
      const largeArc = nextNum()
      const sweep = nextNum()
      const n6 = nextNum()
      const n7 = nextNum()
      if (rot === null || largeArc === null || sweep === null || n6 === null || n7 === null) break
      const ex = rel ? cx + n6 : n6
      const ey = rel ? cy + n7 : n7
      pushSeg(cx, cy, ex, ey)
      cx = ex
      cy = ey
      prevUpper = 'A'
      continue
    }
    break
  }

  if (SEGMENT_CACHE.size >= MAX_SEGMENT_CACHE) SEGMENT_CACHE.clear()
  SEGMENT_CACHE.set(data, segments)
  return segments
}

function pointToSegmentDistanceSq(px: number, py: number, seg: Segment): number {
  const dx = seg.x2 - seg.x1
  const dy = seg.y2 - seg.y1
  const lenSq = dx * dx + dy * dy
  if (lenSq <= 1e-9) {
    const ox = px - seg.x1
    const oy = py - seg.y1
    return ox * ox + oy * oy
  }
  const t = Math.max(0, Math.min(1, ((px - seg.x1) * dx + (py - seg.y1) * dy) / lenSq))
  const projX = seg.x1 + t * dx
  const projY = seg.y1 + t * dy
  const ox = px - projX
  const oy = py - projY
  return ox * ox + oy * oy
}

function localWireSegments(node: any): Segment[] {
  if (node.type === 'line') {
    return [{ x1: 0, y1: (node.height ?? 0) / 2, x2: node.width ?? 0, y2: (node.height ?? 0) / 2 }]
  }
  if (typeof node.d !== 'string' || !node.d.trim()) return []
  const raw = samplePathSegments(node.d)
  if (!raw.length) return []
  const vb = node.viewBox ?? { x: 0, y: 0, width: node.width || 1, height: node.height || 1 }
  const sx = vb.width ? (node.width || 0) / vb.width : 1
  const sy = vb.height ? (node.height || 0) / vb.height : 1
  const ox = vb.x ?? 0
  const oy = vb.y ?? 0
  return raw.map((seg) => ({
    x1: (seg.x1 - ox) * sx,
    y1: (seg.y1 - oy) * sy,
    x2: (seg.x2 - ox) * sx,
    y2: (seg.y2 - oy) * sy,
  }))
}

/** Hit-test an interaction wire along its actual path/line segments instead of its full AABB. */
export function pointNearInteractionWire(node: any, point: Point, tolerance = 8): boolean {
  if (!node || node.visible === false) return false
  const strokeWidth = Math.max(
    2,
    ...(Array.isArray(node.strokes) ? node.strokes.map((s: any) => Number(s?.width) || 0) : []),
  )
  const hitTol = Math.max(tolerance, strokeWidth / 2 + 5)
  const local = toLocal(node, point)
  if (
    local.x < -hitTol ||
    local.y < -hitTol ||
    local.x > (node.width ?? 0) + hitTol ||
    local.y > (node.height ?? 0) + hitTol
  ) {
    return false
  }
  const segments = localWireSegments(node)
  if (!segments.length) return pointInNode(node, point)
  const tolSq = hitTol * hitTol
  for (const seg of segments) {
    if (pointToSegmentDistanceSq(local.x, local.y, seg) <= tolSq) return true
  }
  return false
}

function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const onSeg = (p: Point, q: Point, r: Point) =>
    q.x >= Math.min(p.x, r.x) && q.x <= Math.max(p.x, r.x) &&
    q.y >= Math.min(p.y, r.y) && q.y <= Math.max(p.y, r.y)
  const d1 = cross(b1, b2, a1)
  const d2 = cross(b1, b2, a2)
  const d3 = cross(a1, a2, b1)
  const d4 = cross(a1, a2, b2)
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true
  if (d1 === 0 && onSeg(b1, a1, b2)) return true
  if (d2 === 0 && onSeg(b1, a2, b2)) return true
  if (d3 === 0 && onSeg(a1, b1, a2)) return true
  if (d4 === 0 && onSeg(a1, b2, a2)) return true
  return false
}

function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
}

/** Marquee intersection for interaction wires: tests actual segments against `rect`. */
export function interactionWireIntersectsRect(node: any, rect: Rect): boolean {
  if (!node || node.visible === false) return false
  if (!rectsIntersect(rect, { x: node.absX, y: node.absY, width: node.width, height: node.height })) {
    return false
  }
  const segments = localWireSegments(node)
  if (!segments.length) return true
  const tl = { x: rect.x, y: rect.y }
  const tr = { x: rect.x + rect.width, y: rect.y }
  const br = { x: rect.x + rect.width, y: rect.y + rect.height }
  const bl = { x: rect.x, y: rect.y + rect.height }
  const edges: Array<[Point, Point]> = [[tl, tr], [tr, br], [br, bl], [bl, tl]]
  for (const seg of segments) {
    const p1 = toPage(node, { x: seg.x1, y: seg.y1 })
    const p2 = toPage(node, { x: seg.x2, y: seg.y2 })
    if (pointInRect(p1, rect) || pointInRect(p2, rect)) return true
    for (const [e1, e2] of edges) {
      if (segmentsIntersect(p1, p2, e1, e2)) return true
    }
  }
  return false
}

function hitChildren(children: any[] | undefined, point: Point, ignoredKeys: ReadonlySet<string> | undefined, wireTolerance: number) {
  let wireHit: any = null
  for (const child of [...(children ?? [])].reverse()) {
    if (!child || child.visible === false || child.locked || ignoredKeys?.has(child.key)) continue
    if (isInteractionWire(child)) {
      if (!wireHit && pointNearInteractionWire(child, point, wireTolerance)) {
        wireHit = child
      }
      continue
    }
    const hit = hitDeep(child, point, ignoredKeys, wireTolerance)
    if (hit) return hit
  }
  return wireHit
}

function hitDeep(node: any, point: Point, ignoredKeys: ReadonlySet<string> | undefined, wireTolerance: number) {
  if (!node || node.visible === false || node.locked || ignoredKeys?.has(node.key)) return null
  if (isInteractionWire(node)) {
    return pointNearInteractionWire(node, point, wireTolerance) ? node : null
  }
  if (node.type === 'group') {
    return hitChildren(node.children, point, ignoredKeys, wireTolerance)
  }
  if (!pointInNode(node, point)) return null
  const childHit = hitChildren(node.children, point, ignoredKeys, wireTolerance)
  if (childHit) return childHit
  return node
}

export interface HitTestOptions {
  enteredInstance?: string | null
  deep?: boolean
  ignoredKeys?: ReadonlySet<string>
  wireTolerance?: number
}

/**
 * Deepest hit then bubble groups and instances according to the entered
 * instance. `deep` returns the raw leaf (used by double-click to enter).
 * Normal design nodes take precedence over interaction wires, and interaction
 * wires only match along their actual path/line segments.
 */
export function hitTestScene(scene: any, point: Point, options: HitTestOptions = {}) {
  if (!scene) return null
  const wireTolerance = options.wireTolerance ?? 8
  const deepest = hitChildren(scene.roots, point, options.ignoredKeys, wireTolerance)
  if (!deepest) return null
  if (options.deep) return deepest
  const entered = options.enteredInstance ?? null
  let current = deepest
  while (current.parent) {
    const parent = current.parent
    if (parent.type === 'group') {
      current = parent
      continue
    }
    if (parent.type === 'instance' && parent.key !== entered) {
      current = parent
      continue
    }
    break
  }
  return current
}
