/**
 * Converts native `.fig` / Figma clipboard Kiwi trees (`NativeFigma`) into `dsh.figma.ir@1`.
 * Supports both cold import of brand-new `.fig` files and incremental Pull diffs.
 */

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { figmaRgbaToHex, round2 } from '../../shared/figma/ir.js'
import {
  FIGMA_IR_FORMAT,
  FIGMA_IR_VERSION,
  type FigmaIrDocument,
  type FigmaIrEffect,
  type FigmaIrFill,
  type FigmaIrFont,
  type FigmaIrLayout,
  type FigmaIrNode,
  type FigmaIrPage,
  type FigmaIrStroke,
} from '../../shared/figma/sync-types.js'
import { asProps, figmaId, readNativeFig, type NativeFigma, type Props } from './fig-reader.js'

const WEIGHT_BY_STYLE: Array<[RegExp, number]> = [
  [/thin|hairline/i, 100],
  [/extra\s*light|ultra\s*light/i, 200],
  [/light/i, 300],
  [/medium/i, 500],
  [/semi\s*bold|demi\s*bold/i, 600],
  [/extra\s*bold|ultra\s*bold/i, 800],
  [/black|heavy/i, 900],
  [/bold/i, 700],
]

function detectImageExt(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return '.png'
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return '.jpg'
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return '.gif'
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return '.webp'
  return '.png'
}

export async function persistFigmaImages(
  canvasDir: string,
  images: ReadonlyMap<string, Uint8Array>,
): Promise<Record<string, string>> {
  const hashMap: Record<string, string> = {}
  if (images.size === 0) return hashMap
  const assetsDir = join(canvasDir, 'assets')
  await mkdir(assetsDir, { recursive: true })
  for (const [figmaHash, bytes] of images) {
    if (!bytes.byteLength) continue
    const ext = detectImageExt(bytes)
    const sha24 = createHash('sha256').update(bytes).digest('hex').slice(0, 24)
    const rel = `assets/${sha24}${ext}`
    await writeFile(join(canvasDir, rel), bytes)
    hashMap[figmaHash.toLowerCase()] = rel
  }
  return hashMap
}

function bytesToHex(bytes: unknown): string | undefined {
  if (bytes instanceof Uint8Array) {
    return Buffer.from(bytes).toString('hex').toLowerCase()
  }
  if (Array.isArray(bytes)) {
    return Buffer.from(bytes.map((b) => Number(b) & 0xff)).toString('hex').toLowerCase()
  }
  if (typeof bytes === 'string' && /^[0-9a-f]{40}$/i.test(bytes)) return bytes.toLowerCase()
  return undefined
}

function convertPaints(paints: unknown, imageAssets: Readonly<Record<string, string>>): FigmaIrFill[] | undefined {
  if (!Array.isArray(paints)) return undefined
  const out: FigmaIrFill[] = []
  for (const raw of paints) {
    const p = asProps(raw)
    if (p.visible === false) continue
    const paintOpacity = typeof p.opacity === 'number' ? p.opacity : 1
    if (p.type === 'SOLID') {
      const c = asProps(p.color)
      const conv = figmaRgbaToHex(
        { r: Number(c.r ?? 0), g: Number(c.g ?? 0), b: Number(c.b ?? 0), a: Number(c.a ?? 1) },
        paintOpacity,
      )
      out.push(conv.opacity < 1 ? { type: 'solid', color: conv.color, opacity: conv.opacity } : { type: 'solid', color: conv.color })
    } else if (p.type === 'GRADIENT_LINEAR' || p.type === 'GRADIENT_RADIAL') {
      const stopsRaw = Array.isArray(p.stops) ? p.stops : []
      const stops = stopsRaw.map((s) => {
        const sp = asProps(s)
        const c = asProps(sp.color)
        const conv = figmaRgbaToHex({ r: Number(c.r ?? 0), g: Number(c.g ?? 0), b: Number(c.b ?? 0), a: Number(c.a ?? 1) }, 1)
        return {
          position: round2(Number(sp.position ?? 0)),
          color: conv.color,
          ...(conv.opacity < 1 ? { opacity: conv.opacity } : {}),
        }
      })
      if (stops.length >= 2) {
        out.push({
          type: p.type === 'GRADIENT_LINEAR' ? 'linear-gradient' : 'radial-gradient',
          angle: 180,
          stops,
          ...(paintOpacity < 1 ? { opacity: round2(paintOpacity) } : {}),
        })
      }
    } else if (p.type === 'IMAGE') {
      const img = asProps(p.image)
      const hash = bytesToHex(img.hash)
      const asset = hash ? imageAssets[hash] : undefined
      const scaleModeRaw = String(p.imageScaleMode ?? 'FILL').toUpperCase()
      const scaleMode =
        scaleModeRaw === 'FIT' ? 'fit' : scaleModeRaw === 'STRETCH' ? 'stretch' : scaleModeRaw === 'TILE' ? 'tile' : 'fill'
      if (asset || hash) {
        out.push({
          type: 'image',
          ...(asset ? { asset } : {}),
          ...(hash ? { imageHash: hash } : {}),
          scaleMode,
          ...(paintOpacity < 1 ? { opacity: round2(paintOpacity) } : {}),
        })
      }
    }
  }
  return out.length ? out : undefined
}

