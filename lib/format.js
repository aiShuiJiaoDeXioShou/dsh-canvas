/**
 * dsh.canvas@1 — shared document model, normalization and validation.
 *
 * This module is intentionally dependency-free and browser-safe: the Host half
 * validates writes with it, and the browser half uses it to normalize docs it
 * receives. Unknown fields are preserved so newer writers stay round-trippable.
 */

export const FORMAT = 'dsh.canvas'
export const VERSION = 1

export const LIMITS = {
  nodes: 2000,
  components: 200,
  styles: 500,
  comments: 1000,
  fonts: 50,
  depth: 32,
  textLength: 10000,
  docBytes: 8 * 1024 * 1024,
  imageBytes: 20 * 1024 * 1024,
  fontBytes: 10 * 1024 * 1024,
}

export const NODE_TYPES = ['frame', 'group', 'rect', 'ellipse', 'line', 'text', 'instance']
export const FILL_TYPES = ['solid', 'linear-gradient', 'radial-gradient', 'image']
export const EFFECT_TYPES = ['drop-shadow', 'inner-shadow', 'layer-blur', 'background-blur']
export const STYLE_TYPES = ['fill', 'text', 'effect']
export const ALIGNMENTS = ['left', 'center', 'right', 'justify']
export const VERTICAL_ALIGNMENTS = ['top', 'center', 'bottom']
export const LAYOUT_DIRECTIONS = ['horizontal', 'vertical']
export const LAYOUT_PRIMARY = ['start', 'center', 'end', 'space-between']
export const LAYOUT_COUNTER = ['start', 'center', 'end', 'stretch']
export const SIZINGS = ['fixed', 'hug', 'fill']
export const IMAGE_FITS = ['cover', 'contain', 'fill']
export const FONT_STYLES = ['normal', 'italic']
export const COMMENT_AUTHORS = ['user', 'ai']

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/
const SLUG_RE = /^[a-z0-9][a-z0-9-_]{0,63}$/
const ASSET_RE = /^assets\/[A-Za-z0-9._-]{1,120}$/
const FONT_ASSET_RE = /^fonts\/[A-Za-z0-9._-]{1,120}$/
const COLOR_RE = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export class CanvasError extends Error {
  /** @param {string} path @param {string} message @param {string} [code] */
  constructor(path, message, code = 'invalid-document') {
    super(`${path}: ${message}`)
    this.name = 'CanvasError'
    this.path = path
    this.code = code
  }
}

/** @param {unknown} value */
export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @param {unknown} value */
function clone(value) {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // fall through to JSON copy
    }
  }
  return JSON.parse(JSON.stringify(value))
}

/** @param {number} value @param {string} path @param {{min?: number, max?: number, int?: boolean}} [opts] */
export function finite(value, path, opts = {}) {
  const { min = -1e6, max = 1e6, int = false } = opts
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new CanvasError(path, 'expected a finite number')
  }
  if (int && Math.round(value) !== value) throw new CanvasError(path, 'expected an integer')
  if (value < min || value > max) throw new CanvasError(path, `expected a number in [${min}, ${max}]`)
  return value
}

/** @param {unknown} value @param {string} path */
export function unit(value, path) {
  return finite(value, path, { min: 0, max: 1, int: false })
}

/** @param {unknown} value @param {string} path */
export function color(value, path) {
  if (typeof value !== 'string' || !COLOR_RE.test(value)) {
    throw new CanvasError(path, 'expected a color like #RRGGBB or #RRGGBBAA')
  }
  return value.toUpperCase()
}

/** @param {unknown} value @param {string} path */
function id(value, path) {
  if (typeof value !== 'string' || !ID_RE.test(value)) {
    throw new CanvasError(path, 'expected an id matching ^[A-Za-z0-9_-]{1,64}$')
  }
  return value
}

/** @param {unknown} value @param {string} path @param {readonly string[]} allowed */
export function oneOf(value, path, allowed) {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new CanvasError(path, `expected one of ${allowed.map((x) => JSON.stringify(x)).join(', ')}`)
  }
  return value
}

let sequence = 0

/** @param {string} [prefix] */
export function newId(prefix = 'n') {
  sequence = (sequence + 1) % 0xffffff
  const random = Math.floor(Math.random() * 0xffffff).toString(36)
  return `${prefix}_${Date.now().toString(36)}${sequence.toString(36)}${random}`.slice(0, 64)
}

/** @param {unknown} value */
export function isSlug(value) {
  return typeof value === 'string' && SLUG_RE.test(value)
}

/** @param {unknown} value */
export function isAssetPath(value) {
  return typeof value === 'string' && ASSET_RE.test(value) && !value.includes('..')
}

/** @param {unknown} value */
export function isFontAssetPath(value) {
  return typeof value === 'string' && FONT_ASSET_RE.test(value) && !value.includes('..')
}

const nowIso = () => new Date().toISOString()

