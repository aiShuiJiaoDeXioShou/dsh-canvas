/**
 * dsh.canvas@1 — layout engine for the resolved render tree.
 *
 * `layoutScene(scene)` mutates the scene in place:
 *   • measures text (`scene.measureText`), fills `node.lines` and text hug sizes
 *   • resolves hug/fill sizing bottom-up, then positions auto-layout children
 *   • writes absolute page coordinates `node.absX` / `node.absY`
 *
 * Supported: frame / group / rect / ellipse / line / text / instance, nested
 * frames and instances, auto-layout horizontal|vertical with gap, per-side
 * padding, alignPrimary start|center|end|space-between, alignCounter
 * start|center|end|stretch, layoutSizing fixed|hug|fill, text autoHeight,
 * hug frames and fill distribution on the primary axis.
 *
 * Assumptions (documented so the renderer and exporters stay predictable):
 *   • auto-layout ignores `x`/`y` of its direct children; free-form containers
 *     keep children at their document `x`/`y`.
 *   • hidden children keep occupying layout space; hiding is a paint concern.
 *   • `alignCounter: "stretch"` stretches children whose counter-axis sizing is
 *     `fixed`; `hug` children keep their content size and `fill` children always
 *     take the available counter space.
 *   • on the primary axis, `fill` children share the space left over after
 *     fixed/hug siblings and gaps equally.
 *   • `fill` sizing on a hug container has no space to distribute, so such
 *     children keep their content size.
 *   • text vertical sizing defaults to `hug` unless `layoutSizing.v` or
 *     `autoHeight: false` says otherwise.
 */

import { createTextMeasurer } from './text-measure.js'

const DEFAULT_FONT = Object.freeze({
  family: 'system-ui',
  weight: 400,
  style: 'normal',
  size: 14,
  lineHeight: 1.4,
  letterSpacing: 0,
})

const EPSILON = 1e-6

/**
 * Lay out every root of a scene.
 * @param {any} scene result of `buildScene`
 * @returns {any} the same scene, mutated
 */
