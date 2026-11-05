/**
 * dsh.canvas@1 — deterministic design audit.
 *
 * `auditDoc(doc, options)` inspects a canvas document and returns static design
 * findings. It never mutates the document, never touches the filesystem and
 * never uses randomness, so the same document always produces the same result.
 *
 * The checks are deliberately conservative: when a visual property cannot be
 * resolved from the document alone (gradients, images, transparency, blur) the
 * affected heuristic is skipped and the reason is reported in `skipped`.
 *
 * Finding order is stable: checks run in the order listed in `AUDIT_CHECKS`,
 * and nodes are visited in document order.
 */

const AUDIT_CHECKS = [
  'screenshot-boundary',
  'contrast',
  'touch-target',
  'clipped-child',
  'zero-size',
  'missing-refs',
  'unresolved-comments',
  'empty-frame',
]

/** Checks that are impossible with a static document, reported every run. */
const BASE_SKIPPED = ['runtime interaction', 'state coverage']

const TOUCH_TARGET_RE = /button|btn|tab|nav|action|toggle|checkbox|radio|close|icon|link/i
const IMAGE_ASSET_RE = /^assets\/[A-Za-z0-9._-]{1,120}$/

const IOS_TOUCH_TARGET = 44
const MATERIAL3_TOUCH_TARGET = 48
const BODY_CONTRAST = 4.5
const LARGE_CONTRAST = 3

const DEFAULT_PAGE_BACKGROUND = '#FFFFFF'
const DEFAULT_FONT_SIZE = 14
const DEFAULT_FONT_WEIGHT = 400

/** Geometry/alpha tolerances used to avoid floating point false positives. */
const EPSILON = 1e-6
const ALPHA_EPSILON = 1e-9

/** Style references that must resolve to a style in `doc.styles`. */
const STYLE_REFS = [
  ['fillStyleId', 'fill'],
  ['textStyleId', 'text'],
  ['effectStyleId', 'effect'],
]

/**
 * Audit a dsh.canvas@1 document.
 *
 * @param {any} doc
 * @param {{pageId?: string, nodeId?: string, system?: 'ios'|'material3'}} [options]
 * @returns {{findings: Array<{severity: 'high'|'medium'|'low', code: string, nodeId: string, nodeName: string, message: string, data?: object}>, checked: string[], skipped: string[]}}
 */
export function auditDoc(doc, options = {}) {
  if (!isRecord(doc)) throw new TypeError('auditDoc: expected a document object')
  if (options == null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('auditDoc: options must be an object')
  }

  const pages = Array.isArray(doc.pages) ? doc.pages : []
  if (pages.length === 0) throw new Error('auditDoc: document has no pages')

  const page = selectPage(pages, options)
  const records = indexPage(page)
  const recordByNode = new Map(records.map((record) => [record.node, record]))

  let targetRecord = null
  if (options.nodeId != null) {
    targetRecord = records.find((record) => record.node.id === options.nodeId) ?? null
    if (!targetRecord) throw new Error(`auditDoc: unknown node "${String(options.nodeId)}"`)
  }

  const scopeRecords = targetRecord ? scopeOf(targetRecord, records) : records
  const scopeNodes = new Set(scopeRecords.map((record) => record.node))
  const rootFrames = targetRecord
    ? targetRecord.node.type === 'frame'
      ? [targetRecord.node]
      : []
    : (Array.isArray(page.children) ? page.children : []).filter((node) => isRecord(node) && node.type === 'frame')

  const stylesById = mapById(doc.styles)
  const componentsById = mapById(doc.components)
  const system = options.system === 'ios' ? 'ios' : 'material3'

  /** @type {Array<any>} */
  const findings = []
  /** @type {Set<string>} */
  const skipped = new Set(BASE_SKIPPED)

  if (scopeRecords.some((record) => record.node.type === 'instance')) {
    skipped.add('component instance contents')
  }

  runScreenshotBoundary(rootFrames, recordByNode, stylesById, findings)
  runContrast(scopeRecords, page, stylesById, skipped, findings)
  runTouchTargets(scopeRecords, componentsById, system, findings)
  runClippedChildren(scopeRecords, recordByNode, findings)
  runZeroSize(scopeRecords, findings)
  runMissingRefs(scopeNodes, componentsById, stylesById, findings)
  runUnresolvedComments(doc, page, targetRecord, scopeNodes, findings)
  runEmptyFrames(rootFrames, recordByNode, findings)

  return { findings, checked: [...AUDIT_CHECKS], skipped: [...skipped] }
}