function convertStrokes(node: Props): FigmaIrStroke[] | undefined {
  const paints = Array.isArray(node.strokePaints) ? node.strokePaints : []
  const weight = typeof node.strokeWeight === 'number' ? node.strokeWeight : 1
  const alignRaw = String(node.strokeAlign ?? 'CENTER').toUpperCase()
  const align = alignRaw === 'INSIDE' ? 'inside' : alignRaw === 'OUTSIDE' ? 'outside' : 'center'
  const out: FigmaIrStroke[] = []
  for (const raw of paints) {
    const p = asProps(raw)
    if (p.visible === false || p.type !== 'SOLID') continue
    const c = asProps(p.color)
    const conv = figmaRgbaToHex(
      { r: Number(c.r ?? 0), g: Number(c.g ?? 0), b: Number(c.b ?? 0), a: Number(c.a ?? 1) },
      typeof p.opacity === 'number' ? p.opacity : 1,
    )
    out.push({
      color: conv.color,
      width: round2(Math.max(0, weight)),
      ...(conv.opacity < 1 ? { opacity: conv.opacity } : {}),
      align,
    })
  }
  return out.length ? out : undefined
}

function convertEffects(node: Props): FigmaIrEffect[] | undefined {
  const effects = Array.isArray(node.effects) ? node.effects : []
  const out: FigmaIrEffect[] = []
  for (const raw of effects) {
    const e = asProps(raw)
    if (e.visible === false) continue
    const radius = typeof e.radius === 'number' ? round2(Math.max(0, e.radius)) : 0
    if (e.type === 'FOREGROUND_BLUR' || e.type === 'LAYER_BLUR' || e.type === 'BACKGROUND_BLUR') {
      out.push({ type: 'blur', blur: radius })
    } else if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
      const c = asProps(e.color)
      const offset = asProps(e.offset)
      const conv = figmaRgbaToHex({ r: Number(c.r ?? 0), g: Number(c.g ?? 0), b: Number(c.b ?? 0), a: Number(c.a ?? 0.25) })
      out.push({
        type: e.type === 'INNER_SHADOW' ? 'inner-shadow' : 'drop-shadow',
        color: conv.color,
        opacity: conv.opacity,
        x: round2(Number(offset.x ?? 0)),
        y: round2(Number(offset.y ?? 2)),
        blur: radius,
        ...(typeof e.spread === 'number' && e.spread !== 0 ? { spread: round2(e.spread) } : {}),
      })
    }
  }
  return out.length ? out : undefined
}