/** @param {string} [title] @param {string} [docId] */
export function emptyDoc(title = '主画布', docId = newId('doc')) {
  return {
    format: FORMAT,
    version: VERSION,
    id: docId,
    title,
    pages: [{ id: newId('page'), name: 'Page 1', background: null, children: [] }],
    components: [],
    variantSets: [],
    styles: [],
    fonts: [],
    comments: [],
    meta: { createdAt: nowIso(), updatedAt: nowIso() },
  }
}

/** @param {unknown} value @param {string} path */
function normalizeFill(value, path) {
  if (!isPlainObject(value)) throw new CanvasError(path, 'expected an object')
  const type = oneOf(value.type, `${path}.type`, FILL_TYPES)
  const fill = { ...value, type }
  if (type === 'solid') {
    fill.color = color(value.color, `${path}.color`)
    fill.opacity = value.opacity == null ? 1 : unit(value.opacity, `${path}.opacity`)
    return fill
  }
  if (type === 'linear-gradient') {
    fill.angle = value.angle == null ? 180 : finite(value.angle, `${path}.angle`, { min: -3600, max: 3600 })
    fill.stops = normalizeStops(value.stops, `${path}.stops`)
    return fill
  }
  if (type === 'radial-gradient') {
    fill.center = {
      x: value.center?.x == null ? 0.5 : unit(value.center.x, `${path}.center.x`),
      y: value.center?.y == null ? 0.5 : unit(value.center.y, `${path}.center.y`),
    }
    fill.radius = value.radius == null ? 0.7 : unit(value.radius, `${path}.radius`)
    fill.stops = normalizeStops(value.stops, `${path}.stops`)
    return fill
  }
  // image
  if (!isAssetPath(value.asset)) throw new CanvasError(`${path}.asset`, 'expected assets/<file>')
  fill.asset = value.asset
  fill.fit = value.fit == null ? 'cover' : oneOf(value.fit, `${path}.fit`, IMAGE_FITS)
  if (value.crop != null) {
    if (!isPlainObject(value.crop)) throw new CanvasError(`${path}.crop`, 'expected an object')
    const crop = {
      x: unit(value.crop.x ?? 0, `${path}.crop.x`),
      y: unit(value.crop.y ?? 0, `${path}.crop.y`),
      width: unit(value.crop.width ?? 1, `${path}.crop.width`),
      height: unit(value.crop.height ?? 1, `${path}.crop.height`),
    }
    if (crop.width <= 0 || crop.height <= 0) throw new CanvasError(`${path}.crop`, 'crop size must be positive')
    if (crop.x + crop.width > 1.000001 || crop.y + crop.height > 1.000001) {
      throw new CanvasError(`${path}.crop`, 'crop must stay inside the image')
    }
    fill.crop = crop
  }
  return fill
}

/** @param {unknown} value @param {string} path */
function normalizeStops(value, path) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 32) {
    throw new CanvasError(path, 'expected 2-32 gradient stops')
  }
  return value.map((stop, index) => {
    if (!isPlainObject(stop)) throw new CanvasError(`${path}[${index}]`, 'expected an object')
    return {
      position: unit(stop.position, `${path}[${index}].position`),
      color: color(stop.color, `${path}[${index}].color`),
    }
  })
}

/** @param {unknown} value @param {string} path */
function normalizeEffect(value, path) {
  if (!isPlainObject(value)) throw new CanvasError(path, 'expected an object')
  const type = oneOf(value.type, `${path}.type`, EFFECT_TYPES)
  const effect = { ...value, type, visible: value.visible !== false }
  if (type === 'layer-blur' || type === 'background-blur') {
    effect.radius = finite(value.radius ?? 4, `${path}.radius`, { min: 0, max: 200 })
    return effect
  }
  effect.x = finite(value.x ?? 0, `${path}.x`, { min: -1000, max: 1000 })
  effect.y = finite(value.y ?? 0, `${path}.y`, { min: -1000, max: 1000 })
  effect.blur = finite(value.blur ?? 0, `${path}.blur`, { min: 0, max: 500 })
  effect.spread = finite(value.spread ?? 0, `${path}.spread`, { min: -500, max: 500 })
  effect.color = color(value.color ?? '#00000040', `${path}.color`)
  return effect
}

/** @param {unknown} value @param {string} path */
function shortLabel(value, path) {
  if (typeof value !== 'string' || !value.trim() || value.length > 64) {
    throw new CanvasError(path, 'expected a non-empty label of at most 64 characters')
  }
  return value.trim()
}

/** @param {unknown} value @param {string} path */
function normalizeStrokes(value, path) {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > 8) throw new CanvasError(path, 'expected at most 8 strokes')
  return value.map((stroke, index) => {
    if (!isPlainObject(stroke)) throw new CanvasError(`${path}[${index}]`, 'expected an object')
    return {
      ...stroke,
      color: color(stroke.color ?? '#000000', `${path}[${index}].color`),
      width: finite(stroke.width ?? 1, `${path}[${index}].width`, { min: 0, max: 200 }),
      align: stroke.align == null ? 'center' : oneOf(stroke.align, `${path}[${index}].align`, ['center', 'inside', 'outside']),
    }
  })
}

