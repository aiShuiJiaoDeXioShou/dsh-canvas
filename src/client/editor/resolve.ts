// @ts-nocheck
/**
 * dsh.canvas@1 — document → render-tree ("scene") resolver.
 *
 * The scene is a plain-object snapshot shared by the DOM renderer, the
 * interaction layer and the SVG/PNG exporters. Resolving never mutates the
 * document and never touches the DOM; text measurement is injected so the same
 * code runs in the browser bundle and in Node tests.
 *
 * Pipeline used by the editor store:
 *
 *   const measure = createTextMeasurer()
 *   const scene = buildScene(doc, { pageId, mode, componentId, measureText: measure })
 *   layoutScene(scene)             // fills lines, hug sizes, absX/absY
 *   scene.rebuild()                // re-resolve + re-layout (e.g. after fonts load)
 *
 * Scene shape:
 *   { pageId, title, mode, roots, byKey, bySourceId, componentById, styleById,
 *     issues, editable?, ... }
 *
 * `RNode` shape (one object per painted node):
 *   key, id, sourceId, instanceId?, type, name,
 *   x, y, width, height, rotation, opacity, visible, locked,
 *   fill, fills (alias), strokes, effects, cornerRadius, clip,
 *   font?, lines?, align?, verticalAlign?, text?,
 *   layout?, layoutSizing?, children, sourceNode,
 *   editable, isInstanceRoot, componentId?, variantProps?, overrides?, parent?
 *
 * `fill` / `fills` are the same resolved fill array (fillStyleId applied).
 * Instance internals are resolved against the component tree with the
 * instance's `overrides` applied; they are never `editable` (override editing
 * goes through `instanceId` + `sourceId`). Component cycles degrade to empty
 * instances and are reported in `scene.issues` instead of throwing.
 */

import { createTextMeasurer } from './text-measure.js'
import { layoutScene } from './layout.js'

const MAX_COMPONENT_DEPTH = 24
const MAX_SCENE_NODES = 20000
const DEFAULT_FONT = Object.freeze({
  family: 'system-ui',
  weight: 400,
  style: 'normal',
  size: 14,
  lineHeight: 1.4,
  letterSpacing: 0,
})
const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify'])
const VERTICAL_ALIGNMENTS = new Set(['top', 'center', 'bottom'])
const SIZINGS = new Set(['fixed', 'hug', 'fill'])

/**
 * Resolve a normalized (or at least well-formed) dsh.canvas document into a
 * scene tree. Never throws for malformed references; problems are recorded as
 * strings in `scene.issues`.
 *
 * @param {any} doc
 * @param {{
 *   pageId?: string,
 *   mode?: 'design'|'component',
 *   componentId?: string,
 *   measureText?: Function,
 *   viewportWidth?: number,
 * }} [options]
 * @returns {any} scene
 */