function convertFont(node: Props): FigmaIrFont {
  const fn = asProps(node.fontName)
  const family = typeof fn.family === 'string' && fn.family.trim() ? fn.family.trim() : 'Inter'
  const styleStr = typeof fn.style === 'string' ? fn.style : 'Regular'
  let weight = 400
  for (const [re, w] of WEIGHT_BY_STYLE) {
    if (re.test(styleStr)) {
      weight = w
      break
    }
  }
  const size = typeof node.fontSize === 'number' && node.fontSize > 0 ? round2(node.fontSize) : 14
  let lineHeight = 1.4
  const lh = asProps(node.lineHeight)
  if (typeof lh.value === 'number' && lh.value > 0) {
    if (lh.units === 'PIXELS') lineHeight = round2(lh.value / size)
    else if (lh.units === 'PERCENT') lineHeight = round2(lh.value / 100)
  }
  const ls = asProps(node.letterSpacing)
  const letterSpacing =
    typeof ls.value === 'number' && ls.value !== 0
      ? round2(ls.units === 'PERCENT' ? (ls.value / 100) * size : ls.value)
      : undefined
  return {
    family,
    weight,
    ...(/italic|oblique/i.test(styleStr) ? { style: 'italic' as const } : {}),
    size,
    lineHeight: Math.max(0.5, Math.min(10, lineHeight)),
    ...(letterSpacing ? { letterSpacing } : {}),
  }
}

function convertLayout(node: Props): FigmaIrLayout | undefined {
  const mode = String(node.stackMode ?? 'NONE')
  if (mode !== 'HORIZONTAL' && mode !== 'VERTICAL') return undefined
  const mapPrimary = (v: unknown): FigmaIrLayout['alignPrimary'] => {
    if (v === 'CENTER') return 'center'
    if (v === 'MAX') return 'end'
    if (v === 'SPACE_EVENLY' || v === 'SPACE_BETWEEN') return 'space-between'
    return 'start'
  }
  const mapCounter = (v: unknown): FigmaIrLayout['alignCounter'] => {
    if (v === 'CENTER') return 'center'
    if (v === 'MAX') return 'end'
    if (v === 'STRETCH') return 'stretch'
    return 'start'
  }
  return {
    direction: mode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
    gap: round2(typeof node.stackSpacing === 'number' ? Math.max(0, node.stackSpacing) : 0),
    padding: {
      top: round2(Number(node.stackVerticalPadding ?? node.stackPaddingTop ?? 0)),
      right: round2(Number(node.stackPaddingRight ?? node.stackHorizontalPadding ?? 0)),
      bottom: round2(Number(node.stackPaddingBottom ?? node.stackVerticalPadding ?? 0)),
      left: round2(Number(node.stackHorizontalPadding ?? node.stackPaddingLeft ?? 0)),
    },
    alignPrimary: mapPrimary(node.stackPrimaryAlignItems),
    alignCounter: mapCounter(node.stackCounterAlignItems),
    ...(node.stackWrap === 'WRAP' ? { wrap: true } : {}),
  }
}

function mapFigmaNodeType(rawType: unknown): { type: FigmaIrNode['type']; degraded?: string } {
  switch (rawType) {
    case 'FRAME':
    case 'COMPONENT':
    case 'COMPONENT_SET':
    case 'SECTION':
    case 'SYMBOL':
      return { type: 'frame' }
    case 'GROUP':
      return { type: 'group' }
    case 'RECTANGLE':
    case 'ROUNDED_RECTANGLE':
      return { type: 'rect' }
    case 'ELLIPSE':
      return { type: 'ellipse' }
    case 'LINE':
      return { type: 'line' }
    case 'TEXT':
      return { type: 'text' }
    case 'VECTOR':
    case 'STAR':
    case 'REGULAR_POLYGON':
    case 'BOOLEAN_OPERATION':
      return { type: 'rect', degraded: String(rawType) }
    case 'INSTANCE':
      return { type: 'frame', degraded: 'INSTANCE' }
    default:
      return { type: 'frame', degraded: String(rawType ?? 'UNKNOWN') }
  }
}

function extractTransform(node: Props): { x: number; y: number; rotation: number } {
  const t = asProps(node.transform)
  const m00 = typeof t.m00 === 'number' ? t.m00 : 1
  const m10 = typeof t.m10 === 'number' ? t.m10 : 0
  const x = typeof t.m02 === 'number' ? round2(t.m02) : 0
  const y = typeof t.m12 === 'number' ? round2(t.m12) : 0
  const rotation = round2((Math.atan2(m10, m00) * 180) / Math.PI)
  return { x, y, rotation: Math.abs(rotation) < 0.01 ? 0 : rotation }
}