export function layoutScene(scene) {
  if (!scene || !Array.isArray(scene.roots)) return scene
  const issues = Array.isArray(scene.issues) ? scene.issues : (scene.issues = [])
  let measure = scene.measureText
  if (typeof measure !== 'function' && scene.options && typeof scene.options.measureText === 'function') {
    measure = scene.options.measureText
  }
  if (typeof measure !== 'function') measure = createTextMeasurer()
  scene.measureText = measure
  const state = { issues, measure }
  for (const root of scene.roots) measureNode(root)
  for (const root of scene.roots) arrangeNode(root, 0, 0)
  return scene

  /**
   * Bottom-up pass: measure text, resolve hug sizes; distribute fill sizes for
   * auto-layout children (which needs the parent size, already known for fixed
   * or fill parents).
   * @param {any} node
   */
  function measureNode(node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'text') {
      measureTextNode(node)
      return
    }
    const children = Array.isArray(node.children) ? node.children : []
    for (const child of children) measureNode(child)
    const layout = isObject(node.layout) ? node.layout : null
    const sizing = effectiveSizing(node)
    if (layout) measureAutoLayoutNode(node, layout, sizing, children)
    else measureFreeformNode(node, sizing, children)
  }

  /** @param {any} node */
  function measureTextNode(node) {
    const sizing = effectiveSizing(node)
    const font = isObject(node.font) ? { ...DEFAULT_FONT, ...node.font } : DEFAULT_FONT
    const wrapWidth = sizing.h === 'hug' ? Infinity : Math.max(0, numberOr(node.width, 0))
    const result = safeMeasure(state, {
      text: typeof node.text === 'string' ? node.text : '',
      font,
      maxWidth: wrapWidth,
      autoHeight: node.autoHeight !== false,
    }, node)
    node.lines = result.lines
    if (sizing.h === 'hug') node.width = Math.max(0, result.width)
    if (sizing.v === 'hug') node.height = Math.max(0, result.height)
  }

  /**
   * @param {any} node
   * @param {any} layout
   * @param {{h: string, v: string}} sizing
   * @param {any[]} children
   */
  function measureAutoLayoutNode(node, layout, sizing, children) {
    const direction = layout.direction === 'horizontal' ? 'horizontal' : 'vertical'
    const horizontal = direction === 'horizontal'
    const padding = normalizePadding(layout.padding)
    const gap = Math.max(0, numberOr(layout.gap, 0))
    const alignCounter = layout.alignCounter ?? 'start'
    const padX = padding.left + padding.right
    const padY = padding.top + padding.bottom

    const innerWidth = sizing.h === 'hug' ? null : Math.max(0, numberOr(node.width, 0) - padX)
    const innerHeight = sizing.v === 'hug' ? null : Math.max(0, numberOr(node.height, 0) - padY)
    const primaryAvailable = horizontal ? innerWidth : innerHeight
    const crossAvailable = horizontal ? innerHeight : innerWidth
    const primaryAxis = horizontal ? 'width' : 'height'
    const crossAxis = horizontal ? 'height' : 'width'

    // 1. Counter-axis sizing: stretch / fill.
    if (crossAvailable != null) {
      for (const child of children) {
        const childSizing = effectiveSizing(child)
        const crossSizing = horizontal ? childSizing.v : childSizing.h
        const shouldFill = crossSizing === 'fill' || (alignCounter === 'stretch' && crossSizing === 'fixed')
        if (shouldFill && Math.abs(numberOr(child[crossAxis], 0) - crossAvailable) > EPSILON) {
          child[crossAxis] = crossAvailable
          measureNode(child)
        }
      }
    }

    // 2. Primary-axis fill distribution.
    if (primaryAvailable != null) {
      const fillChildren = children.filter((child) => {
        const childSizing = effectiveSizing(child)
        return (horizontal ? childSizing.h : childSizing.v) === 'fill'
      })
      if (fillChildren.length) {
        let fixedTotal = 0
        for (const child of children) {
          if (fillChildren.includes(child)) continue
          fixedTotal += Math.max(0, numberOr(child[primaryAxis], 0))
        }
        const gapTotal = gap * Math.max(0, children.length - 1)
        const fillSize = Math.max(0, (primaryAvailable - fixedTotal - gapTotal) / fillChildren.length)
        for (const child of fillChildren) {
          if (Math.abs(numberOr(child[primaryAxis], 0) - fillSize) > EPSILON) {
            child[primaryAxis] = fillSize
            measureNode(child)
          }
        }
      }
    }

    // 3. Own size (hug) from the final child sizes.
    let contentPrimary = gap * Math.max(0, children.length - 1)
    let contentCross = 0
    for (const child of children) {
      contentPrimary += Math.max(0, numberOr(child[primaryAxis], 0))
      contentCross = Math.max(contentCross, Math.max(0, numberOr(child[crossAxis], 0)))
    }
    if (sizing.h === 'hug') {
      node.width = Math.max(0, (horizontal ? contentPrimary + padX : contentCross + padX))
    }
    if (sizing.v === 'hug') {
      node.height = Math.max(0, (horizontal ? contentCross + padY : contentPrimary + padY))
    }
  }

  /**
   * @param {any} node
   * @param {{h: string, v: string}} sizing
   * @param {any[]} children
   */
  function measureFreeformNode(node, sizing, children) {
    let contentWidth = 0
    let contentHeight = 0
    for (const child of children) {
      contentWidth = Math.max(contentWidth, numberOr(child.x, 0) + Math.max(0, numberOr(child.width, 0)))
      contentHeight = Math.max(contentHeight, numberOr(child.y, 0) + Math.max(0, numberOr(child.height, 0)))
    }
    if (sizing.h === 'hug') node.width = Math.max(0, contentWidth)
    if (sizing.v === 'hug') node.height = Math.max(0, contentHeight)
  }

  /**
   * Top-down pass: compute relative child positions for auto-layout frames, then
   * recurse with the absolute origin.
   * @param {any} node
   * @param {number} originX
   * @param {number} originY
   */
  function arrangeNode(node, originX, originY) {
    if (!node || typeof node !== 'object') return
    node.absX = originX + numberOr(node.x, 0)
    node.absY = originY + numberOr(node.y, 0)
    const children = Array.isArray(node.children) ? node.children : []
    if (!children.length) return
    const layout = isObject(node.layout) ? node.layout : null
    if (layout) arrangeAutoLayoutChildren(node, layout, children)
    for (const child of children) arrangeNode(child, node.absX, node.absY)
  }

  /**
   * @param {any} node
   * @param {any} layout
   * @param {any[]} children
   */
  function arrangeAutoLayoutChildren(node, layout, children) {
    const horizontal = layout.direction === 'horizontal'
    const padding = normalizePadding(layout.padding)
    const gap = Math.max(0, numberOr(layout.gap, 0))
    const alignPrimary = layout.alignPrimary ?? 'start'
    const alignCounter = layout.alignCounter ?? 'start'
    const primaryAxis = horizontal ? 'width' : 'height'
    const crossAxis = horizontal ? 'height' : 'width'
    const padPrimaryStart = horizontal ? padding.left : padding.top
    const padCrossStart = horizontal ? padding.top : padding.left
    const innerPrimary = Math.max(
      0,
      numberOr(node[primaryAxis], 0) - (horizontal ? padding.left + padding.right : padding.top + padding.bottom),
    )
    const innerCross = Math.max(
      0,
      numberOr(node[crossAxis], 0) - (horizontal ? padding.top + padding.bottom : padding.left + padding.right),
    )

    let contentPrimary = gap * Math.max(0, children.length - 1)
    for (const child of children) contentPrimary += Math.max(0, numberOr(child[primaryAxis], 0))
    const leftover = innerPrimary - contentPrimary

    let offset = 0
    let effectiveGap = gap
    if (alignPrimary === 'center') offset = leftover / 2
    else if (alignPrimary === 'end') offset = leftover
    else if (alignPrimary === 'space-between' && children.length > 1) {
      effectiveGap = gap + Math.max(0, leftover) / (children.length - 1)
    }

    let cursor = padPrimaryStart + offset
    for (const child of children) {
      const childPrimary = Math.max(0, numberOr(child[primaryAxis], 0))
      const childCross = Math.max(0, numberOr(child[crossAxis], 0))
      let crossPosition = padCrossStart
      if (alignCounter === 'center') crossPosition = padCrossStart + (innerCross - childCross) / 2
      else if (alignCounter === 'end') crossPosition = padCrossStart + innerCross - childCross
      if (horizontal) {
        child.x = cursor
        child.y = crossPosition
      } else {
        child.x = crossPosition
        child.y = cursor
      }
      cursor += childPrimary + effectiveGap
    }
  }
}

