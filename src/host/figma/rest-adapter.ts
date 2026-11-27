/**
 * Free Figma REST API adapter:
 * - Parse Figma file/node URLs
 * - Cold-import pages or node subtrees (`GET /v1/files/:key` / `/nodes` + image fill downloads)
 * - Sync & reply to Figma review comments (`GET/POST /v1/files/:key/comments`)
 * - Read version history (`GET /v1/files/:key/versions`)
 *
 * Uses strictly free-tier Figma REST endpoints (no Dev Mode / Enterprise Variables API).
 */

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { newId } from '../../shared/format.js'
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
  type FigmaSyncSidecar,
  type SyncedFigmaComment,
} from '../../shared/figma/sync-types.js'

const API_ORIGIN = 'https://api.figma.com'
const FILE_KEY_PATTERN = /^[A-Za-z0-9]{8,70}$/
const MAX_RESPONSE_BYTES = 24 * 1024 * 1024
const MAX_PAGES = 50

export interface ParsedFigmaUrl {
  fileKey: string
  nodeId?: string
  fileName?: string
  url: string
}

/** Parse a Figma file/design/proto/board URL (or bare fileKey) into `{ fileKey, nodeId? }`. */
export function parseFigmaUrl(input: string): ParsedFigmaUrl {
  const raw = String(input ?? '').trim()
  if (FILE_KEY_PATTERN.test(raw)) {
    return { fileKey: raw, url: `https://www.figma.com/design/${raw}` }
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Invalid Figma URL or file key')
  }
  if (!/(^|\.)figma\.com$/i.test(url.hostname)) {
    throw new Error('URL must point to figma.com')
  }
  const segments = url.pathname.split('/').filter(Boolean)
  const kindIdx = segments.findIndex((s) => s === 'file' || s === 'design' || s === 'proto' || s === 'board')
  const fileKey = kindIdx >= 0 ? segments[kindIdx + 1] : undefined
  if (!fileKey || !FILE_KEY_PATTERN.test(fileKey)) {
    throw new Error('Could not extract a valid Figma file key from URL')
  }
  const fileName = kindIdx >= 0 && segments[kindIdx + 2] ? decodeURIComponent(segments[kindIdx + 2]).replace(/-/g, ' ') : undefined
  const rawNodeId = url.searchParams.get('node-id')
  const nodeId = rawNodeId ? rawNodeId.replace(/-/g, ':') : undefined
  return {
    fileKey,
    ...(nodeId ? { nodeId } : {}),
    ...(fileName ? { fileName } : {}),
    url: url.toString(),
  }
}