/** @param {unknown} value @param {string} path */
function normalizeSizing(value, path) {
  if (value == null) return undefined
  if (!isPlainObject(value)) throw new CanvasError(path, 'expected an object')
  return {
    h: oneOf(value.h ?? 'fixed', `${path}.h`, SIZINGS),
    v: oneOf(value.v ?? 'fixed', `${path}.v`, SIZINGS),
  }
}

/** @param {unknown} value @param {string} path */
function normalizeLayout(value, path) {
  if (value == null) return undefined
  if (!isPlainObject(value)) throw new CanvasError(path, 'expected an object')
  const padding = value.padding ?? {}
  return {
    ...value,
    direction: oneOf(value.direction ?? 'vertical', `${path}.direction`, LAYOUT_DIRECTIONS),
    gap: finite(value.gap ?? 0, `${path}.gap`, { min: 0, max: 10000 }),
    padding: {
      top: finite(padding.top ?? 0, `${path}.padding.top`, { min: 0, max: 10000 }),
      right: finite(padding.right ?? 0, `${path}.padding.right`, { min: 0, max: 10000 }),
      bottom: finite(padding.bottom ?? 0, `${path}.padding.bottom`, { min: 0, max: 10000 }),
      left: finite(padding.left ?? 0, `${path}.padding.left`, { min: 0, max: 10000 }),
    },
    alignPrimary: oneOf(value.alignPrimary ?? 'start', `${path}.alignPrimary`, LAYOUT_PRIMARY),
    alignCounter: oneOf(value.alignCounter ?? 'start', `${path}.alignCounter`, LAYOUT_COUNTER),
  }
}

/** @param {unknown} value @param {string} path */
function normalizeFont(value, path) {
  const font = isPlainObject(value) ? value : {}
  return {
    ...font,
    family: typeof font.family === 'string' && font.family.trim() ? font.family.trim().slice(0, 120) : 'system-ui',
    weight: Math.round(finite(font.weight ?? 400, `${path}.weight`, { min: 100, max: 900 }) / 100) * 100,
    style: oneOf(font.style ?? 'normal', `${path}.style`, FONT_STYLES),
    size: finite(font.size ?? 14, `${path}.size`, { min: 1, max: 1000 }),
    lineHeight: finite(font.lineHeight ?? 1.4, `${path}.lineHeight`, { min: 0.5, max: 10 }),
    letterSpacing: finite(font.letterSpacing ?? 0, `${path}.letterSpacing`, { min: -50, max: 200 }),
  }
}

/** @param {unknown} value @param {string} path */
function normalizeOverride(value, path) {
  if (!isPlainObject(value)) throw new CanvasError(path, 'expected an object')
  const patch = { ...value }
  if ('text' in patch && (typeof patch.text !== 'string' || patch.text.length > LIMITS.textLength)) {
    throw new CanvasError(`${path}.text`, 'expected a short string')
  }
  if ('visible' in patch && typeof patch.visible !== 'boolean') {
    throw new CanvasError(`${path}.visible`, 'expected a boolean')
  }
  if ('fills' in patch) {
    if (!Array.isArray(patch.fills) || patch.fills.length > 8) throw new CanvasError(`${path}.fills`, 'expected an array')
    patch.fills = patch.fills.map((fill, index) => normalizeFill(fill, `${path}.fills[${index}]`))
  }
  return patch
}

/**
 * Normalize one node tree in place on a cloned value.
 * @param {any} raw
 * @param {string} path
 * @param {number} depth
 * @param {{count: number, ids: Set<string>}} state
 */