// ---------------------------------------------------------------------------
// Document traversal
// ---------------------------------------------------------------------------

/** @param {any[]} pages @param {{pageId?: string, nodeId?: string}} options */
function selectPage(pages, options) {
  if (options.pageId != null) {
    const page = pages.find((entry) => isRecord(entry) && entry.id === options.pageId)
    if (!page) throw new Error(`auditDoc: unknown page "${String(options.pageId)}"`)
    if (options.nodeId != null && !findNode(page, options.nodeId)) {
      throw new Error(`auditDoc: unknown node "${String(options.nodeId)}"`)
    }
    return page
  }
  if (options.nodeId != null) {
    const page = pages.find((entry) => isRecord(entry) && findNode(entry, options.nodeId))
    if (!page) throw new Error(`auditDoc: unknown node "${String(options.nodeId)}"`)
    return page
  }
  const page = pages.find(isRecord)
  if (!page) throw new Error('auditDoc: document has no pages')
  return page
}

/** @param {any} root @param {string} nodeId */
function findNode(root, nodeId) {
  if (!isRecord(root)) return null
  if (root.id === nodeId) return root
  if (!Array.isArray(root.children)) return null
  for (const child of root.children) {
    const found = findNode(child, nodeId)
    if (found) return found
  }
  return null
}

/**
 * Flatten a page into pre-order records with the real ancestor chain and the
 * inherited visibility/opacity, which the contrast check needs.
 * @param {any} page
 */
function indexPage(page) {
  /** @type {Array<{node: any, ancestors: any[], parent: any|null, visible: boolean, opacity: number}>} */
  const records = []
  const seen = new WeakSet()
  const visit = (node, ancestors, parent, inheritedVisible, inheritedOpacity) => {
    if (!isRecord(node) || seen.has(node)) return
    seen.add(node)
    const visible = inheritedVisible && node.visible !== false
    const opacity = inheritedOpacity * clamp01(numberOr(node.opacity, 1))
    records.push({ node, ancestors, parent, visible, opacity })
    if (!Array.isArray(node.children)) return
    for (const child of node.children) {
      visit(child, [...ancestors, node], node, visible, opacity)
    }
  }
  for (const root of Array.isArray(page.children) ? page.children : []) {
    visit(root, [], null, true, 1)
  }
  return records
}

/**
 * Records belonging to the selected root's subtree.
 * @param {{node: any}} targetRecord
 * @param {Array<{node: any, ancestors: any[]}>} records
 */
function scopeOf(targetRecord, records) {
  const target = targetRecord.node
  return records.filter((record) => record.node === target || record.ancestors.includes(target))
}

/** @param {any[]} list */
function mapById(list) {
  /** @type {Map<string, any>} */
  const map = new Map()
  if (!Array.isArray(list)) return map
  for (const entry of list) {
    if (isRecord(entry) && typeof entry.id === 'string') map.set(entry.id, entry)
  }
  return map
}

// ---------------------------------------------------------------------------
// 1. screenshot-boundary
// ---------------------------------------------------------------------------

/**
 * A screenshot frame needs square corners and an opaque solid first fill.
 * @param {any[]} rootFrames
 * @param {Map<any, {visible: boolean}>} recordByNode
 * @param {Map<string, any>} stylesById
 * @param {any[]} findings
 */