async function figmaRequest(
  path: string,
  token: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; fetchImpl?: typeof fetch } = {},
): Promise<Record<string, unknown>> {
  const request = options.fetchImpl ?? fetch
  const url = new URL(path, API_ORIGIN)
  const response = await request(url, {
    method: options.method ?? 'GET',
    redirect: 'error',
    headers: {
      accept: 'application/json',
      'X-Figma-Token': token,
      ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after')
    const retry = response.status === 429 && /^\d{1,9}$/.test(retryAfter ?? '') ? `; retry in ${retryAfter}s` : ''
    throw new Error(`Figma ${url.pathname} returned HTTP ${response.status}${retry}`)
  }
  const buf = Buffer.from(await response.arrayBuffer())
  if (buf.byteLength > MAX_RESPONSE_BYTES) {
    throw new Error('Figma REST response exceeds 24 MiB')
  }
  const parsed = JSON.parse(buf.toString('utf8'))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Figma REST returned an unexpected payload')
  }
  return parsed as Record<string, unknown>
}

function convertRestFills(paints: unknown, imageAssets: Readonly<Record<string, string>>): FigmaIrFill[] | undefined {
  if (!Array.isArray(paints)) return undefined
  const out: FigmaIrFill[] = []
  for (const raw of paints) {
    if (!raw || typeof raw !== 'object') continue
    const p = raw as Record<string, unknown>
    if (p.visible === false) continue
    const opacity = typeof p.opacity === 'number' ? p.opacity : 1
    if (p.type === 'SOLID' && p.color && typeof p.color === 'object') {
      const c = p.color as Record<string, number>
      const conv = figmaRgbaToHex(c, opacity)
      out.push(conv.opacity < 1 ? { type: 'solid', color: conv.color, opacity: conv.opacity } : { type: 'solid', color: conv.color })
    } else if ((p.type === 'GRADIENT_LINEAR' || p.type === 'GRADIENT_RADIAL') && Array.isArray(p.gradientStops)) {
      const stops = p.gradientStops
        .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
        .map((s) => {
          const conv = figmaRgbaToHex(s.color as Record<string, number>, 1)
          return {
            position: round2(Number(s.position ?? 0)),
            color: conv.color,
            ...(conv.opacity < 1 ? { opacity: conv.opacity } : {}),
          }
        })
      if (stops.length >= 2) {
        out.push({
          type: p.type === 'GRADIENT_LINEAR' ? 'linear-gradient' : 'radial-gradient',
          angle: 180,
          stops,
          ...(opacity < 1 ? { opacity: round2(opacity) } : {}),
        })
      }
    } else if (p.type === 'IMAGE' && typeof p.imageRef === 'string') {
      const hash = p.imageRef
      const asset = imageAssets[hash]
      const scaleRaw = String(p.scaleMode ?? 'FILL').toUpperCase()
      const scaleMode = scaleRaw === 'FIT' ? 'fit' : scaleRaw === 'STRETCH' ? 'stretch' : scaleRaw === 'TILE' ? 'tile' : 'fill'
      if (asset || hash) {
        out.push({
          type: 'image',
          ...(asset ? { asset } : {}),
          imageHash: hash,
          scaleMode,
          ...(opacity < 1 ? { opacity: round2(opacity) } : {}),
        })
      }
    }
  }
  return out.length ? out : undefined
}

function convertRestStrokes(node: Record<string, unknown>): FigmaIrStroke[] | undefined {
  if (!Array.isArray(node.strokes)) return undefined
  const weight = typeof node.strokeWeight === 'number' ? node.strokeWeight : 1
  const alignRaw = String(node.strokeAlign ?? 'CENTER').toUpperCase()
  const align = alignRaw === 'INSIDE' ? 'inside' : alignRaw === 'OUTSIDE' ? 'outside' : 'center'
  const out: FigmaIrStroke[] = []
  for (const raw of node.strokes) {
    if (!raw || typeof raw !== 'object') continue
    const p = raw as Record<string, unknown>
    if (p.visible === false || p.type !== 'SOLID') continue
    const conv = figmaRgbaToHex(p.color as Record<string, number>, typeof p.opacity === 'number' ? p.opacity : 1)
    out.push({
      color: conv.color,
      width: round2(Math.max(0, weight)),
      ...(conv.opacity < 1 ? { opacity: conv.opacity } : {}),
      align,
    })
  }
  return out.length ? out : undefined
}

function convertRestEffects(node: Record<string, unknown>): FigmaIrEffect[] | undefined {
  if (!Array.isArray(node.effects)) return undefined
  const out: FigmaIrEffect[] = []
  for (const raw of node.effects) {
    if (!raw || typeof raw !== 'object') continue
    const e = raw as Record<string, unknown>
    if (e.visible === false) continue
    const radius = typeof e.radius === 'number' ? round2(Math.max(0, e.radius)) : 0
    if (e.type === 'LAYER_BLUR' || e.type === 'BACKGROUND_BLUR') {
      out.push({ type: 'blur', blur: radius })
    } else if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
      const conv = figmaRgbaToHex(e.color as Record<string, number>)
      const offset = (e.offset && typeof e.offset === 'object' ? e.offset : {}) as Record<string, number>
      out.push({
        type: e.type === 'INNER_SHADOW' ? 'inner-shadow' : 'drop-shadow',
        color: conv.color,
        opacity: conv.opacity,
        x: round2(offset.x ?? 0),
        y: round2(offset.y ?? 2),
        blur: radius,
        ...(typeof e.spread === 'number' && e.spread !== 0 ? { spread: round2(e.spread) } : {}),
      })
    }
  }
  return out.length ? out : undefined
}