function normalizeNode(raw, path, depth, state) {
  if (depth > LIMITS.depth) throw new CanvasError(path, `node nesting exceeds ${LIMITS.depth}`)
  if (!isPlainObject(raw)) throw new CanvasError(path, 'expected a node object')
  state.count += 1
  if (state.count > LIMITS.nodes) throw new CanvasError(path, `document exceeds ${LIMITS.nodes} nodes`)

  const type = oneOf(raw.type, `${path}.type`, NODE_TYPES)
  const node = { ...raw, type }
  node.id = id(raw.id, `${path}.id`)
  if (state.ids.has(node.id)) throw new CanvasError(`${path}.id`, `duplicate id "${node.id}"`)
  state.ids.add(node.id)
  node.name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 120) : defaultName(type)
  node.x = finite(raw.x ?? 0, `${path}.x`)
  node.y = finite(raw.y ?? 0, `${path}.y`)
  node.width = finite(raw.width ?? defaultWidth(type), `${path}.width`, { min: 0, max: 1e6 })
  node.height = finite(raw.height ?? defaultHeight(type), `${path}.height`, { min: 0, max: 1e6 })
  node.rotation = finite(raw.rotation ?? 0, `${path}.rotation`, { min: -36000, max: 36000 })
  node.opacity = unit(raw.opacity ?? 1, `${path}.opacity`)
  node.visible = raw.visible !== false
  node.locked = raw.locked === true
  node.layoutSizing = normalizeSizing(raw.layoutSizing, `${path}.layoutSizing`)

  if (type === 'frame' || type === 'group') {
    node.children = []
    if (Array.isArray(raw.children)) {
      for (let index = 0; index < raw.children.length; index += 1) {
        node.children.push(normalizeNode(raw.children[index], `${path}.children[${index}]`, depth + 1, state))
      }
    }
  } else {
    node.children = undefined
  }

  if (type === 'frame' || type === 'rect' || type === 'ellipse') {
    node.fills = normalizeFills(raw.fills, `${path}.fills`)
    if (!node.fills.length && raw.fills == null && raw.fillStyleId == null) {
      node.fills = [{ type: 'solid', color: type === 'frame' ? '#FFFFFF' : '#D9D9D9' }]
    }
    node.strokes = normalizeStrokes(raw.strokes, `${path}.strokes`)
    node.effects = normalizeEffects(raw.effects, `${path}.effects`)
    node.cornerRadius = finite(raw.cornerRadius ?? 0, `${path}.cornerRadius`, { min: 0, max: 1e6 })
  }
  if (type === 'instance') {
    node.fills = undefined
    node.strokes = undefined
    node.effects = undefined
    node.cornerRadius = raw.cornerRadius == null
      ? undefined
      : finite(raw.cornerRadius, `${path}.cornerRadius`, { min: 0, max: 1e6 })
  }
  if (type === 'group' || type === 'line') {
    node.fills = undefined
    node.strokes = undefined
    node.effects = undefined
    node.cornerRadius = undefined
  }
  if (type === 'line') {
    node.strokes = normalizeStrokes(raw.strokes, `${path}.strokes`)
    if (!node.strokes.length) node.strokes = [{ color: '#111111', width: 1, align: 'center' }]
    node.fills = undefined
    node.effects = undefined
    node.height = 0
  }
  if (type === 'text') {
    node.text = typeof raw.text === 'string' ? raw.text.slice(0, LIMITS.textLength) : ''
    node.font = normalizeFont(raw.font, `${path}.font`)
    node.align = oneOf(raw.align ?? 'left', `${path}.align`, ALIGNMENTS)
    node.verticalAlign = oneOf(raw.verticalAlign ?? 'top', `${path}.verticalAlign`, VERTICAL_ALIGNMENTS)
    node.fills = normalizeFills(raw.fills, `${path}.fills`)
    if (!node.fills.length && raw.fills == null && raw.fillStyleId == null) {
      node.fills = [{ type: 'solid', color: '#111111' }]
    }
    node.effects = normalizeEffects(raw.effects, `${path}.effects`)
    node.autoHeight = raw.autoHeight !== false
  }
  if (type === 'frame') {
    node.clip = raw.clip !== false
    node.layout = normalizeLayout(raw.layout, `${path}.layout`)
    if (raw.backgroundColor != null) {
      node.fills = normalizeFills(raw.fills ?? [{ type: 'solid', color: raw.backgroundColor }], `${path}.fills`)
    }
  }
  if (type === 'instance') {
    node.componentId = id(raw.componentId, `${path}.componentId`)
    node.variantProps = normalizeStringMap(raw.variantProps, `${path}.variantProps`)
    node.overrides = {}
    if (raw.overrides != null) {
      if (!isPlainObject(raw.overrides)) throw new CanvasError(`${path}.overrides`, 'expected an object')
      for (const [key, value] of Object.entries(raw.overrides)) {
        node.overrides[id(key, `${path}.overrides key`)] = normalizeOverride(value, `${path}.overrides.${key}`)
      }
    }
  }
  if (raw.fillStyleId != null) node.fillStyleId = id(raw.fillStyleId, `${path}.fillStyleId`)
  if (raw.textStyleId != null) node.textStyleId = id(raw.textStyleId, `${path}.textStyleId`)
  if (raw.effectStyleId != null) node.effectStyleId = id(raw.effectStyleId, `${path}.effectStyleId`)
  return node
}

/** @param {unknown} value @param {string} path */
function normalizeFills(value, path) {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > 8) throw new CanvasError(path, 'expected at most 8 fills')
  return value.map((fill, index) => normalizeFill(fill, `${path}[${index}]`))
}

/** @param {unknown} value @param {string} path */
function normalizeEffects(value, path) {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > 8) throw new CanvasError(path, 'expected at most 8 effects')
  return value.map((effect, index) => normalizeEffect(effect, `${path}[${index}]`))
}

/** @param {unknown} value @param {string} path */
function normalizeStringMap(value, path) {
  if (value == null) return {}
  if (!isPlainObject(value)) throw new CanvasError(path, 'expected an object')
  /** @type {Record<string, string>} */
  const out = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string' || entry.length > 120) throw new CanvasError(`${path}.${key}`, 'expected a short string')
    out[key] = entry
  }
  return out
}

/** @param {string} type */
function defaultName(type) {
  return {
    frame: 'Frame',
    group: 'Group',
    rect: 'Rectangle',
    ellipse: 'Ellipse',
    line: 'Line',
    text: 'Text',
    instance: 'Instance',
  }[type] ?? 'Node'
}

/** @param {string} type */
function defaultWidth(type) {
  if (type === 'line') return 100
  if (type === 'text') return 160
  if (type === 'frame') return 375
  return 120
}