export function buildScene(doc, options = {}) {
  const source = isObject(doc) ? doc : {}
  const settings = isObject(options) ? { ...options } : {}
  const issues = []
  if (!isObject(doc)) issues.push('document is missing or malformed')

  const mode = settings.mode === 'component' ? 'component' : 'design'
  const measureText =
    typeof settings.measureText === 'function' ? settings.measureText : createTextMeasurer()

  /** @type {Map<string, any>} */
  const componentById = new Map()
  for (const component of Array.isArray(source.components) ? source.components : []) {
    if (isObject(component) && typeof component.id === 'string') componentById.set(component.id, component)
  }
  /** @type {Map<string, any>} */
  const styleById = new Map()
  for (const style of Array.isArray(source.styles) ? source.styles : []) {
    if (isObject(style) && typeof style.id === 'string') styleById.set(style.id, style)
  }
  /** @type {Map<string, any>} */
  const variantSetById = new Map()
  for (const set of Array.isArray(source.variantSets) ? source.variantSets : []) {
    if (isObject(set) && typeof set.id === 'string') variantSetById.set(set.id, set)
  }

  /** @type {Map<string, any>} */
  const byKey = new Map()
  /** @type {Map<string, any[]>} */
  const bySourceId = new Map()

  const ctx = {
    issues,
    componentById,
    styleById,
    variantSetById,
    byKey,
    bySourceId,
    nodeCount: 0,
    budgetIssued: false,
    componentStack: [],
  }

  /** @type {any[]} */
  const roots = []
  const page = mode === 'design' ? selectPage(source, settings.pageId, issues) : null
  if (mode === 'design') {
    if (page) {
      const list = Array.isArray(page.children) ? page.children : []
      for (const child of list) {
        if (!isObject(child)) {
          issues.push('skipped a malformed page child')
          continue
        }
        const node = resolveEntry(
          child,
          {
            key: typeof child.id === 'string' ? child.id : `node-${roots.length}`,
            keyPrefix: null,
            instanceId: null,
            editable: true,
            overrides: null,
            parent: null,
          },
          ctx,
        )
        if (node) roots.push(node)
      }
    }
  } else {
    const componentId = typeof settings.componentId === 'string' ? settings.componentId : null
    const component = componentId ? componentById.get(componentId) : null
    if (!component || !isObject(component.root)) {
      issues.push(`component mode: unknown component "${String(componentId)}"`)
    } else {
      const root = component.root
      const node = resolveEntry(
        root,
        {
          key: typeof root.id === 'string' ? root.id : 'component-root',
          keyPrefix: null,
          instanceId: null,
          editable: true,
          overrides: null,
          parent: null,
        },
        ctx,
      )
      if (node) roots.push(node)
    }
  }

  const scene = {
    pageId: page && typeof page.id === 'string' ? page.id : null,
    title: typeof source.title === 'string' ? source.title : '',
    mode,
    roots,
    byKey,
    bySourceId,
    componentById,
    styleById,
    issues,
    componentId: mode === 'component' && typeof settings.componentId === 'string' ? settings.componentId : null,
    viewportWidth: numberOr(settings.viewportWidth, null),
    page,
    background: page && typeof page.background === 'string' ? page.background : null,
    doc: source,
    measureText,
    options: settings,
  }
  attachRebuild(scene, doc, settings)
  return scene
}

// ─────────────────────────────── node resolution ───────────────────────────────

/**
 * @param {any} source
 * @param {{key: string, keyPrefix: string|null, instanceId: string|null, editable: boolean, overrides: any, parent: any}} env
 * @param {any} ctx
 */
function resolveEntry(source, env, ctx) {
  if (!isObject(source)) {
    ctx.issues.push(`skipped a malformed node at "${env.key}"`)
    return null
  }
  ctx.nodeCount += 1
  if (ctx.nodeCount > MAX_SCENE_NODES) {
    if (!ctx.budgetIssued) {
      ctx.issues.push(`scene exceeds ${MAX_SCENE_NODES} nodes; remaining children were skipped`)
      ctx.budgetIssued = true
    }
    return null
  }
  return source.type === 'instance' ? resolveInstance(source, env, ctx) : resolveNode(source, env, ctx)
}

/**
 * Resolve a plain (non-instance) document node.
 * @param {any} source
 * @param {any} env
 * @param {any} ctx
 */
function resolveNode(source, env, ctx) {
  const node = createBaseNode(source, env)
  const type = node.type
  const patch = lookupOverride(env.overrides, source.id)

  if (type === 'frame' || type === 'rect' || type === 'ellipse' || type === 'path') {
    applyPaint(node, source, ctx, patch)
    if (type === 'frame') node.layout = isObject(source.layout) ? source.layout : undefined
    if (type === 'path') {
      node.d = source.d
      node.viewBox = source.viewBox
      node.fillRule = source.fillRule ?? 'nonzero'
    }
  } else if (type === 'text') {
    const font = applyPaint(node, source, ctx, patch)
    applyText(node, source, font, patch)
  } else if (type === 'line') {
    node.strokes = Array.isArray(source.strokes) ? source.strokes : []
  }
  if (patch && typeof patch.visible === 'boolean') node.visible = patch.visible

  if (type === 'frame' || type === 'group') {
    node.children = resolveChildList(
      source,
      node,
      {
        prefix: env.keyPrefix ?? null,
        instanceId: env.instanceId ?? null,
        editable: node.editable,
        overrides: env.overrides ?? null,
      },
      ctx,
    )
  } else {
    node.children = []
  }
  registerNode(node, ctx)
  return node
}

/**
 * Resolve an instance: the instance node supplies identity + geometry, the
 * referenced component root supplies visuals, layout and children.
 * @param {any} source
 * @param {any} env
 * @param {any} ctx
 */