function convertRestLayout(node: Record<string, unknown>): FigmaIrLayout | undefined {
  const mode = node.layoutMode
  if (mode !== 'HORIZONTAL' && mode !== 'VERTICAL') return undefined
  const mapPrimary = (v: unknown): FigmaIrLayout['alignPrimary'] =>
    v === 'CENTER' ? 'center' : v === 'MAX' ? 'end' : v === 'SPACE_BETWEEN' ? 'space-between' : 'start'
  const mapCounter = (v: unknown): FigmaIrLayout['alignCounter'] =>
    v === 'CENTER' ? 'center' : v === 'MAX' ? 'end' : v === 'STRETCH' ? 'stretch' : 'start'
  return {
    direction: mode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
    gap: round2(typeof node.itemSpacing === 'number' ? Math.max(0, node.itemSpacing) : 0),
    padding: {
      top: round2(Number(node.paddingTop ?? 0)),
      right: round2(Number(node.paddingRight ?? 0)),
      bottom: round2(Number(node.paddingBottom ?? 0)),
      left: round2(Number(node.paddingLeft ?? 0)),
    },
    alignPrimary: mapPrimary(node.primaryAxisAlignItems),
    alignCounter: mapCounter(node.counterAxisAlignItems),
    ...(node.layoutWrap === 'WRAP' ? { wrap: true } : {}),
  }
}

function convertRestFont(node: Record<string, unknown>): FigmaIrFont {
  const style = (node.style && typeof node.style === 'object' ? node.style : {}) as Record<string, unknown>
  const size = typeof style.fontSize === 'number' && style.fontSize > 0 ? round2(style.fontSize) : 14
  let lineHeight = 1.4
  if (typeof style.lineHeightPx === 'number' && style.lineHeightPx > 0) {
    lineHeight = round2(style.lineHeightPx / size)
  } else if (typeof style.lineHeightPercentFontSize === 'number' && style.lineHeightPercentFontSize > 0) {
    lineHeight = round2(style.lineHeightPercentFontSize / 100)
  }
  return {
    family: typeof style.fontFamily === 'string' && style.fontFamily.trim() ? style.fontFamily.trim() : 'Inter',
    weight: typeof style.fontWeight === 'number' ? Math.round(style.fontWeight) : 400,
    ...(style.italic === true ? { style: 'italic' as const } : {}),
    size,
    lineHeight: Math.max(0.5, Math.min(10, lineHeight)),
    ...(typeof style.letterSpacing === 'number' && style.letterSpacing !== 0 ? { letterSpacing: round2(style.letterSpacing) } : {}),
  }
}