function runScreenshotBoundary(rootFrames, recordByNode, stylesById, findings) {
  for (const frame of rootFrames) {
    const record = recordByNode.get(frame)
    if (record && !record.visible) continue

    const radius = numberOr(frame.cornerRadius, 0)
    const fills = resolvedFills(frame, stylesById)
    const first = fills[0] ?? null
    const color = first && first.type === 'solid' ? parseColor(first.color) : null
    const alpha = color ? clamp01(color.a * fillOpacity(first) * nodeOpacity(frame)) : 0
    const opaqueGradient = first && (first.type === 'linear-gradient' || first.type === 'radial-gradient') && gradientIsOpaque(first)
    const rounded = radius > 0
    const opaque = alpha >= 1 - ALPHA_EPSILON || Boolean(opaqueGradient)
    if (!rounded && opaque) continue

    const reasons = []
    if (rounded) reasons.push(`corner radius ${formatNumber(radius)}`)
    if (!opaque) {
      if (!first) reasons.push('no first fill')
      else if (first.type !== 'solid') reasons.push(`first fill is ${first.type}`)
      else reasons.push(`first fill alpha ${formatNumber(alpha)}`)
    }

    findings.push(
      finding('high', 'screenshot-boundary', frame, `Screenshot frame ${quote(nameOf(frame))} is not screenshot-ready: ${reasons.join(' and ')}.`, {
        cornerRadius: round(radius, 2),
        rounded,
        fillType: first ? first.type : null,
        alpha: round(alpha, 3),
        opaque,
      }),
    )
  }
}

// ---------------------------------------------------------------------------
// 2. contrast
// ---------------------------------------------------------------------------

/**
 * WCAG 2 contrast for text with a solid first fill against the nearest opaque
 * ancestor fill (or the page background, defaulting to white).
 * @param {Array<{node: any, ancestors: any[], visible: boolean, opacity: number}>} scopeRecords
 * @param {any} page
 * @param {Map<string, any>} stylesById
 * @param {Set<string>} skipped
 * @param {any[]} findings
 */
function runContrast(scopeRecords, page, stylesById, skipped, findings) {
  for (const record of scopeRecords) {
    const node = record.node
    if (node.type !== 'text' || !record.visible) continue
    const content = typeof node.text === 'string' ? node.text : ''
    if (content.trim() === '') continue

    const fills = resolvedFills(node, stylesById)
    const first = fills[0]
    if (!first) continue
    if (first.type !== 'solid') {
      skipped.add('gradient/image backgrounds')
      continue
    }
    const fillColor = parseColor(first.color)
    if (!fillColor) continue

    // Node/ancestor opacity cannot be reduced to a single contrast pair.
    if (record.opacity < 1 - ALPHA_EPSILON) {
      skipped.add('opacity/blur')
      continue
    }
    if (hasBlur(node, stylesById) || record.ancestors.some((ancestor) => hasBlur(ancestor, stylesById))) {
      skipped.add('opacity/blur')
      continue
    }

    if (isDecorativeText(node, content)) {
      skipped.add('decorative text')
      continue
    }

    const textAlpha = clamp01(fillColor.a * fillOpacity(first))
    if (textAlpha <= 0) {
      skipped.add('opacity/blur')
      continue
    }

    const background = resolveBackdrop(record, page, stylesById, skipped)
    if (!background) continue

    // Composite a translucent text fill over the resolved background.
    const foreground = compositeOver({ ...fillColor, a: textAlpha }, background)
    const ratio = contrastRatio(foreground, background)
    const font = resolvedFont(node, stylesById)
    const largeText = isLargeText(font)
    const required = largeText ? LARGE_CONTRAST : BODY_CONTRAST
    if (ratio + ALPHA_EPSILON >= required) continue

    const ratioRounded = round(ratio, 2)
    findings.push(
      finding(
        largeText ? 'medium' : 'high',
        'contrast',
        node,
        `Text ${quote(nameOf(node))} has ${ratioRounded.toFixed(2)}:1 contrast against ${colorToHex(background)}, below the ${required}:1 minimum for ${largeText ? 'large' : 'body'} text.`,
        {
          ratio: ratioRounded,
          required,
          largeText,
          fontSize: round(font.size, 2),
          fontWeight: font.weight,
          foreground: colorToHex(foreground),
          background: colorToHex(background),
        },
      ),
    )
  }
}