/** @param {string} type */
function defaultHeight(type) {
  if (type === 'line') return 0
  if (type === 'text') return 24
  if (type === 'frame') return 667
  return 120
}

/** @param {any} raw @param {string} path */
function normalizeStyle(raw, path) {
  if (!isPlainObject(raw)) throw new CanvasError(path, 'expected a style object')
  const style = { ...raw }
  style.id = id(raw.id, `${path}.id`)
  style.type = oneOf(raw.type, `${path}.type`, STYLE_TYPES)
  style.name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 120) : style.type
  if (style.type === 'fill') style.value = normalizeFill(raw.value, `${path}.value`)
  else if (style.type === 'text') {
    style.value = { font: normalizeFont(raw.value?.font, `${path}.value.font`), fills: normalizeFills(raw.value?.fills, `${path}.value.fills`) }
  } else style.value = normalizeEffects(raw.value, `${path}.value`)
  return style
}

/** @param {any} raw @param {string} path */
function normalizeComponent(raw, path, state) {
  if (!isPlainObject(raw)) throw new CanvasError(path, 'expected a component object')
  const component = { ...raw }
  component.id = id(raw.id, `${path}.id`)
  component.name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 120) : 'Component'
  component.root = normalizeNode(raw.root, `${path}.root`, 1, state)
  component.root.x = 0
  component.root.y = 0
  if (raw.variantSetId != null) component.variantSetId = id(raw.variantSetId, `${path}.variantSetId`)
  component.variantProps = normalizeStringMap(raw.variantProps, `${path}.variantProps`)
  return component
}

/** @param {any} raw @param {string} path */
function normalizeVariantSet(raw, path) {
  if (!isPlainObject(raw)) throw new CanvasError(path, 'expected a variant set object')
  if (!Array.isArray(raw.properties) || raw.properties.length === 0) {
    throw new CanvasError(`${path}.properties`, 'expected at least one variant property')
  }
  return {
    ...raw,
    id: id(raw.id, `${path}.id`),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 120) : 'Variant set',
    properties: raw.properties.map((property, index) => ({
      name: shortLabel(property?.name, `${path}.properties[${index}].name`),
      values: Array.isArray(property?.values)
        ? property.values.map((value, valueIndex) =>
            shortLabel(value, `${path}.properties[${index}].values[${valueIndex}]`),
          )
        : [],
    })),
    componentIds: Array.isArray(raw.componentIds)
      ? raw.componentIds.map((value, index) => id(value, `${path}.componentIds[${index}]`))
      : [],
  }
}

/** @param {any} raw @param {string} path */
function normalizeFontAsset(raw, path) {
  if (!isPlainObject(raw)) throw new CanvasError(path, 'expected a font asset object')
  return {
    ...raw,
    id: id(raw.id, `${path}.id`),
    family: typeof raw.family === 'string' && raw.family.trim() ? raw.family.trim().slice(0, 120) : 'Custom',
    weight: Math.round(finite(raw.weight ?? 400, `${path}.weight`, { min: 100, max: 900 }) / 100) * 100,
    style: oneOf(raw.style ?? 'normal', `${path}.style`, FONT_STYLES),
    asset: isFontAssetPath(raw.asset) ? raw.asset : (() => {
      throw new CanvasError(`${path}.asset`, 'expected fonts/<file>')
    })(),
    sourceName: typeof raw.sourceName === 'string' ? raw.sourceName.slice(0, 200) : undefined,
  }
}

/** @param {any} raw @param {string} path */
function normalizeComment(raw, path) {
  if (!isPlainObject(raw)) throw new CanvasError(path, 'expected a comment object')
  const comment = {
    ...raw,
    id: id(raw.id, `${path}.id`),
    pageId: id(raw.pageId, `${path}.pageId`),
    body: typeof raw.body === 'string' ? raw.body.slice(0, 4000) : '',
    author: oneOf(raw.author ?? 'user', `${path}.author`, COMMENT_AUTHORS),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : nowIso(),
    resolved: raw.resolved === true,
    replies: [],
  }
  if (raw.nodeId != null) comment.nodeId = id(raw.nodeId, `${path}.nodeId`)
  if (raw.x != null) comment.x = unit(raw.x, `${path}.x`)
  if (raw.y != null) comment.y = unit(raw.y, `${path}.y`)
  if (Array.isArray(raw.replies)) {
    comment.replies = raw.replies.slice(0, 100).map((reply, index) => {
      if (!isPlainObject(reply)) throw new CanvasError(`${path}.replies[${index}]`, 'expected an object')
      return {
        id: id(reply.id ?? newId('r'), `${path}.replies[${index}].id`),
        body: typeof reply.body === 'string' ? reply.body.slice(0, 4000) : '',
        author: oneOf(reply.author ?? 'user', `${path}.replies[${index}].author`, COMMENT_AUTHORS),
        createdAt: typeof reply.createdAt === 'string' ? reply.createdAt : nowIso(),
      }
    })
  }
  return comment
}

/**
 * Validate and normalize a full document. Throws CanvasError with a JSON-ish
 * path. Unknown fields survive normalization.
 * @param {unknown} input
 * @param {{touch?: boolean}} [options]
 */