function resolveInstance(source, env, ctx) {
  const node = createBaseNode(source, env)
  node.type = 'instance'
  node.isInstanceRoot = true
  const instanceId = env.instanceId != null ? env.instanceId : env.key
  node.instanceId = instanceId
  const ownOverrides = isObject(source.overrides) ? source.overrides : {}
  node.overrides = ownOverrides
  node.variantProps = isObject(source.variantProps) ? { ...source.variantProps } : {}
  node.componentId = source.componentId
  const outerPatch = lookupOverride(env.overrides, source.id)

  const component = pinVariant(source, ctx)
  const rootSource = component && isObject(component.root) ? component.root : null
  if (component) {
    node.componentId = component.id
    node.variantProps = {
      ...(isObject(component.variantProps) ? component.variantProps : {}),
      ...(isObject(source.variantProps) ? source.variantProps : {}),
    }
  }

  if (rootSource) {
    const rootPatch = lookupOverride(ownOverrides, rootSource.id)
    const font = applyPaint(node, rootSource, ctx, rootPatch)
    if (source.cornerRadius != null) node.cornerRadius = Math.max(0, numberOr(source.cornerRadius, 0))
    node.visible = node.visible && rootSource.visible !== false
    if (rootSource.type === 'text') {
      applyText(node, rootSource, font, rootPatch)
      node.lines = []
    }
    if (rootSource.type === 'path') {
      node.d = rootSource.d
      node.viewBox = rootSource.viewBox
      node.fillRule = rootSource.fillRule ?? 'nonzero'
    }
    node.layout = isObject(rootSource.layout) ? rootSource.layout : undefined
    node.layoutSizing = pickSizing(source.layoutSizing)
    if (rootPatch && typeof rootPatch.visible === 'boolean') node.visible = rootPatch.visible
  }
  if (outerPatch && typeof outerPatch.visible === 'boolean') node.visible = outerPatch.visible

  if (component && rootSource) {
    if (ctx.componentStack.includes(component.id)) {
      ctx.issues.push(
        `component cycle: ${[...ctx.componentStack, component.id].join(' -> ')}; instance "${String(source.id)}" rendered empty`,
      )
    } else if (ctx.componentStack.length >= MAX_COMPONENT_DEPTH) {
      ctx.issues.push(
        `component nesting exceeds ${MAX_COMPONENT_DEPTH} at instance "${String(source.id)}"; rendered empty`,
      )
    } else {
      ctx.componentStack.push(component.id)
      try {
        node.children = resolveChildList(
          rootSource,
          node,
          {
            prefix: node.key,
            instanceId,
            editable: false,
            overrides: ownOverrides,
          },
          ctx,
        )
      } finally {
        ctx.componentStack.pop()
      }
    }
  }

  registerNode(node, ctx)
  return node
}

/**
 * Resolve `ownerSource.children` below `ownerNode`, mapping keys into the
 * instance namespace when `prefix` is set.
 * @param {any} ownerSource
 * @param {any} ownerNode
 * @param {{prefix: string|null, instanceId: string|null, editable: boolean, overrides: any}} options
 * @param {any} ctx
 */
function resolveChildList(ownerSource, ownerNode, options, ctx) {
  const list = Array.isArray(ownerSource.children) ? ownerSource.children : []
  const out = []
  for (const child of list) {
    if (!isObject(child)) {
      ctx.issues.push(`skipped a malformed child of "${String(ownerNode.id)}"`)
      continue
    }
    const childId = typeof child.id === 'string' ? child.id : `node-${options.prefix ?? ''}-${out.length}`
    const key = options.prefix ? `${options.prefix}::${childId}` : childId
    const node = resolveEntry(
      child,
      {
        key,
        keyPrefix: options.prefix ?? null,
        instanceId: options.instanceId ?? null,
        editable: options.editable !== false,
        overrides: options.overrides ?? null,
        parent: ownerNode,
      },
      ctx,
    )
    if (node) out.push(node)
  }
  return out
}

/** @param {any} source @param {any} env */
function createBaseNode(source, env) {
  const type = typeof source.type === 'string' ? source.type : 'rect'
  const id = typeof source.id === 'string' ? source.id : String(env.key)
  /** @type {any} */
  const node = {
    key: env.key,
    id,
    sourceId: id,
    type,
    name: typeof source.name === 'string' ? source.name : type,
    x: numberOr(source.x, 0),
    y: numberOr(source.y, 0),
    width: Math.max(0, numberOr(source.width, 0)),
    height: Math.max(0, numberOr(source.height, 0)),
    rotation: numberOr(source.rotation, 0),
    opacity: clamp01(numberOr(source.opacity, 1)),
    visible: source.visible !== false,
    locked: source.locked === true,
    fill: [],
    fills: [],
    strokes: [],
    effects: [],
    cornerRadius: 0,
    clip: false,
    children: [],
    sourceNode: source,
    editable: env.editable !== false,
    isInstanceRoot: false,
    parent: env.parent ?? null,
  }
  if (env.instanceId != null) node.instanceId = env.instanceId
  const sizing = pickSizing(source.layoutSizing)
  if (sizing) node.layoutSizing = sizing
  return node
}