/** Decorative glyph/text nodes should not produce contrast findings. */
function isDecorativeText(node, content) {
  const name = String(node?.name ?? '')
  if (/sparkle|heart|decoration|ornament/i.test(name)) return true
  const trimmed = String(content ?? '').trim()
  return trimmed.length <= 2 && /[✦✧♥♡✓✔]/u.test(trimmed)
}

/** True when every gradient stop is opaque (so the frame is screenshot-ready). */
function gradientIsOpaque(fill) {
  const stops = Array.isArray(fill?.stops) ? fill.stops : []
  if (!stops.length) return false
  return stops.every((stop) => {
    if (!isRecord(stop)) return false
    const color = parseColor(stop.color)
    return color != null && color.a >= 1 - ALPHA_EPSILON
  })
}

/**
 * A text may sit above an opaque sibling rectangle/frame rather than inside a
 * filled ancestor (buttons, CTAs). Use the nearest preceding sibling that
 * contains the text center and has a solid opaque fill.
 * @param {{node: any, parent: any|null}} record
 * @param {Map<string, any>} stylesById
 */
function resolveSiblingBackdrop(record, stylesById) {
  const parent = record.parent
  if (!parent || !Array.isArray(parent.children)) return null
  const index = parent.children.indexOf(record.node)
  if (index <= 0) return null
  const node = record.node
  const center = {
    x: numberOr(node.x, 0) + numberOr(node.width, 0) / 2,
    y: numberOr(node.y, 0) + numberOr(node.height, 0) / 2,
  }
  for (let siblingIndex = index - 1; siblingIndex >= 0; siblingIndex -= 1) {
    const sibling = parent.children[siblingIndex]
    if (!isRecord(sibling) || sibling.visible === false) continue
    if (!['rect', 'frame', 'ellipse'].includes(sibling.type)) continue
    const x = numberOr(sibling.x, 0)
    const y = numberOr(sibling.y, 0)
    const width = numberOr(sibling.width, 0)
    const height = numberOr(sibling.height, 0)
    if (width <= 0 || height <= 0) continue
    if (center.x < x || center.x > x + width || center.y < y || center.y > y + height) continue
    const first = resolvedFills(sibling, stylesById)[0]
    if (!first || first.type !== 'solid') continue
    const color = parseColor(first.color)
    if (!color) continue
    const alpha = clamp01(color.a * fillOpacity(first) * nodeOpacity(sibling))
    if (alpha < 1 - ALPHA_EPSILON) continue
    return { r: color.r, g: color.g, b: color.b }
  }
  return null
}

/**
 * Nearest ancestor with a solid opaque first fill, then the page background.
 * Returns null when the backdrop cannot be determined (gradient/image/opacity).
 * @param {{ancestors: any[]}} record
 * @param {any} page
 * @param {Map<string, any>} stylesById
 * @param {Set<string>} skipped
 */
function resolveBackdrop(record, page, stylesById, skipped) {
  const sibling = resolveSiblingBackdrop(record, stylesById)
  if (sibling) return sibling
  for (let index = record.ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = record.ancestors[index]
    const first = resolvedFills(ancestor, stylesById)[0]
    if (!first) continue
    if (first.type !== 'solid') {
      skipped.add('gradient/image backgrounds')
      return null
    }
    const color = parseColor(first.color)
    if (!color) return null
    const alpha = clamp01(color.a * fillOpacity(first) * pathOpacity(record.ancestors, index))
    if (alpha < 1 - ALPHA_EPSILON) {
      skipped.add('opacity/blur')
      return null
    }
    return { r: color.r, g: color.g, b: color.b }
  }
  return pageBackdrop(page)
}

/** @param {any} page */
function pageBackdrop(page) {
  const raw = isRecord(page) && typeof page.background === 'string' ? parseColor(page.background) : null
  const white = parseColor(DEFAULT_PAGE_BACKGROUND)
  if (!raw) return white
  if (raw.a >= 1 - ALPHA_EPSILON) return { r: raw.r, g: raw.g, b: raw.b }
  return compositeOver(raw, white)
}