export function normalizeDoc(input, options = {}) {
  if (!isPlainObject(input)) throw new CanvasError('$', 'expected a document object')
  const doc = clone(input)
  doc.format = FORMAT
  doc.version = VERSION
  doc.id = id(doc.id ?? newId('doc'), '$.id')
  doc.title = typeof doc.title === 'string' && doc.title.trim() ? doc.title.trim().slice(0, 200) : '未命名画布'
  if (!Array.isArray(doc.pages) || doc.pages.length === 0) throw new CanvasError('$.pages', 'expected at least one page')
  if (doc.pages.length > 50) throw new CanvasError('$.pages', 'expected at most 50 pages')

  /** @type {Set<string>} */
  const nodeIds = new Set()
  const nodeState = { count: 0, ids: nodeIds }
  doc.pages = doc.pages.map((page, pageIndex) => {
    if (!isPlainObject(page)) throw new CanvasError(`$.pages[${pageIndex}]`, 'expected an object')
    const normalizedPage = {
      ...page,
      id: id(page.id ?? newId('page'), `$.pages[${pageIndex}].id`),
      name: typeof page.name === 'string' && page.name.trim() ? page.name.trim().slice(0, 120) : `Page ${pageIndex + 1}`,
      children: [],
    }
    if (page.background != null) normalizedPage.background = color(page.background, `$.pages[${pageIndex}].background`)
    if (Array.isArray(page.children)) {
      for (let index = 0; index < page.children.length; index += 1) {
        normalizedPage.children.push(
          normalizeNode(page.children[index], `$.pages[${pageIndex}].children[${index}]`, 1, nodeState),
        )
      }
    }
    return normalizedPage
  })

  const pageIds = new Set(doc.pages.map((page) => page.id))
  if (pageIds.size !== doc.pages.length) throw new CanvasError('$.pages', 'duplicate page id')

  doc.components = Array.isArray(doc.components)
    ? doc.components.map((component, index) => normalizeComponent(component, `$.components[${index}]`, nodeState))
    : []
  if (doc.components.length > LIMITS.components) throw new CanvasError('$.components', 'too many components')
  const componentIds = new Set(doc.components.map((component) => component.id))
  if (componentIds.size !== doc.components.length) throw new CanvasError('$.components', 'duplicate component id')
  for (const component of doc.components) {
    if (component.variantSetId != null && !Array.isArray(doc.variantSets)) {
      throw new CanvasError('$.variantSets', 'missing variant sets')
    }
  }

  doc.variantSets = Array.isArray(doc.variantSets)
    ? doc.variantSets.map((set, index) => normalizeVariantSet(set, `$.variantSets[${index}]`))
    : []
  for (const [index, set] of doc.variantSets.entries()) {
    for (const componentId of set.componentIds) {
      if (!componentIds.has(componentId)) {
        throw new CanvasError(`$.variantSets[${index}].componentIds`, `unknown component "${componentId}"`)
      }
    }
  }

  doc.styles = Array.isArray(doc.styles) ? doc.styles.map((style, index) => normalizeStyle(style, `$.styles[${index}]`)) : []
  if (doc.styles.length > LIMITS.styles) throw new CanvasError('$.styles', 'too many styles')
  const styleIds = new Set(doc.styles.map((style) => style.id))
  if (styleIds.size !== doc.styles.length) throw new CanvasError('$.styles', 'duplicate style id')

  doc.fonts = Array.isArray(doc.fonts) ? doc.fonts.map((font, index) => normalizeFontAsset(font, `$.fonts[${index}]`)) : []
  if (doc.fonts.length > LIMITS.fonts) throw new CanvasError('$.fonts', 'too many fonts')

  doc.comments = Array.isArray(doc.comments)
    ? doc.comments.map((comment, index) => normalizeComment(comment, `$.comments[${index}]`))
    : []
  if (doc.comments.length > LIMITS.comments) throw new CanvasError('$.comments', 'too many comments')
  for (const [index, comment] of doc.comments.entries()) {
    if (!pageIds.has(comment.pageId)) {
      throw new CanvasError(`$.comments[${index}].pageId`, `unknown page "${comment.pageId}"`)
    }
    if (comment.nodeId != null && !findNodeInDoc(doc, comment.nodeId)) {
      throw new CanvasError(`$.comments[${index}].nodeId`, `unknown node "${comment.nodeId}"`)
    }
  }

  doc.meta = isPlainObject(doc.meta) ? { ...doc.meta } : {}
  doc.meta.createdAt = typeof doc.meta.createdAt === 'string' ? doc.meta.createdAt : nowIso()
  doc.meta.updatedAt = options.touch === false ? doc.meta.updatedAt ?? nowIso() : nowIso()

  validateReferences(doc)
  return doc
}