// ─────────────────────────────── paint / text ───────────────────────────────

/**
 * Resolve fills/effects/strokes (style references first) and apply an optional
 * instance override. Returns the effective text font for text nodes.
 * @param {any} node
 * @param {any} source
 * @param {any} ctx
 * @param {any} patch
 */
function applyPaint(node, source, ctx, patch) {
  const resolved = resolveStyles(source, node, ctx)
  let fills = resolved.fills
  let effects = resolved.effects
  if (patch) {
    if (Array.isArray(patch.fills)) fills = patch.fills
  }
  node.fill = fills
  node.fills = fills
  node.effects = effects
  node.strokes = Array.isArray(source.strokes) ? source.strokes : []
  node.cornerRadius = Math.max(0, numberOr(source.cornerRadius, 0))
  node.clip = source.type === 'frame' ? source.clip !== false : false
  return resolved.font
}

/**
 * @param {any} node
 * @param {any} source
 * @param {any} font
 * @param {any} patch
 */
function applyText(node, source, font, patch) {
  node.text = typeof source.text === 'string' ? source.text : ''
  node.font = isObject(font) ? font : DEFAULT_FONT
  node.align = ALIGNMENTS.has(source.align) ? source.align : 'left'
  node.verticalAlign = VERTICAL_ALIGNMENTS.has(source.verticalAlign) ? source.verticalAlign : 'top'
  node.autoHeight = source.autoHeight !== false
  if (patch && typeof patch.text === 'string') node.text = patch.text
}

/**
 * Style references win over literal values. Missing or mistyped styles keep the
 * literal value and are reported in `scene.issues`.
 * @param {any} source
 * @param {any} node
 * @param {any} ctx
 * @returns {{fills: any[], effects: any[], font: any}}
 */
function resolveStyles(source, node, ctx) {
  let fills = Array.isArray(source.fills) ? source.fills : []
  let effects = Array.isArray(source.effects) ? source.effects : []
  let font = isObject(source.font) ? source.font : DEFAULT_FONT
  const label = `node "${String(node.id)}"`

  if (source.textStyleId != null) {
    const style = ctx.styleById.get(source.textStyleId)
    if (!style) ctx.issues.push(`${label}: unknown text style "${String(source.textStyleId)}"`)
    else if (style.type !== 'text') {
      ctx.issues.push(`${label}: style "${String(source.textStyleId)}" is a ${String(style.type)} style, expected text`)
    } else if (isObject(style.value)) {
      if (isObject(style.value.font)) font = style.value.font
      if (Array.isArray(style.value.fills)) fills = style.value.fills
    }
  }
  if (source.fillStyleId != null) {
    const style = ctx.styleById.get(source.fillStyleId)
    if (!style) ctx.issues.push(`${label}: unknown fill style "${String(source.fillStyleId)}"`)
    else if (style.type !== 'fill') {
      ctx.issues.push(`${label}: style "${String(source.fillStyleId)}" is a ${String(style.type)} style, expected fill`)
    } else if (isObject(style.value)) {
      fills = [style.value]
    }
  }
  if (source.effectStyleId != null) {
    const style = ctx.styleById.get(source.effectStyleId)
    if (!style) ctx.issues.push(`${label}: unknown effect style "${String(source.effectStyleId)}"`)
    else if (style.type !== 'effect') {
      ctx.issues.push(`${label}: style "${String(source.effectStyleId)}" is a ${String(style.type)} style, expected effect`)
    } else if (Array.isArray(style.value)) {
      effects = style.value
    }
  }
  return { fills, effects, font }
}

// ───────────────────────────── components / variants ─────────────────────────

/**
 * Pick the component for an instance, honouring `variantProps` against the
 * component's variant set. Falls back to `instance.componentId`.
 * @param {any} instance
 * @param {any} ctx
 */