/** @param {any[]} ancestors @param {number} endIndex */
function pathOpacity(ancestors, endIndex) {
  let value = 1
  for (let index = 0; index <= endIndex; index += 1) {
    value *= clamp01(numberOr(ancestors[index]?.opacity, 1))
  }
  return value
}

/** @param {any} node @param {Map<string, any>} stylesById */
function resolvedFont(node, stylesById) {
  let font = isRecord(node.font) ? node.font : {}
  if (node.textStyleId != null) {
    const style = stylesById.get(node.textStyleId)
    if (style && style.type === 'text' && isRecord(style.value) && isRecord(style.value.font)) {
      font = { ...font, ...style.value.font }
    }
  }
  return {
    ...font,
    size: numberOr(font.size, DEFAULT_FONT_SIZE),
    weight: numberOr(font.weight, DEFAULT_FONT_WEIGHT),
  }
}

/** @param {{size: number, weight: number}} font */
function isLargeText(font) {
  return font.size >= 24 || (font.size >= 18.66 && font.weight >= 700)
}

// ---------------------------------------------------------------------------
// 3. touch-target
// ---------------------------------------------------------------------------

/**
 * Heuristic: an interactively-named node smaller than the platform minimum in
 * either dimension. Only the node box is measured, not the real hit area.
 * @param {Array<{node: any, visible: boolean}>} scopeRecords
 * @param {Map<string, any>} componentsById
 * @param {'ios'|'material3'} system
 * @param {any[]} findings
 */
function runTouchTargets(scopeRecords, componentsById, system, findings) {
  const minimum = system === 'ios' ? IOS_TOUCH_TARGET : MATERIAL3_TOUCH_TARGET
  for (const record of scopeRecords) {
    if (!record.visible) continue
    const node = record.node
    const width = finiteNumber(node.width)
    const height = finiteNumber(node.height)
    if (width == null || height == null) continue

    const match = matchInteractiveName(node, componentsById)
    if (!match) continue
    if (width >= minimum && height >= minimum) continue

    findings.push(
      finding(
        'medium',
        'touch-target',
        node,
        `${quote(nameOf(node))} is ${formatNumber(width)}x${formatNumber(height)}, smaller than the ${minimum}x${minimum} minimum touch target (${system} heuristic).`,
        {
          system,
          minSize: minimum,
          width: round(width, 2),
          height: round(height, 2),
          matchedOn: match.source,
          matchedText: match.text,
          matchedKeyword: match.keyword,
          heuristic: true,
          note: 'Heuristic: the node name or its source component name matched an interactive pattern; only the node box is measured, not the real hit area.',
        },
      ),
    )
  }
}

/**
 * @param {any} node
 * @param {Map<string, any>} componentsById
 * @returns {{source: 'name'|'componentName', text: string, keyword: string}|null}
 */
function matchInteractiveName(node, componentsById) {
  const candidates = []
  if (typeof node.name === 'string') candidates.push({ source: 'name', text: node.name })
  if (node.type === 'instance' && typeof node.componentId === 'string') {
    const component = componentsById.get(node.componentId)
    if (component && typeof component.name === 'string') {
      candidates.push({ source: 'componentName', text: component.name })
    }
  }
  for (const candidate of candidates) {
    const match = TOUCH_TARGET_RE.exec(candidate.text)
    if (match) return { ...candidate, keyword: match[0] }
  }
  return null
}

// ---------------------------------------------------------------------------
// 4. clipped-child
// ---------------------------------------------------------------------------

/**
 * Visible direct children of a clipping frame whose axis-aligned box crosses
 * the frame edge. Rotation is ignored on purpose.
 * @param {Array<{node: any, visible: boolean}>} scopeRecords
 * @param {Map<any, {visible: boolean}>} recordByNode
 * @param {any[]} findings
 */