function convertRestNode(
  raw: Record<string, unknown>,
  parentBox: { x: number; y: number } | null,
  imageAssets: Readonly<Record<string, string>>,
): FigmaIrNode {
  const figmaType = String(raw.type ?? 'FRAME')
  const mappedType: FigmaIrNode['type'] =
    figmaType === 'GROUP'
      ? 'group'
      : figmaType === 'RECTANGLE'
        ? 'rect'
        : figmaType === 'ELLIPSE'
          ? 'ellipse'
          : figmaType === 'LINE'
            ? 'line'
            : figmaType === 'TEXT'
              ? 'text'
              : figmaType === 'VECTOR' && Array.isArray(raw.fillGeometry) && typeof (raw.fillGeometry[0] as Record<string, unknown>)?.path === 'string'
                ? 'path'
                : 'frame'

  const box = (raw.absoluteBoundingBox && typeof raw.absoluteBoundingBox === 'object'
    ? raw.absoluteBoundingBox
    : { x: 0, y: 0, width: 100, height: 100 }) as { x: number; y: number; width: number; height: number }

  const x = round2(parentBox ? box.x - parentBox.x : box.x)
  const y = round2(parentBox ? box.y - parentBox.y : box.y)
  const width = round2(Math.max(0, box.width ?? 0))
  const height = round2(Math.max(0, box.height ?? 0))

  const passthrough: Record<string, unknown> = {}
  if (raw.blendMode && raw.blendMode !== 'PASS_THROUGH' && raw.blendMode !== 'NORMAL') passthrough.blendMode = raw.blendMode
  if (raw.constraints) passthrough.constraints = raw.constraints
  if (Array.isArray(raw.interactions) && raw.interactions.length > 0) passthrough.reactions = raw.interactions
  if (figmaType === 'INSTANCE' && typeof raw.componentId === 'string') passthrough.figmaComponentId = raw.componentId

  const cornerRadii =
    Array.isArray(raw.rectangleCornerRadii) && raw.rectangleCornerRadii.length === 4
      ? (raw.rectangleCornerRadii.map((n) => round2(Math.max(0, Number(n) || 0))) as [number, number, number, number])
      : undefined

  const children =
    Array.isArray(raw.children) && (mappedType === 'frame' || mappedType === 'group')
      ? (raw.children as Array<Record<string, unknown>>).map((child) => convertRestNode(child, box, imageAssets))
      : undefined

  const style = (raw.style && typeof raw.style === 'object' ? raw.style : {}) as Record<string, unknown>
  const vectorPath =
    mappedType === 'path' && Array.isArray(raw.fillGeometry)
      ? String((raw.fillGeometry[0] as Record<string, unknown>)?.path ?? '')
      : undefined

  return {
    figmaId: typeof raw.id === 'string' ? raw.id : undefined,
    type: mappedType,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : mappedType,
    x,
    y,
    width,
    height,
    ...(typeof raw.rotation === 'number' && raw.rotation !== 0 ? { rotation: round2(raw.rotation) } : {}),
    ...(typeof raw.opacity === 'number' && raw.opacity < 1 ? { opacity: round2(raw.opacity) } : {}),
    ...(raw.visible === false ? { visible: false } : {}),
    ...(raw.locked === true ? { locked: true } : {}),
    ...(mappedType === 'frame' ? { clip: raw.clipsContent !== false } : {}),
    ...(typeof raw.cornerRadius === 'number' && raw.cornerRadius > 0 ? { cornerRadius: round2(raw.cornerRadius) } : {}),
    ...(cornerRadii ? { cornerRadii } : {}),
    ...(convertRestFills(raw.fills, imageAssets) ? { fills: convertRestFills(raw.fills, imageAssets) } : {}),
    ...(convertRestStrokes(raw) ? { strokes: convertRestStrokes(raw) } : {}),
    ...(convertRestEffects(raw) ? { effects: convertRestEffects(raw) } : {}),
    ...(convertRestLayout(raw) ? { layout: convertRestLayout(raw) } : {}),
    ...(raw.layoutPositioning === 'ABSOLUTE' ? { layoutPositioning: 'absolute' as const } : {}),
    ...(mappedType === 'text'
      ? {
          text: typeof raw.characters === 'string' ? raw.characters : '',
          font: convertRestFont(raw),
          align:
            style.textAlignHorizontal === 'CENTER'
              ? 'center'
              : style.textAlignHorizontal === 'RIGHT'
                ? 'right'
                : style.textAlignHorizontal === 'JUSTIFIED'
                  ? 'justify'
                  : 'left',
          verticalAlign:
            style.textAlignVertical === 'CENTER' ? 'center' : style.textAlignVertical === 'BOTTOM' ? 'bottom' : 'top',
        }
      : {}),
    ...(mappedType === 'path' && vectorPath
      ? {
          d: vectorPath,
          viewBox: { x: 0, y: 0, width: Math.max(1, width), height: Math.max(1, height) },
          fillRule: 'nonzero' as const,
        }
      : {}),
    ...(children && children.length > 0 ? { children } : {}),
    ...(Object.keys(passthrough).length > 0 ? { passthrough } : {}),
  }
}

async function downloadRestImageFills(
  fileKey: string,
  token: string,
  canvasDir: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, string>> {
  const imageAssets: Record<string, string> = {}
  try {
    const res = await figmaRequest(`/v1/files/${fileKey}/images`, token, { fetchImpl })
    const meta = res.meta && typeof res.meta === 'object' ? (res.meta as Record<string, unknown>) : {}
    const images = meta.images && typeof meta.images === 'object' ? (meta.images as Record<string, string>) : {}
    const entries = Object.entries(images).filter(([, url]) => typeof url === 'string' && url.startsWith('https://'))
    if (entries.length === 0) return imageAssets
    await mkdir(join(canvasDir, 'assets'), { recursive: true })
    for (const [imageRef, imageUrl] of entries.slice(0, 64)) {
      try {
        const imgRes = await fetchImpl(imageUrl, { signal: AbortSignal.timeout(20000) })
        if (!imgRes.ok) continue
        const bytes = Buffer.from(await imgRes.arrayBuffer())
        if (!bytes.byteLength || bytes.byteLength > 20 * 1024 * 1024) continue
        const ct = imgRes.headers.get('content-type') ?? ''
        const ext = ct.includes('jpeg') || ct.includes('jpg') ? '.jpg' : ct.includes('webp') ? '.webp' : ct.includes('gif') ? '.gif' : '.png'
        const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 24)
        const rel = `assets/${hash}${ext}`
        await writeFile(join(canvasDir, rel), bytes)
        imageAssets[imageRef] = rel
      } catch {
        // skip single failed image without aborting import
      }
    }
  } catch {
    // /images is best-effort
  }
  return imageAssets
}

