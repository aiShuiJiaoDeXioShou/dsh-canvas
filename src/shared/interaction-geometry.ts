/**
 * Pure geometry helpers for interactive flow connectors (curved Bezier wires with arrowheads).
 * Shared between store creation/re-routing and live CanvasView drag previews.
 */

export interface BoxRect {
  x: number
  y: number
  width: number
  height: number
}

export interface Point2D {
  x: number
  y: number
}

export interface ConnectionGeometry {
  x: number
  y: number
  width: number
  height: number
  viewBox: { x: number; y: number; width: number; height: number }
  d: string
  labelX: number
  labelY: number
  start: Point2D
  end: Point2D
  c1: Point2D
  c2: Point2D
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function arrowheadPoints(from: Point2D, tip: Point2D, size = 9): [Point2D, Point2D] {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x)
  const spread = Math.PI / 6.5
  return [
    {
      x: tip.x - size * Math.cos(angle - spread),
      y: tip.y - size * Math.sin(angle - spread),
    },
    {
      x: tip.x - size * Math.cos(angle + spread),
      y: tip.y - size * Math.sin(angle + spread),
    },
  ]
}

function cubicPoint(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const mt = 1 - t
  const mt2 = mt * mt
  const t2 = t * t
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
  }
}

/**
 * Compute world-space anchors, control points, local SVG path `d` (curve + arrowhead),
 * bounding box, and label midpoint for a connector between two boxes.
 */
export function computeConnectionGeometry(from: BoxRect, to: BoxRect): ConnectionGeometry {
  const fc = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
  const tc = { x: to.x + to.width / 2, y: to.y + to.height / 2 }
  const dx = tc.x - fc.x
  const dy = tc.y - fc.y

  let start: Point2D
  let end: Point2D
  let tangentOut: Point2D
  let tangentIn: Point2D

  if (Math.abs(dx) >= Math.abs(dy) * 0.45) {
    if (dx >= 0) {
      start = { x: from.x + from.width, y: fc.y }
      end = { x: to.x, y: tc.y }
      tangentOut = { x: 1, y: 0 }
      tangentIn = { x: -1, y: 0 }
    } else {
      start = { x: from.x, y: fc.y }
      end = { x: to.x + to.width, y: tc.y }
      tangentOut = { x: -1, y: 0 }
      tangentIn = { x: 1, y: 0 }
    }
  } else if (dy >= 0) {
    start = { x: fc.x, y: from.y + from.height }
    end = { x: tc.x, y: to.y }
    tangentOut = { x: 0, y: 1 }
    tangentIn = { x: 0, y: -1 }
  } else {
    start = { x: fc.x, y: from.y }
    end = { x: tc.x, y: to.y + to.height }
    tangentOut = { x: 0, y: -1 }
    tangentIn = { x: 0, y: 1 }
  }

  const dist = Math.hypot(end.x - start.x, end.y - start.y)
  const tension = Math.max(44, Math.min(180, dist * 0.38))
  const c1 = { x: start.x + tangentOut.x * tension, y: start.y + tangentOut.y * tension }
  const c2 = { x: end.x + tangentIn.x * tension, y: end.y + tangentIn.y * tension }
  const [wing1, wing2] = arrowheadPoints(c2, end, 9)

  // Sample curve + arrowhead for tight bounds with stroke/arrow padding.
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const include = (p: Point2D) => {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  for (let step = 0; step <= 16; step += 1) {
    include(cubicPoint(start, c1, c2, end, step / 16))
  }
  include(wing1)
  include(wing2)

  const pad = 12
  const x = round2(minX - pad)
  const y = round2(minY - pad)
  const width = Math.max(24, round2(maxX - minX + pad * 2))
  const height = Math.max(24, round2(maxY - minY + pad * 2))

  const lx = (p: Point2D) => round2(p.x - x)
  const ly = (p: Point2D) => round2(p.y - y)
  const d = [
    `M ${lx(start)} ${ly(start)}`,
    `C ${lx(c1)} ${ly(c1)} ${lx(c2)} ${ly(c2)} ${lx(end)} ${ly(end)}`,
    `M ${lx(wing1)} ${ly(wing1)}`,
    `L ${lx(end)} ${ly(end)}`,
    `L ${lx(wing2)} ${ly(wing2)}`,
  ].join(' ')

  const mid = cubicPoint(start, c1, c2, end, 0.5)
  const labelX = round2(mid.x)
  const labelY = round2(mid.y - 16)

  return {
    x,
    y,
    width,
    height,
    viewBox: { x: 0, y: 0, width, height },
    d,
    labelX,
    labelY,
    start,
    end,
    c1,
    c2,
  }
}

/**
 * Compute an SVG path `d` string in screen space for a live dragging preview wire with arrowhead.
 */
export function computeLiveConnectionSvgPath(start: Point2D, end: Point2D): string {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dist = Math.hypot(dx, dy)
  const horizontal = Math.abs(dx) >= Math.abs(dy) * 0.45
  const tension = Math.max(36, Math.min(160, dist * 0.36))
  const c1 = horizontal
    ? { x: start.x + (dx >= 0 ? tension : -tension), y: start.y }
    : { x: start.x, y: start.y + (dy >= 0 ? tension : -tension) }
  const c2 = horizontal
    ? { x: end.x + (dx >= 0 ? -tension : tension), y: end.y }
    : { x: end.x, y: end.y + (dy >= 0 ? -tension : tension) }
  const [wing1, wing2] = arrowheadPoints(c2, end, 8)
  return [
    `M ${round2(start.x)} ${round2(start.y)}`,
    `C ${round2(c1.x)} ${round2(c1.y)} ${round2(c2.x)} ${round2(c2.y)} ${round2(end.x)} ${round2(end.y)}`,
    `M ${round2(wing1.x)} ${round2(wing1.y)}`,
    `L ${round2(end.x)} ${round2(end.y)}`,
    `L ${round2(wing2.x)} ${round2(wing2.y)}`,
  ].join(' ')
}