function runClippedChildren(scopeRecords, recordByNode, findings) {
  for (const record of scopeRecords) {
    const frame = record.node
    if (frame.type !== 'frame' || frame.clip === false || !record.visible) continue
    const frameWidth = finiteNumber(frame.width)
    const frameHeight = finiteNumber(frame.height)
    if (frameWidth == null || frameHeight == null) continue

    for (const child of Array.isArray(frame.children) ? frame.children : []) {
      if (!isRecord(child)) continue
      const childRecord = recordByNode.get(child)
      if (!childRecord || !childRecord.visible) continue
      const x = numberOr(child.x, 0)
      const y = numberOr(child.y, 0)
      const width = finiteNumber(child.width)
      const height = finiteNumber(child.height)
      if (width == null || height == null) continue

      const overflow = {
        left: Math.max(0, -x),
        top: Math.max(0, -y),
        right: Math.max(0, x + width - frameWidth),
        bottom: Math.max(0, y + height - frameHeight),
      }
      if (Math.max(overflow.left, overflow.top, overflow.right, overflow.bottom) <= EPSILON) continue

      const parts = []
      if (overflow.left > EPSILON) parts.push(`left ${formatNumber(overflow.left)}`)
      if (overflow.top > EPSILON) parts.push(`top ${formatNumber(overflow.top)}`)
      if (overflow.right > EPSILON) parts.push(`right ${formatNumber(overflow.right)}`)
      if (overflow.bottom > EPSILON) parts.push(`bottom ${formatNumber(overflow.bottom)}`)

      findings.push(
        finding(
          'low',
          'clipped-child',
          child,
          `${quote(nameOf(child))} overflows clipping frame ${quote(nameOf(frame))} (${parts.join(', ')}); this may be intentional.`,
          {
            frameId: typeof frame.id === 'string' ? frame.id : '',
            frameName: nameOf(frame),
            overflow: {
              left: round(overflow.left, 3),
              top: round(overflow.top, 3),
              right: round(overflow.right, 3),
              bottom: round(overflow.bottom, 3),
            },
          },
        ),
      )
    }
  }
}

// ---------------------------------------------------------------------------
// 5. zero-size
// ---------------------------------------------------------------------------

/**
 * Visible nodes with a non-positive width or height. A `line` with a positive
 * length is exempt because height 0 is its documented representation
 * (width = length); a zero-length line is still reported.
 * @param {Array<{node: any, visible: boolean}>} scopeRecords
 * @param {any[]} findings
 */
function runZeroSize(scopeRecords, findings) {
  for (const record of scopeRecords) {
    if (!record.visible) continue
    const node = record.node
    const width = finiteNumber(node.width)
    const height = finiteNumber(node.height)
    if (width == null || height == null) continue
    if (node.type === 'line' && width > 0) continue
    if (width > 0 && height > 0) continue

    const axis = width <= 0 && height <= 0 ? 'both' : width <= 0 ? 'width' : 'height'
    findings.push(
      finding('medium', 'zero-size', node, `${quote(nameOf(node))} has zero size (${formatNumber(width)}x${formatNumber(height)}) and will not render.`, {
        width: round(width, 2),
        height: round(height, 2),
        axis,
      }),
    )
  }
}

// ---------------------------------------------------------------------------
// 6. missing-refs
// ---------------------------------------------------------------------------

/**
 * Broken component/style/image references. Checked on every node in scope,
 * including hidden nodes, because reference integrity is structural.
 * @param {Set<any>} scopeNodes
 * @param {Map<string, any>} componentsById
 * @param {Map<string, any>} stylesById
 * @param {any[]} findings
 */