/**
 * Cold-import a Figma file or specific node subtree via free REST API into `dsh.figma.ir@1`.
 */
export async function fetchFigmaAsIr(
  fileKey: string,
  token: string,
  canvasDir: string,
  options: { nodeId?: string; depth?: number; fetchImpl?: typeof fetch } = {},
): Promise<{ ir: FigmaIrDocument; imageHashes: Record<string, string> }> {
  if (!FILE_KEY_PATTERN.test(fileKey)) throw new Error('Invalid Figma fileKey')
  const fetchImpl = options.fetchImpl ?? fetch
  const imageHashes = await downloadRestImageFills(fileKey, token, canvasDir, fetchImpl)

  if (options.nodeId) {
    const query = new URLSearchParams({ ids: options.nodeId, geometry: 'paths' })
    const data = await figmaRequest(`/v1/files/${fileKey}/nodes?${query}`, token, { fetchImpl })
    const nodesMap = (data.nodes && typeof data.nodes === 'object' ? data.nodes : {}) as Record<string, Record<string, unknown>>
    const entry = nodesMap[options.nodeId] ?? Object.values(nodesMap)[0]
    const docNode = entry?.document as Record<string, unknown> | undefined
    if (!docNode) throw new Error(`Figma node "${options.nodeId}" not found in file ${fileKey}`)

    const pages: FigmaIrPage[] =
      docNode.type === 'CANVAS'
        ? [
            {
              figmaId: String(docNode.id ?? options.nodeId),
              name: String(docNode.name ?? 'Page 1'),
              children: Array.isArray(docNode.children)
                ? (docNode.children as Array<Record<string, unknown>>).map((c) => convertRestNode(c, null, imageHashes))
                : [],
            },
          ]
        : [
            {
              name: String(data.name ?? 'Figma Selection'),
              children: [convertRestNode(docNode, null, imageHashes)],
            },
          ]

    return {
      imageHashes,
      ir: {
        format: FIGMA_IR_FORMAT,
        version: FIGMA_IR_VERSION,
        fileKey,
        fileName: typeof data.name === 'string' ? data.name : undefined,
        remoteVersion: typeof data.version === 'string' ? data.version : undefined,
        readCompleteness: 'partial',
        pages,
      },
    }
  }

  const query = new URLSearchParams({ geometry: 'paths' })
  if (typeof options.depth === 'number') query.set('depth', String(options.depth))
  const data = await figmaRequest(`/v1/files/${fileKey}?${query}`, token, { fetchImpl })
  const document = (data.document && typeof data.document === 'object' ? data.document : {}) as Record<string, unknown>
  const rawPages = Array.isArray(document.children) ? (document.children as Array<Record<string, unknown>>) : []

  const pages: FigmaIrPage[] = rawPages.map((p, idx) => {
    const bg = p.backgroundColor && typeof p.backgroundColor === 'object'
      ? figmaRgbaToHex(p.backgroundColor as Record<string, number>, 1).color
      : '#f5f5f5'
    return {
      figmaId: typeof p.id === 'string' ? p.id : `0:${idx + 1}`,
      name: typeof p.name === 'string' ? p.name : `Page ${idx + 1}`,
      background: bg,
      children: Array.isArray(p.children)
        ? (p.children as Array<Record<string, unknown>>).map((c) => convertRestNode(c, null, imageHashes))
        : [],
    }
  })

  return {
    imageHashes,
    ir: {
      format: FIGMA_IR_FORMAT,
      version: FIGMA_IR_VERSION,
      fileKey,
      fileName: typeof data.name === 'string' ? data.name : undefined,
      remoteVersion: typeof data.version === 'string' ? data.version : undefined,
      readCompleteness: options.depth !== undefined ? 'partial' : 'complete',
      pages,
    },
  }
}