/** Cross-reference checks that need the whole document. @param {any} doc */
function validateReferences(doc) {
  const componentById = new Map(doc.components.map((component) => [component.id, component]))
  const variantSetById = new Map(doc.variantSets.map((set) => [set.id, set]))
  const styleById = new Map(doc.styles.map((style) => [style.id, style]))
  const fontIds = new Set()
  for (const [index, font] of doc.fonts.entries()) {
    if (fontIds.has(font.id)) throw new CanvasError(`$.fonts[${index}].id`, `duplicate font id "${font.id}"`)
    fontIds.add(font.id)
  }

  for (const [index, set] of doc.variantSets.entries()) {
    for (const componentId of set.componentIds) {
      const component = componentById.get(componentId)
      if (!component) throw new CanvasError(`$.variantSets[${index}].componentIds`, `unknown component "${componentId}"`)
      if (component.variantSetId !== set.id) {
        throw new CanvasError(`$.components`, `component "${componentId}" must set variantSetId "${set.id}"`)
      }
      for (const property of set.properties) {
        if (!(property.name in component.variantProps)) {
          throw new CanvasError(`$.components`, `component "${componentId}" is missing variant property "${property.name}"`)
        }
        if (!property.values.includes(component.variantProps[property.name])) {
          throw new CanvasError(
            `$.components`,
            `component "${componentId}" has variant value not declared by "${property.name}"`,
          )
        }
      }
    }
  }

  for (const component of doc.components) {
    if (component.variantSetId != null && !variantSetById.has(component.variantSetId)) {
      throw new CanvasError('$.components', `component "${component.id}" references unknown variant set`)
    }
  }

  const checkStyle = (styleId, type, path) => {
    if (styleId == null) return
    const style = styleById.get(styleId)
    if (!style) throw new CanvasError(path, `unknown ${type} style "${styleId}"`)
    if (style.type !== type) throw new CanvasError(path, `style "${styleId}" is a ${style.type} style, expected ${type}`)
  }

  for (const component of doc.components) {
    for (const node of iterateNode(component.root)) {
      checkStyle(node.fillStyleId, 'fill', `$.components.${component.id}.${node.id}.fillStyleId`)
      checkStyle(node.textStyleId, 'text', `$.components.${component.id}.${node.id}.textStyleId`)
      checkStyle(node.effectStyleId, 'effect', `$.components.${component.id}.${node.id}.effectStyleId`)
    }
  }

  const checkInstance = (node, path) => {
    const component = componentById.get(node.componentId)
    if (!component) throw new CanvasError(`${path}.componentId`, `unknown component "${node.componentId}"`)
    if (component.variantSetId != null) {
      const set = variantSetById.get(component.variantSetId)
      if (set) {
        for (const [key, value] of Object.entries(node.variantProps ?? {})) {
          const property = set.properties.find((entry) => entry.name === key)
          if (!property) throw new CanvasError(`${path}.variantProps.${key}`, `variant set has no property "${key}"`)
          if (!property.values.includes(value)) {
            throw new CanvasError(`${path}.variantProps.${key}`, `unknown variant value "${value}"`)
          }
        }
      }
    }
    for (const [overrideId, patch] of Object.entries(node.overrides ?? {})) {
      const target = findNodeInTree(component.root, overrideId)
      if (!target) throw new CanvasError(`${path}.overrides.${overrideId}`, 'override targets an unknown node')
      if ('text' in patch && target.node.type !== 'text') {
        throw new CanvasError(`${path}.overrides.${overrideId}.text`, 'text override on a non-text node')
      }
      if ('fills' in patch && !['frame', 'rect', 'ellipse', 'text'].includes(target.node.type)) {
        throw new CanvasError(`${path}.overrides.${overrideId}.fills`, 'fill override on an unsupported node')
      }
    }
  }

  const visit = (node, path, depth) => {
    if (depth > LIMITS.depth) return
    checkStyle(node.fillStyleId, 'fill', `${path}.fillStyleId`)
    checkStyle(node.textStyleId, 'text', `${path}.textStyleId`)
    checkStyle(node.effectStyleId, 'effect', `${path}.effectStyleId`)
    if (node.type === 'instance') checkInstance(node, path)
    if (Array.isArray(node.children)) {
      node.children.forEach((child, index) => visit(child, `${path}.children[${index}]`, depth + 1))
    }
  }
  doc.pages.forEach((page, pageIndex) => {
    page.children.forEach((node, index) => visit(node, `$.pages[${pageIndex}].children[${index}]`, 1))
  })

  const commentIds = new Set()
  for (const [index, comment] of doc.comments.entries()) {
    if (commentIds.has(comment.id)) throw new CanvasError(`$.comments[${index}].id`, 'duplicate comment id')
    commentIds.add(comment.id)
  }
}

/** @param {any} node */
function* iterateNode(node) {
  yield node
  if (Array.isArray(node.children)) for (const child of node.children) yield* iterateNode(child)
}

/** @param {any} node */
export function countNodes(node) {
  let total = 1
  if (Array.isArray(node.children)) for (const child of node.children) total += countNodes(child)
  return total
}

/**
 * Walk pages and component roots. Visitor receives (node, parent, context).
 * @param {any} doc
 * @param {(node: any, parent: any | null, context: {page?: any, component?: any, index: number}) => void} visitor
 */