function pinVariant(instance, ctx) {
  const base = ctx.componentById.get(instance.componentId)
  if (!base) {
    ctx.issues.push(`instance "${String(instance.id)}" references unknown component "${String(instance.componentId)}"`)
    return null
  }
  const props = isObject(instance.variantProps) ? instance.variantProps : {}
  if (!base.variantSetId || Object.keys(props).length === 0) return base
  const set = ctx.variantSetById.get(base.variantSetId)
  if (!set) {
    ctx.issues.push(`component "${String(base.id)}" references unknown variant set "${String(base.variantSetId)}"`)
    return base
  }
  const merged = {
    ...(isObject(base.variantProps) ? base.variantProps : {}),
    ...props,
  }
  const properties = Array.isArray(set.properties) ? set.properties : []
  for (const componentId of Array.isArray(set.componentIds) ? set.componentIds : []) {
    const candidate = ctx.componentById.get(componentId)
    if (!candidate) continue
    const values = isObject(candidate.variantProps) ? candidate.variantProps : {}
    if (properties.every((property) => values[property?.name] === merged[property?.name])) return candidate
  }
  ctx.issues.push(
    `instance "${String(instance.id)}" has no variant match (${formatVariantProps(props)}); using "${String(base.id)}"`,
  )
  return base
}

/** @param {any} props */
function formatVariantProps(props) {
  return Object.entries(props)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(', ')
}

// ─────────────────────────────── scene helpers ───────────────────────────────

/** @param {any} source @param {string|undefined} pageId @param {string[]} issues */
function selectPage(source, pageId, issues) {
  const pages = Array.isArray(source.pages) ? source.pages.filter(isObject) : []
  if (!pages.length) {
    issues.push('document has no pages')
    return null
  }
  if (pageId == null) return pages[0]
  const page = pages.find((entry) => entry.id === pageId)
  if (!page) {
    issues.push(`unknown page "${String(pageId)}"`)
    return null
  }
  return page
}

/** @param {any} node @param {any} ctx */
function registerNode(node, ctx) {
  if (ctx.byKey.has(node.key)) {
    ctx.issues.push(`duplicate render key "${node.key}"`)
  } else {
    ctx.byKey.set(node.key, node)
  }
  const list = ctx.bySourceId.get(node.sourceId)
  if (list) list.push(node)
  else ctx.bySourceId.set(node.sourceId, [node])
}

/**
 * `scene.rebuild()` clears cached text metrics, re-resolves the same document
 * and re-runs layout in place (keeps the scene object identity so renderers can
 * hold on to it). Used after webfonts finish loading.
 * @param {any} scene
 * @param {any} doc
 * @param {any} options
 */
function attachRebuild(scene, doc, options) {
  scene.rebuild = () => {
    if (scene.measureText && typeof scene.measureText.clearCache === 'function') {
      scene.measureText.clearCache()
    }
    const fresh = buildScene(doc, { ...options, measureText: scene.measureText })
    scene.pageId = fresh.pageId
    scene.title = fresh.title
    scene.mode = fresh.mode
    scene.componentId = fresh.componentId
    scene.roots = fresh.roots
    scene.byKey = fresh.byKey
    scene.bySourceId = fresh.bySourceId
    scene.componentById = fresh.componentById
    scene.styleById = fresh.styleById
    scene.page = fresh.page
    scene.background = fresh.background
    scene.doc = fresh.doc
    if (Array.isArray(scene.issues)) {
      scene.issues.length = 0
      scene.issues.push(...fresh.issues)
    } else {
      scene.issues = fresh.issues
    }
    layoutScene(scene)
    return scene
  }
}

// ─────────────────────────────── small helpers ───────────────────────────────

/** @param {unknown} overrides @param {unknown} sourceId */
function lookupOverride(overrides, sourceId) {
  if (!isObject(overrides) || typeof sourceId !== 'string') return undefined
  const patch = overrides[sourceId]
  return isObject(patch) ? patch : undefined
}

/** @param {unknown} raw @returns {{h?: string, v?: string}|undefined} */
function pickSizing(raw) {
  if (!isObject(raw)) return undefined
  const sizing = {}
  if (SIZINGS.has(raw.h)) sizing.h = raw.h
  if (SIZINGS.has(raw.v)) sizing.v = raw.v
  return Object.keys(sizing).length ? sizing : undefined
}

/** @param {unknown} value */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @param {unknown} value @param {number} fallback */
function numberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** @param {number} value */
function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}