/** Fetch Figma file comments and map them to bound Drafi node IDs. */
export async function fetchFigmaComments(
  fileKey: string,
  token: string,
  nodeBindings: Readonly<Record<string, string>>,
  fetchImpl: typeof fetch = fetch,
): Promise<SyncedFigmaComment[]> {
  if (!FILE_KEY_PATTERN.test(fileKey)) throw new Error('Invalid Figma fileKey')
  const data = await figmaRequest(`/v1/files/${fileKey}/comments`, token, { fetchImpl })
  const rawList = Array.isArray(data.comments) ? (data.comments as Array<Record<string, unknown>>) : []
  const figmaToDsh = new Map<string, string>()
  for (const [dshId, figmaId] of Object.entries(nodeBindings)) figmaToDsh.set(figmaId, dshId)
  const byId = new Map(rawList.map((c) => [String(c.id ?? ''), c]))

  return rawList.map((c) => {
    const parentId = typeof c.parent_id === 'string' && c.parent_id ? c.parent_id : undefined
    const root = parentId ? byId.get(parentId) ?? c : c
    const meta = (root.client_meta && typeof root.client_meta === 'object' ? root.client_meta : {}) as Record<string, unknown>
    const figmaNodeId = typeof meta.node_id === 'string' ? meta.node_id : undefined
    const offset = (meta.node_offset && typeof meta.node_offset === 'object' ? meta.node_offset : meta) as Record<string, unknown>
    const canvasNodeId = figmaNodeId ? figmaToDsh.get(figmaNodeId) : undefined
    const user = (c.user && typeof c.user === 'object' ? c.user : {}) as Record<string, unknown>
    return {
      id: String(c.id ?? ''),
      ...(parentId ? { parentId } : {}),
      message: String(c.message ?? ''),
      author: typeof user.handle === 'string' ? user.handle : 'Figma',
      createdAt: typeof c.created_at === 'string' ? c.created_at : new Date().toISOString(),
      resolvedAt: typeof c.resolved_at === 'string' ? c.resolved_at : null,
      ...(figmaNodeId ? { figmaNodeId } : {}),
      ...(canvasNodeId ? { canvasNodeId } : {}),
      ...(typeof offset.x === 'number' ? { x: round2(offset.x) } : {}),
      ...(typeof offset.y === 'number' ? { y: round2(offset.y) } : {}),
      anchorState: canvasNodeId ? 'attached' : 'unanchored-needs-relocate',
    }
  })
}

/** Post a comment or reply back to a Figma file (`POST /v1/files/:key/comments`). */
export async function postFigmaComment(
  fileKey: string,
  token: string,
  params: { message: string; parentId?: string; figmaNodeId?: string; x?: number; y?: number },
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; message: string; createdAt: string }> {
  if (!FILE_KEY_PATTERN.test(fileKey)) throw new Error('Invalid Figma fileKey')
  const message = String(params.message ?? '').trim()
  if (!message) throw new Error('Comment message is required')
  const body: Record<string, unknown> = { message }
  if (params.parentId) {
    body.comment_id = params.parentId
  } else if (params.figmaNodeId) {
    body.client_meta = {
      node_id: params.figmaNodeId,
      node_offset: { x: params.x ?? 0, y: params.y ?? 0 },
    }
  } else if (typeof params.x === 'number' && typeof params.y === 'number') {
    body.client_meta = { x: params.x, y: params.y }
  }
  const created = await figmaRequest(`/v1/files/${fileKey}/comments`, token, {
    method: 'POST',
    body,
    fetchImpl,
  })
  return {
    id: String(created.id ?? ''),
    message: String(created.message ?? message),
    createdAt: typeof created.created_at === 'string' ? created.created_at : new Date().toISOString(),
  }
}