function runMissingRefs(scopeNodes, componentsById, stylesById, findings) {
  for (const node of scopeNodes) {
    if (node.type === 'instance') {
      const componentId = typeof node.componentId === 'string' ? node.componentId : null
      if (!componentId || !componentsById.has(componentId)) {
        findings.push(
          finding(
            'high',
            'missing-refs',
            node,
            componentId
              ? `Instance ${quote(nameOf(node))} references unknown component "${componentId}".`
              : `Instance ${quote(nameOf(node))} has no componentId.`,
            {
              reference: 'componentId',
              componentId,
              reason: componentId ? 'unknown' : 'missing',
            },
          ),
        )
      }
    }

    for (const [reference, expectedType] of STYLE_REFS) {
      const styleId = node[reference]
      if (styleId == null) continue
      if (!stylesById.has(styleId)) {
        findings.push(
          finding('high', 'missing-refs', node, `${quote(nameOf(node))} references unknown ${expectedType} style "${String(styleId)}".`, {
            reference,
            styleId: String(styleId),
            expectedType,
          }),
        )
      }
    }

    const fills = resolvedFills(node, stylesById)
    for (let index = 0; index < fills.length; index += 1) {
      const fill = fills[index]
      if (!isRecord(fill) || fill.type !== 'image') continue
      if (typeof fill.asset !== 'string' || fill.asset.trim() === '') {
        findings.push(
          finding('high', 'missing-refs', node, `${quote(nameOf(node))} has an image fill without an asset reference.`, {
            reference: 'image.asset',
            fillIndex: index,
            asset: null,
            reason: 'missing',
          }),
        )
      } else if (!IMAGE_ASSET_RE.test(fill.asset) || fill.asset.includes('..')) {
        findings.push(
          finding('high', 'missing-refs', node, `${quote(nameOf(node))} has an image fill with an invalid asset path "${fill.asset}".`, {
            reference: 'image.asset',
            fillIndex: index,
            asset: fill.asset,
            reason: 'invalid',
          }),
        )
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 7. unresolved-comments
// ---------------------------------------------------------------------------

/**
 * One low finding per audit scope with the number of unresolved comments.
 * @param {any} doc
 * @param {any} page
 * @param {{node: any}|null} targetRecord
 * @param {Set<any>} scopeNodes
 * @param {any[]} findings
 */
function runUnresolvedComments(doc, page, targetRecord, scopeNodes, findings) {
  const comments = Array.isArray(doc.comments) ? doc.comments.filter(isRecord) : []
  const scopeNodeIds = new Set()
  for (const node of scopeNodes) if (typeof node.id === 'string') scopeNodeIds.add(node.id)

  const inScope = targetRecord
    ? comments.filter((comment) => typeof comment.nodeId === 'string' && scopeNodeIds.has(comment.nodeId))
    : comments.filter((comment) => comment.pageId === page.id)
  const unresolved = inScope.filter((comment) => comment.resolved !== true)
  if (unresolved.length === 0) return

  const anchor = targetRecord ? targetRecord.node : page
  const commentIds = unresolved.map((comment) => (typeof comment.id === 'string' ? comment.id : null))
  const where = targetRecord
    ? `in node ${quote(nameOf(anchor))} and its subtree`
    : `on page ${quote(nameOf(page))}`
  findings.push(
    finding(
      'low',
      'unresolved-comments',
      anchor,
      `${unresolved.length} unresolved comment${unresolved.length === 1 ? '' : 's'} ${where}.`,
      {
        count: unresolved.length,
        commentIds,
        scope: targetRecord ? 'node' : 'page',
      },
    ),
  )
}

// ---------------------------------------------------------------------------
// 8. empty-frame
// ---------------------------------------------------------------------------

/**
 * A visible top-level (or selected) frame without visible children.
 * @param {any[]} rootFrames
 * @param {Map<any, {visible: boolean}>} recordByNode
 * @param {any[]} findings
 */
function runEmptyFrames(rootFrames, recordByNode, findings) {
  for (const frame of rootFrames) {
    const record = recordByNode.get(frame)
    if (record && !record.visible) continue
    const children = Array.isArray(frame.children) ? frame.children : []
    const visibleChildren = children.filter((child) => {
      if (!isRecord(child)) return false
      const childRecord = recordByNode.get(child)
      return childRecord ? childRecord.visible : child.visible !== false
    })
    if (visibleChildren.length > 0) continue

    findings.push(
      finding('low', 'empty-frame', frame, `Frame ${quote(nameOf(frame))} has no visible children.`, {
        childCount: children.length,
        visibleChildCount: 0,
      }),
    )
  }
}

// ---------------------------------------------------------------------------
// Styles, fills and colors
// ---------------------------------------------------------------------------

/**
 * Resolve the paint stack of a node, honoring fill/text style references.
 * A missing or mistyped style falls back to the literal fills so the visual
 * checks can still run (missing-refs reports the broken reference separately).
 * @param {any} node
 * @param {Map<string, any>} stylesById
 * @returns {any[]}
 */
function resolvedFills(node, stylesById) {
  if (!isRecord(node)) return []
  if (node.fillStyleId != null) {
    const style = stylesById.get(node.fillStyleId)
    if (style && style.type === 'fill' && isRecord(style.value)) return [style.value]
  }
  if (node.type === 'text' && node.textStyleId != null) {
    const style = stylesById.get(node.textStyleId)
    if (style && style.type === 'text' && isRecord(style.value) && Array.isArray(style.value.fills)) {
      return style.value.fills
    }
  }
  return Array.isArray(node.fills) ? node.fills : []
}

/** @param {any} node @param {Map<string, any>} stylesById */
function resolvedEffects(node, stylesById) {
  if (!isRecord(node)) return []
  if (node.effectStyleId != null) {
    const style = stylesById.get(node.effectStyleId)
    if (style && style.type === 'effect' && Array.isArray(style.value)) return style.value
  }
  return Array.isArray(node.effects) ? node.effects : []
}

/** @param {any} node @param {Map<string, any>} stylesById */
function hasBlur(node, stylesById) {
  return resolvedEffects(node, stylesById).some(
    (effect) =>
      isRecord(effect) &&
      effect.visible !== false &&
      (effect.type === 'layer-blur' || effect.type === 'background-blur') &&
      numberOr(effect.radius, 0) > 0,
  )
}

/** @param {any} fill */
function fillOpacity(fill) {
  return clamp01(numberOr(fill?.opacity, 1))
}

/** @param {any} node */
function nodeOpacity(node) {
  return clamp01(numberOr(node?.opacity, 1))
}

/**
 * Parse a #RRGGBB / #RRGGBBAA color into 0-255 channels and 0-1 alpha.
 * @param {unknown} value
 * @returns {{r: number, g: number, b: number, a: number}|null}
 */
function parseColor(value) {
  if (typeof value !== 'string') return null
  const match = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(value.trim())
  if (!match) return null
  const hex = match[1]
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
    a: match[2] ? Number.parseInt(match[2], 16) / 255 : 1,
  }
}

/**
 * Composite an RGBA foreground over an opaque background.
 * @param {{r: number, g: number, b: number, a: number}} foreground
 * @param {{r: number, g: number, b: number}} background
 */
function compositeOver(foreground, background) {
  const alpha = clamp01(foreground.a)
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
  }
}

/** @param {{r: number, g: number, b: number}} color */
function relativeLuminance(color) {
  const channel = (value) => {
    const normalized = value / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
}

/** @param {{r: number, g: number, b: number}} a @param {{r: number, g: number, b: number}} b */
function contrastRatio(a, b) {
  const first = relativeLuminance(a)
  const second = relativeLuminance(b)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

/** @param {{r: number, g: number, b: number}} color */
function colorToHex(color) {
  const channel = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0').toUpperCase()
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`
}

// ---------------------------------------------------------------------------
// Findings and small helpers
// ---------------------------------------------------------------------------

/** @param {string} severity @param {string} code @param {any} node @param {string} message @param {object} [data] */
function finding(severity, code, node, message, data) {
  const nodeId = isRecord(node) && typeof node.id === 'string' ? node.id : ''
  const nodeName = nameOf(node)
  const result = { severity, code, nodeId, nodeName, message }
  if (data !== undefined) result.data = data
  return result
}

/** @param {any} node */
function nameOf(node) {
  if (isRecord(node) && typeof node.name === 'string' && node.name !== '') return node.name
  if (isRecord(node) && typeof node.id === 'string') return node.id
  return ''
}

/** @param {string} value */
function quote(value) {
  return JSON.stringify(value)
}

/** @param {unknown} value @returns {value is Record<string, any>} */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @param {unknown} value @returns {number|null} */
function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** @param {unknown} value @param {number} fallback */
function numberOr(value, fallback) {
  return finiteNumber(value) ?? fallback
}

/** @param {number} value */
function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

/** @param {number} value @param {number} digits */
function round(value, digits) {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/** @param {number} value */
function formatNumber(value) {
  return String(round(value, 3))
}