/**
 * Effective layout sizing of a node. Text nodes hug vertically by default
 * (`autoHeight`), everything else defaults to fixed.
 * @param {any} node
 * @returns {{h: 'fixed'|'hug'|'fill', v: 'fixed'|'hug'|'fill'}}
 */
function effectiveSizing(node) {
  const raw = isObject(node.layoutSizing) ? node.layoutSizing : {}
  const h = raw.h === 'hug' || raw.h === 'fill' ? raw.h : 'fixed'
  let v
  if (raw.v === 'hug' || raw.v === 'fill') v = raw.v
  else if (raw.v === 'fixed') v = 'fixed'
  else v = node.type === 'text' && node.autoHeight !== false ? 'hug' : 'fixed'
  return { h, v }
}

/** @param {unknown} padding */
function normalizePadding(padding) {
  const source = isObject(padding) ? padding : {}
  return {
    top: numberOr(source.top, 0),
    right: numberOr(source.right, 0),
    bottom: numberOr(source.bottom, 0),
    left: numberOr(source.left, 0),
  }
}

/**
 * Call `scene.measureText` defensively; fall back to a deterministic char-grid
 * approximation when the injected measurer throws or returns junk.
 * @param {{issues: string[]}} state
 * @param {{text: string, font: any, maxWidth: number, autoHeight?: boolean}} request
 * @param {any} node
 */
function safeMeasure(state, request, node) {
  try {
    const result = state.measure(request)
    if (
      result &&
      Array.isArray(result.lines) &&
      Number.isFinite(result.width) &&
      Number.isFinite(result.height)
    ) {
      return {
        lines: result.lines.map((line) => ({
          text: typeof line?.text === 'string' ? line.text : '',
          width: numberOr(line?.width, 0),
        })),
        width: result.width,
        height: result.height,
      }
    }
    throw new Error('measureText returned an invalid result')
  } catch (error) {
    state.issues.push(`text measurement failed for "${node.key ?? node.id ?? 'text'}": ${String(error instanceof Error ? error.message : error)}`)
    return fallbackTextResult(request)
  }
}

/**
 * Last-resort text metrics used only when the injected measurer fails.
 * @param {{text: string, font: any}} request
 */
function fallbackTextResult(request) {
  const font = isObject(request.font) ? { ...DEFAULT_FONT, ...request.font } : DEFAULT_FONT
  const size = numberOr(font.size, DEFAULT_FONT.size)
  const lineHeight = numberOr(font.lineHeight, DEFAULT_FONT.lineHeight)
  const lines = String(request.text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => ({ text: line, width: [...line].length * size * 0.55 }))
  let width = 0
  for (const line of lines) width = Math.max(width, line.width)
  return { lines, width, height: lines.length * size * lineHeight }
}

/** @param {unknown} value */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @param {unknown} value @param {number} fallback */
function numberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