/** Fetch paginated Figma version history (`GET /v1/files/:key/versions`). */
export async function fetchFigmaVersions(
  fileKey: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Array<Record<string, unknown>>> {
  if (!FILE_KEY_PATTERN.test(fileKey)) throw new Error('Invalid Figma fileKey')
  const versions = new Map<string, Record<string, unknown>>()
  let nextPath: string | null = `/v1/files/${fileKey}/versions`
  let pages = 0
  while (nextPath && pages < MAX_PAGES) {
    pages += 1
    const res = await figmaRequest(nextPath, token, { fetchImpl })
    const list = Array.isArray(res.versions) ? (res.versions as Array<Record<string, unknown>>) : []
    for (const v of list) {
      if (typeof v.id === 'string') versions.set(v.id, v)
    }
    const pagination = res.pagination && typeof res.pagination === 'object' ? (res.pagination as Record<string, unknown>) : {}
    const nextUrl = typeof pagination.next_page === 'string' && pagination.next_page ? pagination.next_page : null
    if (!nextUrl) break
    const parsed = new URL(nextUrl, API_ORIGIN)
    if (parsed.origin !== API_ORIGIN) break
    nextPath = `${parsed.pathname}${parsed.search}`
  }
  return [...versions.values()]
}

/**
 * Merge fetched Figma comments into `doc.comments` and `sidecar.remoteComments`,
 * avoiding reply echoes via `localCommentId` mapping and marking orphan comments safely.
 */
export function mergeFigmaCommentsIntoDoc(
  doc: Record<string, unknown>,
  sidecar: FigmaSyncSidecar,
  remoteItems: SyncedFigmaComment[],
): { doc: Record<string, unknown>; sidecar: FigmaSyncSidecar; imported: number; updated: number } {
  const nextDoc = structuredClone(doc)
  const nextSidecar = structuredClone(sidecar)
  const existingByRemoteId = new Map<string, SyncedFigmaComment>()
  for (const prev of nextSidecar.remoteComments?.items ?? []) existingByRemoteId.set(prev.id, prev)

  const docComments = (Array.isArray(nextDoc.comments) ? nextDoc.comments : (nextDoc.comments = [])) as Array<Record<string, unknown>>
  const firstPageId = Array.isArray(nextDoc.pages) && nextDoc.pages[0] && typeof (nextDoc.pages[0] as Record<string, unknown>).id === 'string'
    ? String((nextDoc.pages[0] as Record<string, unknown>).id)
    : 'page-1'

  let imported = 0
  let updated = 0
  const roots = remoteItems.filter((c) => !c.parentId)
  const repliesByParent = new Map<string, SyncedFigmaComment[]>()
  for (const c of remoteItems) {
    if (!c.parentId) continue
    const list = repliesByParent.get(c.parentId) ?? []
    list.push(c)
    repliesByParent.set(c.parentId, list)
  }

  const storedItems: SyncedFigmaComment[] = []
  for (const root of roots) {
    const prev = existingByRemoteId.get(root.id)
    const localId = prev?.localCommentId ?? newId('c')
    const existingLocal = docComments.find((c) => c.id === localId)
    const threadReplies = (repliesByParent.get(root.id) ?? []).map((r) => ({
      id: existingByRemoteId.get(r.id)?.localCommentId ?? newId('r'),
      author: 'user',
      figmaAuthor: r.author,
      body: r.message,
      createdAt: r.createdAt,
      figmaCommentId: r.id,
    }))

    if (!existingLocal) {
      docComments.push({
        id: localId,
        pageId: firstPageId,
        ...(root.canvasNodeId ? { nodeId: root.canvasNodeId } : {}),
        x: 0.5,
        y: 0.15,
        author: 'user',
        figmaAuthor: root.author,
        body: root.message,
        resolved: Boolean(root.resolvedAt),
        createdAt: root.createdAt,
        source: 'figma',
        figmaCommentId: root.id,
        ...(root.x !== undefined || root.y !== undefined ? { figmaOffset: { x: root.x ?? 0, y: root.y ?? 0 } } : {}),
        anchorState: root.anchorState,
        replies: threadReplies,
      })
      imported += 1
    } else {
      existingLocal.resolved = Boolean(root.resolvedAt)
      existingLocal.anchorState = root.anchorState
      const existingReplyIds = new Set(
        Array.isArray(existingLocal.replies)
          ? (existingLocal.replies as Array<Record<string, unknown>>).map((r) => String(r.figmaCommentId ?? ''))
          : [],
      )
      const replies = (Array.isArray(existingLocal.replies) ? existingLocal.replies : (existingLocal.replies = [])) as Array<Record<string, unknown>>
      for (const r of threadReplies) {
        if (!existingReplyIds.has(r.figmaCommentId)) {
          replies.push(r)
          updated += 1
        }
      }
    }

    storedItems.push({ ...root, localCommentId: localId })
    for (const r of repliesByParent.get(root.id) ?? []) {
      storedItems.push({ ...r, localCommentId: existingByRemoteId.get(r.id)?.localCommentId })
    }
  }

  nextSidecar.remoteComments = {
    syncedAt: new Date().toISOString(),
    items: storedItems,
  }
  return { doc: nextDoc, sidecar: nextSidecar, imported, updated }
}