export function walkNodes(doc, visitor) {
  for (const page of doc.pages ?? []) {
    const visit = (node, parent, index) => {
      visitor(node, parent, { page, component: null, index })
      if (Array.isArray(node.children)) node.children.forEach((child, childIndex) => visit(child, node, childIndex))
    }
    (page.children ?? []).forEach((child, index) => visit(child, null, index))
  }
  for (const component of doc.components ?? []) {
    const visit = (node, parent, index) => {
      visitor(node, parent, { page: null, component, index })
      if (Array.isArray(node.children)) node.children.forEach((child, childIndex) => visit(child, node, childIndex))
    }
    visit(component.root, null, 0)
  }
}

/** @param {any} doc @param {string} nodeId */
export function findNodeInDoc(doc, nodeId) {
  let found = null
  walkNodes(doc, (node, parent, context) => {
    if (!found && node.id === nodeId) found = { node, parent, ...context }
  })
  return found
}

/** @param {any} node @param {string} nodeId */
export function findNodeInTree(node, nodeId) {
  const search = (current, parent, index) => {
    if (current.id === nodeId) return { node: current, parent, index }
    if (!Array.isArray(current.children)) return null
    for (let childIndex = 0; childIndex < current.children.length; childIndex += 1) {
      const result = search(current.children[childIndex], current, childIndex)
      if (result) return result
    }
    return null
  }
  return search(node, null, 0)
}

/** @param {any} doc @param {string} pageId */
export function findPage(doc, pageId) {
  return (doc.pages ?? []).find((page) => page.id === pageId) ?? null
}

/** @param {any} doc */
export function firstPage(doc) {
  return doc.pages?.[0] ?? null
}

/**
 * Compact summary for the AI and for selection context.
 * @param {any} doc
 * @param {{selection?: string[], pageId?: string, detail?: 'outline'|'full'}} [options]
 */
export function outlineDoc(doc, options = {}) {
  const page = options.pageId ? findPage(doc, options.pageId) : firstPage(doc)
  const selection = new Set(options.selection ?? [])
  const outlineNode = (node, depth = 0) => {
    const item = {
      id: node.id,
      type: node.type,
      name: node.name,
      x: round(node.x),
      y: round(node.y),
      w: round(node.width),
      h: round(node.height),
    }
    if (node.type === 'text') item.text = String(node.text ?? '').slice(0, 80)
    if (node.type === 'instance') {
      item.componentId = node.componentId
      if (Object.keys(node.variantProps ?? {}).length) item.variantProps = node.variantProps
      if (Object.keys(node.overrides ?? {}).length) item.overrideCount = Object.keys(node.overrides).length
    }
    if (node.layout) item.layout = node.layout.direction
    if (node.layoutSizing) item.layoutSizing = node.layoutSizing
    if (selection.has(node.id)) item.selected = true
    if (node.visible === false) item.visible = false
    if (depth < 6 && Array.isArray(node.children) && node.children.length) {
      item.children = node.children.slice(0, 100).map((child) => outlineNode(child, depth + 1))
    }
    return item
  }
  return {
    format: FORMAT,
    version: VERSION,
    id: doc.id,
    title: doc.title,
    page: page ? { id: page.id, name: page.name, background: page.background ?? null } : null,
    pages: (doc.pages ?? []).map((entry) => ({ id: entry.id, name: entry.name })),
    nodes: page ? (page.children ?? []).map((node) => outlineNode(node)) : [],
    selection: [...selection],
    components: (doc.components ?? []).map((component) => ({
      id: component.id,
      name: component.name,
      variantSetId: component.variantSetId ?? null,
      variantProps: component.variantProps ?? {},
      nodeCount: countNodes(component.root),
    })),
    variantSets: (doc.variantSets ?? []).map((set) => ({
      id: set.id,
      name: set.name,
      properties: set.properties,
      componentIds: set.componentIds,
    })),
    styles: (doc.styles ?? []).map((style) => ({ id: style.id, type: style.type, name: style.name })),
    fonts: (doc.fonts ?? []).map((font) => ({
      id: font.id,
      family: font.family,
      weight: font.weight,
      style: font.style,
      asset: font.asset,
    })),
    comments: (doc.comments ?? []).map((comment) => ({
      id: comment.id,
      pageId: comment.pageId,
      nodeId: comment.nodeId ?? null,
      body: comment.body,
      author: comment.author,
      resolved: comment.resolved,
      replyCount: comment.replies?.length ?? 0,
    })),
    stats: {
      pages: doc.pages?.length ?? 0,
      nodes: (doc.pages ?? []).reduce((total, entry) => total + (entry.children ?? []).reduce((sum, node) => sum + countNodes(node), 0), 0),
      components: doc.components?.length ?? 0,
      styles: doc.styles?.length ?? 0,
      fonts: doc.fonts?.length ?? 0,
      unresolvedComments: (doc.comments ?? []).filter((comment) => !comment.resolved).length,
    },
    meta: doc.meta ?? {},
  }
}

/** @param {number} value */
function round(value) {
  return Math.round(Number(value) * 100) / 100
}

/** @param {unknown} value */
export function isValidColor(value) {
  return typeof value === 'string' && COLOR_RE.test(value)
}
