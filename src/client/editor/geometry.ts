/** Geometry helpers for canvas interaction and overlays. Pure functions. */

export const MIN_SIZE = 1
export const SNAP_THRESHOLD_SCREEN = 6

export function rad(deg) {
  return (deg * Math.PI) / 180
}

export function centerOf(node) {
  return { x: node.absX + node.width / 2, y: node.absY + node.height / 2 }
}

/** Rotate a page-space point into the node's local (unrotated) frame. */
export function toLocal(node, point) {
  const center = centerOf(node)
  const angle = -rad(node.rotation || 0)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle) + node.width / 2,
    y: dx * Math.sin(angle) + dy * Math.cos(angle) + node.height / 2,
  }
}

/** Rotate a node-local point into page space. */
export function toPage(node, point) {
  const center = centerOf(node)
  const angle = rad(node.rotation || 0)
  const dx = point.x - node.width / 2
  const dy = point.y - node.height / 2
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle) + center.x,
    y: dx * Math.sin(angle) + dy * Math.cos(angle) + center.y,
  }
}

export function pointInNode(node, point) {
  if (!node || node.visible === false) return false
  if (node.type === 'group') {
    return (node.children ?? []).some((child) => pointInNode(child, point))
  }
  const local = toLocal(node, point)
  return local.x >= 0 && local.y >= 0 && local.x <= node.width && local.y <= node.height
}

export function rectOf(node) {
  return { x: node.absX, y: node.absY, width: node.width, height: node.height }
}

export function rectsIntersect(a, b) {
  return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y)
}

export function unionRects(rects) {
  if (!rects.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const rect of rects) {
    minX = Math.min(minX, rect.x)
    minY = Math.min(minY, rect.y)
    maxX = Math.max(maxX, rect.x + rect.width)
    maxY = Math.max(maxY, rect.y + rect.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Screen-space quad of a rotated node. */
export function nodeQuad(node) {
  return [
    toPage(node, { x: 0, y: 0 }),
    toPage(node, { x: node.width, y: 0 }),
    toPage(node, { x: node.width, y: node.height }),
    toPage(node, { x: 0, y: node.height }),
  ]
}

export function screenPoint(viewport, point) {
  return { x: point.x * viewport.zoom + viewport.x, y: point.y * viewport.zoom + viewport.y }
}

export function worldPoint(viewport, point) {
  return { x: (point.x - viewport.x) / viewport.zoom, y: (point.y - viewport.y) / viewport.zoom }
}

export function handlePoints(node, viewport) {
  const positions = {
    nw: { x: 0, y: 0 },
    n: { x: 0.5, y: 0 },
    ne: { x: 1, y: 0 },
    e: { x: 1, y: 0.5 },
    se: { x: 1, y: 1 },
    s: { x: 0.5, y: 1 },
    sw: { x: 0, y: 1 },
    w: { x: 0, y: 0.5 },
  }
  const out = {}
  for (const [name, relative] of Object.entries(positions)) {
    const page = toPage(node, { x: relative.x * node.width, y: relative.y * node.height })
    out[name] = screenPoint(viewport, page)
  }
  return out
}

export function rotateHandlePoint(node, viewport) {
  const page = toPage(node, { x: node.width / 2, y: -22 / viewport.zoom })
  return screenPoint(viewport, page)
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function normalizeAngle(value) {
  let angle = value % 360
  if (angle < -180) angle += 360
  if (angle > 180) angle -= 360
  return angle
}

/** Bounds used for fit-to-view. */
export function sceneBounds(scene) {
  if (!scene?.roots?.length) return { x: 0, y: 0, width: 1, height: 1 }
  return unionRects(scene.roots.filter((node) => node.visible !== false).map(rectOf)) ?? { x: 0, y: 0, width: 1, height: 1 }
}