/**
 * Convert a decoded `NativeFigma` object into `dsh.figma.ir@1`.
 */
export function nativeFigToIr(
  native: NativeFigma,
  options: { fileKey?: string; fileName?: string; imageAssets?: Readonly<Record<string, string>> } = {},
): FigmaIrDocument {
  const imageAssets = options.imageAssets ?? {}
  const byId = new Map<string, Props>()
  const childrenByParent = new Map<string, Array<{ position: string; node: Props }>>()
  const notices: string[] = []
  let degradedCount = 0

  for (const raw of native.nodes) {
    const id = figmaId(raw.guid)
    if (!id) continue
    if (raw.phase === 'REMOVED') continue
    byId.set(id, raw)
    const parentIndex = asProps(raw.parentIndex)
    const parentId = figmaId(parentIndex.guid)
    if (parentId) {
      const list = childrenByParent.get(parentId) ?? []
      list.push({ position: typeof parentIndex.position === 'string' ? parentIndex.position : '', node: raw })
      childrenByParent.set(parentId, list)
    }
  }

  for (const list of childrenByParent.values()) {
    list.sort((a, b) => (a.position < b.position ? -1 : a.position > b.position ? 1 : 0))
  }

  const convertNode = (raw: Props): FigmaIrNode => {
    const id = figmaId(raw.guid) ?? '0:0'
    const mapped = mapFigmaNodeType(raw.type)
    if (mapped.degraded) degradedCount += 1
    const size = asProps(raw.size)
    const transform = extractTransform(raw)
    const pluginData = Array.isArray(raw.pluginData) ? raw.pluginData : []
    let dshId: string | undefined
    for (const entry of pluginData) {
      const pe = asProps(entry)
      if (pe.key === 'dshId' && typeof pe.value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(pe.value)) {
        dshId = pe.value
      }
    }

    const passthrough: Record<string, unknown> = {}
    if (raw.blendMode && raw.blendMode !== 'PASS_THROUGH' && raw.blendMode !== 'NORMAL') {
      passthrough.blendMode = raw.blendMode
    }
    if (Array.isArray(raw.prototypeInteractions) && raw.prototypeInteractions.length > 0) {
      passthrough.reactions = raw.prototypeInteractions
    }
    if (mapped.degraded) passthrough.originalFigmaType = mapped.degraded

    const cornerRadii =
      raw.rectangleCornerRadiiIndependent === true
        ? ([
            round2(Number(raw.rectangleTopLeftCornerRadius ?? 0)),
            round2(Number(raw.rectangleTopRightCornerRadius ?? 0)),
            round2(Number(raw.rectangleBottomRightCornerRadius ?? 0)),
            round2(Number(raw.rectangleBottomLeftCornerRadius ?? 0)),
          ] as [number, number, number, number])
        : undefined

    const textData = asProps(raw.textData)
    const kids = (childrenByParent.get(id) ?? []).map((item) => convertNode(item.node))

    const ir: FigmaIrNode = {
      figmaId: id,
      ...(dshId ? { dshId } : {}),
      type: mapped.type,
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : mapped.type,
      x: transform.x,
      y: transform.y,
      width: round2(Math.max(0, Number(size.x ?? 0))),
      height: round2(Math.max(0, Number(size.y ?? 0))),
      ...(transform.rotation ? { rotation: transform.rotation } : {}),
      ...(typeof raw.opacity === 'number' && raw.opacity < 1 ? { opacity: round2(raw.opacity) } : {}),
      ...(raw.visible === false ? { visible: false } : {}),
      ...(raw.locked === true ? { locked: true } : {}),
      ...(mapped.type === 'frame' ? { clip: raw.frameMaskDisabled !== true } : {}),
      ...(typeof raw.cornerRadius === 'number' && raw.cornerRadius > 0 ? { cornerRadius: round2(raw.cornerRadius) } : {}),
      ...(cornerRadii ? { cornerRadii } : {}),
      ...(convertPaints(raw.fillPaints, imageAssets) ? { fills: convertPaints(raw.fillPaints, imageAssets) } : {}),
      ...(convertStrokes(raw) ? { strokes: convertStrokes(raw) } : {}),
      ...(convertEffects(raw) ? { effects: convertEffects(raw) } : {}),
      ...(convertLayout(raw) ? { layout: convertLayout(raw) } : {}),
      ...(raw.stackPositioning === 'ABSOLUTE' ? { layoutPositioning: 'absolute' as const } : {}),
      ...(mapped.type === 'text'
        ? {
            text: typeof textData.characters === 'string' ? textData.characters : '',
            font: convertFont(raw),
            align:
              raw.textAlignHorizontal === 'CENTER'
                ? 'center'
                : raw.textAlignHorizontal === 'RIGHT'
                  ? 'right'
                  : raw.textAlignHorizontal === 'JUSTIFIED'
                    ? 'justify'
                    : 'left',
            verticalAlign:
              raw.textAlignVertical === 'CENTER' ? 'center' : raw.textAlignVertical === 'BOTTOM' ? 'bottom' : 'top',
          }
        : {}),
      ...(kids.length > 0 && (mapped.type === 'frame' || mapped.type === 'group') ? { children: kids } : {}),
      ...(Object.keys(passthrough).length > 0 ? { passthrough } : {}),
    }
    return ir
  }

  // Locate DOCUMENT root and CANVAS pages
  const docRoot = [...byId.values()].find((n) => n.type === 'DOCUMENT')
  const docId = docRoot ? figmaId(docRoot.guid) : undefined
  const canvasNodes = (docId ? (childrenByParent.get(docId) ?? []).map((i) => i.node) : [...byId.values()]).filter(
    (n) => n.type === 'CANVAS' && n.internalOnly !== true,
  )

  const pages: FigmaIrPage[] = []
  if (canvasNodes.length > 0) {
    for (const canvas of canvasNodes) {
      const cId = figmaId(canvas.guid) ?? '0:1'
      const bg = asProps(canvas.backgroundColor)
      const bgHex = canvas.backgroundColor
        ? figmaRgbaToHex({ r: Number(bg.r ?? 0.96), g: Number(bg.g ?? 0.96), b: Number(bg.b ?? 0.96), a: 1 }).color
        : '#f5f5f5'
      const children = (childrenByParent.get(cId) ?? []).map((item) => convertNode(item.node))
      pages.push({
        figmaId: cId,
        name: typeof canvas.name === 'string' ? canvas.name : 'Page 1',
        background: bgHex,
        children,
      })
    }
  } else {
    // Clipboard payloads often contain loose top-level nodes without a CANVAS wrapper
    const topNodes = [...byId.values()].filter((n) => {
      if (n.type === 'DOCUMENT' || n.type === 'CANVAS') return false
      const parentId = figmaId(asProps(n.parentIndex).guid)
      return !parentId || !byId.has(parentId) || byId.get(parentId)?.type === 'CANVAS' || byId.get(parentId)?.type === 'DOCUMENT'
    })
    pages.push({
      name: 'Pasted from Figma',
      background: '#f5f5f5',
      children: topNodes.map(convertNode),
    })
  }

  if (degradedCount > 0) {
    notices.push(`${degradedCount} 个 Figma 原生复杂节点已降级为容器/矩形占位，原类型已存入 passthrough 透传表。`)
  }

  return {
    format: FIGMA_IR_FORMAT,
    version: FIGMA_IR_VERSION,
    ...(options.fileKey ? { fileKey: options.fileKey } : {}),
    ...(options.fileName || (typeof docRoot?.name === 'string' ? docRoot.name : undefined)
      ? { fileName: options.fileName ?? String(docRoot?.name) }
      : {}),
    readCompleteness: 'complete',
    pages,
    ...(notices.length ? { notices } : {}),
  }
}

export async function decodeFigBytesToIr(
  bytes: Uint8Array,
  canvasDir: string,
  options: { fileKey?: string; fileName?: string } = {},
): Promise<{ ir: FigmaIrDocument; schemaVersion: number; imageHashes: Record<string, string> }> {
  const native = readNativeFig(bytes)
  const imageHashes = await persistFigmaImages(canvasDir, native.images)
  const ir = nativeFigToIr(native, { ...options, imageAssets: imageHashes })
  return { ir, schemaVersion: native.schemaVersion, imageHashes }
}
