/**
 * Unified Figma IR (`dsh.figma.ir@1`) conversion, color math, and canonical fingerprinting.
 * Pure functions — safe in Host, Client, and Figma Plugin contexts.
 */

import { newId } from '../format.js'
import { buildScene } from '../scene/resolve.js'
import { layoutScene } from '../scene/layout.js'
import {
  FIGMA_IR_FORMAT,
  FIGMA_IR_VERSION,
  FIGMA_SYNC_FORMAT,
  FIGMA_SYNC_VERSION,
  type FigmaIrDocument,
  type FigmaIrEffect,
  type FigmaIrFill,
  type FigmaIrFont,
  type FigmaIrLayout,
  type FigmaIrNode,
  type FigmaIrPage,
  type FigmaIrStroke,
  type FigmaRgba,
  type FigmaSyncSidecar,
  type SyncedNodeBase,
} from './sync-types.js'

const HEX_3 = /^#([0-9a-f]{3})$/i
const HEX_4 = /^#([0-9a-f]{4})$/i
const HEX_6 = /^#([0-9a-f]{6})$/i
const HEX_8 = /^#([0-9a-f]{8})$/i

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(0, Math.min(1, value))
}

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0
  const rounded = Math.round(value * 100) / 100
  return Object.is(rounded, -0) ? 0 : rounded
}

/**
 * Convert #RGB / #RGBA / #RRGGBB / #RRGGBBAA + optional extra opacity into Figma 0..1 RGBA.
 * Properly multiplies embedded hex alpha with fill opacity (fixing legacy 8-digit hex bugs).
 */
export function hexToFigmaRgba(hex: string, extraOpacity = 1): FigmaRgba {
  const input = String(hex ?? '#000000').trim()
  let r = 0
  let g = 0
  let b = 0
  let a = 1
  let m: RegExpExecArray | null
  if ((m = HEX_6.exec(input))) {
    const v = m[1]
    r = parseInt(v.slice(0, 2), 16) / 255
    g = parseInt(v.slice(2, 4), 16) / 255
    b = parseInt(v.slice(4, 6), 16) / 255
  } else if ((m = HEX_8.exec(input))) {
    const v = m[1]
    r = parseInt(v.slice(0, 2), 16) / 255
    g = parseInt(v.slice(2, 4), 16) / 255
    b = parseInt(v.slice(4, 6), 16) / 255
    a = parseInt(v.slice(6, 8), 16) / 255
  } else if ((m = HEX_3.exec(input))) {
    const v = m[1]
    r = parseInt(v[0] + v[0], 16) / 255
    g = parseInt(v[1] + v[1], 16) / 255
    b = parseInt(v[2] + v[2], 16) / 255
  } else if ((m = HEX_4.exec(input))) {
    const v = m[1]
    r = parseInt(v[0] + v[0], 16) / 255
    g = parseInt(v[1] + v[1], 16) / 255
    b = parseInt(v[2] + v[2], 16) / 255
    a = parseInt(v[3] + v[3], 16) / 255
  }
  return { r, g, b, a: clamp01(a * clamp01(extraOpacity)) }
}

/**
 * Convert Figma 0..1 RGBA + optional paint opacity into canonical #RRGGBB and opacity.
 */
export function figmaRgbaToHex(
  rgba: { r?: number; g?: number; b?: number; a?: number } | undefined,
  paintOpacity = 1,
): { color: string; opacity: number } {
  const r = Math.round(clamp01(rgba?.r ?? 0) * 255)
  const g = Math.round(clamp01(rgba?.g ?? 0) * 255)
  const b = Math.round(clamp01(rgba?.b ?? 0) * 255)
  const a = clamp01((rgba?.a ?? 1) * clamp01(paintOpacity))
  const hex = '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
  return { color: hex, opacity: round2(a) }
}

/** Canonicalize #RRGGBBAA into { color: '#rrggbb', opacity } for lossless IR equality. */
export function splitHexColor(color: string, opacity = 1): { color: string; opacity: number } {
  const rgba = hexToFigmaRgba(color, opacity)
  return figmaRgbaToHex({ r: rgba.r, g: rgba.g, b: rgba.b, a: 1 }, rgba.a)
}

function normalizeIrFills(fills: unknown): FigmaIrFill[] | undefined {
  if (!Array.isArray(fills) || fills.length === 0) return undefined
  const out: FigmaIrFill[] = []
  for (const raw of fills) {
    if (!raw || typeof raw !== 'object') continue
    const f = raw as Record<string, unknown>
    if (f.type === 'solid' && typeof f.color === 'string') {
      const split = splitHexColor(f.color, typeof f.opacity === 'number' ? f.opacity : 1)
      out.push(split.opacity < 1 ? { type: 'solid', color: split.color, opacity: split.opacity } : { type: 'solid', color: split.color })
    } else if ((f.type === 'linear-gradient' || f.type === 'radial-gradient') && Array.isArray(f.stops)) {
      const stops = f.stops
        .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
        .map((s) => {
          const split = splitHexColor(String(s.color ?? '#000000'), typeof s.opacity === 'number' ? s.opacity : 1)
          return {
            position: round2(typeof s.position === 'number' ? s.position : typeof s.offset === 'number' ? s.offset : 0),
            color: split.color,
            ...(split.opacity < 1 ? { opacity: split.opacity } : {}),
          }
        })
      if (stops.length >= 2) {
        out.push({
          type: f.type,
          ...(typeof f.angle === 'number' ? { angle: round2(f.angle) } : {}),
          stops,
          ...(typeof f.opacity === 'number' && f.opacity < 1 ? { opacity: round2(clamp01(f.opacity)) } : {}),
        })
      }
    } else if (f.type === 'image') {
      const mode = f.scaleMode === 'fit' || f.scaleMode === 'stretch' || f.scaleMode === 'tile' ? f.scaleMode : 'fill'
      out.push({
        type: 'image',
        ...(typeof f.asset === 'string' ? { asset: f.asset } : {}),
        ...(typeof f.imageHash === 'string' ? { imageHash: f.imageHash } : {}),
        scaleMode: mode,
        ...(typeof f.opacity === 'number' && f.opacity < 1 ? { opacity: round2(clamp01(f.opacity)) } : {}),
      })
    }
  }
  return out.length ? out : undefined
}

function normalizeIrStrokes(strokes: unknown): FigmaIrStroke[] | undefined {
  if (!Array.isArray(strokes) || strokes.length === 0) return undefined
  const out: FigmaIrStroke[] = []
  for (const raw of strokes) {
    if (!raw || typeof raw !== 'object') continue
    const s = raw as Record<string, unknown>
    if (typeof s.color !== 'string') continue
    const split = splitHexColor(s.color, typeof s.opacity === 'number' ? s.opacity : 1)
    out.push({
      color: split.color,
      width: round2(typeof s.width === 'number' ? Math.max(0, s.width) : 1),
      ...(split.opacity < 1 ? { opacity: split.opacity } : {}),
      ...(s.align === 'inside' || s.align === 'center' || s.align === 'outside' ? { align: s.align } : {}),
      ...(Array.isArray(s.dash) && s.dash.length ? { dash: s.dash.map((n) => round2(Number(n) || 0)) } : {}),
    })
  }
  return out.length ? out : undefined
}

function normalizeIrEffects(effects: unknown): FigmaIrEffect[] | undefined {
  if (!Array.isArray(effects) || effects.length === 0) return undefined
  const out: FigmaIrEffect[] = []
  for (const raw of effects) {
    if (!raw || typeof raw !== 'object') continue
    const e = raw as Record<string, unknown>
    if (e.type === 'blur' || e.type === 'layer-blur') {
      const blur = typeof e.blur === 'number' ? e.blur : typeof e.radius === 'number' ? e.radius : 0
      out.push({ type: 'blur', blur: round2(Math.max(0, blur)) })
    } else if (e.type === 'drop-shadow' || e.type === 'inner-shadow') {
      const split = splitHexColor(typeof e.color === 'string' ? e.color : '#000000', typeof e.opacity === 'number' ? e.opacity : 0.25)
      const blur = typeof e.blur === 'number' ? e.blur : typeof e.radius === 'number' ? e.radius : 4
      out.push({
        type: e.type,
        color: split.color,
        opacity: split.opacity,
        x: round2(typeof e.x === 'number' ? e.x : 0),
        y: round2(typeof e.y === 'number' ? e.y : 2),
        blur: round2(Math.max(0, blur)),
        ...(typeof e.spread === 'number' && e.spread !== 0 ? { spread: round2(e.spread) } : {}),
      })
    }
  }
  return out.length ? out : undefined
}

function normalizeIrLayout(layout: unknown): FigmaIrLayout | undefined {
  if (!layout || typeof layout !== 'object') return undefined
  const l = layout as Record<string, unknown>
  const direction = l.direction === 'horizontal' ? 'horizontal' : l.direction === 'vertical' ? 'vertical' : null
  if (!direction) return undefined
  const p = l.padding && typeof l.padding === 'object' ? (l.padding as Record<string, unknown>) : {}
  return {
    direction,
    gap: round2(typeof l.gap === 'number' ? Math.max(0, l.gap) : 0),
    padding: {
      top: round2(typeof p.top === 'number' ? Math.max(0, p.top) : 0),
      right: round2(typeof p.right === 'number' ? Math.max(0, p.right) : 0),
      bottom: round2(typeof p.bottom === 'number' ? Math.max(0, p.bottom) : 0),
      left: round2(typeof p.left === 'number' ? Math.max(0, p.left) : 0),
    },
    ...(l.alignPrimary === 'start' || l.alignPrimary === 'center' || l.alignPrimary === 'end' || l.alignPrimary === 'space-between'
      ? { alignPrimary: l.alignPrimary }
      : {}),
    ...(l.alignCounter === 'start' || l.alignCounter === 'center' || l.alignCounter === 'end' || l.alignCounter === 'stretch'
      ? { alignCounter: l.alignCounter }
      : {}),
    ...(l.wrap === true ? { wrap: true } : {}),
  }
}

function normalizeIrFont(font: unknown): FigmaIrFont | undefined {
  if (!font || typeof font !== 'object') return undefined
  const f = font as Record<string, unknown>
  return {
    family: typeof f.family === 'string' && f.family.trim() ? f.family.trim() : 'Inter',
    weight: typeof f.weight === 'number' && Number.isFinite(f.weight) ? Math.round(f.weight) : 400,
    ...(f.style === 'italic' ? { style: 'italic' } : {}),
    size: round2(typeof f.size === 'number' && f.size > 0 ? f.size : 14),
    lineHeight: round2(typeof f.lineHeight === 'number' && f.lineHeight > 0 ? f.lineHeight : 1.4),
    ...(typeof f.letterSpacing === 'number' && f.letterSpacing !== 0 ? { letterSpacing: round2(f.letterSpacing) } : {}),
  }
}

function normalizeCornerRadii(radii: unknown): [number, number, number, number] | undefined {
  if (!Array.isArray(radii) || radii.length !== 4) return undefined
  const nums = radii.map((v) => round2(Math.max(0, Number(v) || 0)))
  return [nums[0], nums[1], nums[2], nums[3]]
}

/** Deterministic, dependency-free FNV-1a 64-bit hex fingerprint for node snapshots. */
export function stableHash(value: unknown): string {
  const json = canonicalStringify(value)
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < json.length; i++) {
    const ch = json.charCodeAt(i)
    h1 ^= ch
    h1 = Math.imul(h1, 0x01000193)
    h2 ^= ch ^ (i & 0xff)
    h2 = Math.imul(h2, 0x85ebca6b)
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')
}

export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(canonicalStringify).join(',') + ']'
  const keys = Object.keys(value as Record<string, unknown>).sort()
  const parts: string[] = []
  for (const key of keys) {
    const v = (value as Record<string, unknown>)[key]
    if (v === undefined) continue
    parts.push(`${JSON.stringify(key)}:${canonicalStringify(v)}`)
  }
  return '{' + parts.join(',') + '}'
}

/** Extract canonical comparable snapshot for 3-way diffing and fingerprinting. */
export function extractNodeSnapshot(node: FigmaIrNode, parentId: string | null): SyncedNodeBase {
  const radii = normalizeCornerRadii(node.cornerRadii)
  const baseObj = {
    type: node.type,
    name: node.name,
    parentId,
    x: round2(node.x),
    y: round2(node.y),
    width: round2(Math.max(0, node.width)),
    height: round2(Math.max(0, node.height)),
    rotation: round2(node.rotation ?? 0),
    opacity: round2(clamp01(node.opacity ?? 1)),
    visible: node.visible !== false,
    cornerRadius: round2(Math.max(0, node.cornerRadius ?? (radii ? radii[0] : 0))),
    ...(radii ? { cornerRadii: radii } : {}),
    ...(node.type === 'frame' ? { clip: node.clip !== false } : {}),
    ...(normalizeIrFills(node.fills) ? { fills: normalizeIrFills(node.fills) } : {}),
    ...(normalizeIrStrokes(node.strokes) ? { strokes: normalizeIrStrokes(node.strokes) } : {}),
    ...(normalizeIrEffects(node.effects) ? { effects: normalizeIrEffects(node.effects) } : {}),
    ...(normalizeIrLayout(node.layout) ? { layout: normalizeIrLayout(node.layout) } : {}),
    ...(node.layoutSizing ? { layoutSizing: { ...(node.layoutSizing.h ? { h: node.layoutSizing.h } : {}), ...(node.layoutSizing.v ? { v: node.layoutSizing.v } : {}) } } : {}),
    ...(node.layoutPositioning === 'absolute' ? { layoutPositioning: 'absolute' as const } : {}),
    ...(node.type === 'text' ? { text: String(node.text ?? '') } : {}),
    ...(node.type === 'text' && normalizeIrFont(node.font) ? { font: normalizeIrFont(node.font) } : {}),
    ...(node.type === 'text' && node.align ? { align: node.align } : {}),
    ...(node.type === 'text' && node.verticalAlign ? { verticalAlign: node.verticalAlign } : {}),
    ...(node.type === 'path' && typeof node.d === 'string' ? { d: node.d } : {}),
    ...(node.type === 'path' && node.fillRule ? { fillRule: node.fillRule } : {}),
  }
  return {
    ...baseObj,
    fingerprint: stableHash(baseObj),
  }
}

/** Convert a `dsh.canvas@1` node into a `dsh.figma.ir@1` node, using computed layout geometry when provided. */
export function dshNodeToIrNode(
  node: Record<string, unknown>,
  options: {
    figmaNodeIds?: Readonly<Record<string, string>>
    passthroughByDshId?: Readonly<Record<string, Record<string, unknown>>>
    computedById?: ReadonlyMap<string, { x: number; y: number; width: number; height: number }>
  } = {},
): FigmaIrNode {
  const id = typeof node.id === 'string' ? node.id : newId('n')
  const computed = options.computedById?.get(id)
  const type = isSupportedNodeType(node.type) ? node.type : 'frame'
  const radii = normalizeCornerRadii(node.cornerRadii)
  const children = Array.isArray(node.children)
    ? node.children
        .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object'))
        .map((c) => dshNodeToIrNode(c, options))
    : undefined

  const ir: FigmaIrNode = {
    dshId: id,
    ...(options.figmaNodeIds?.[id] ? { figmaId: options.figmaNodeIds[id] } : {}),
    type,
    name: typeof node.name === 'string' ? node.name : type,
    x: round2(computed ? computed.x : Number(node.x ?? 0)),
    y: round2(computed ? computed.y : Number(node.y ?? 0)),
    width: round2(Math.max(0, computed ? computed.width : Number(node.width ?? 0))),
    height: round2(Math.max(0, computed ? computed.height : Number(node.height ?? 0))),
    ...(typeof node.rotation === 'number' && node.rotation !== 0 ? { rotation: round2(node.rotation) } : {}),
    ...(typeof node.opacity === 'number' && node.opacity < 1 ? { opacity: round2(clamp01(node.opacity)) } : {}),
    ...(node.visible === false ? { visible: false } : {}),
    ...(node.locked === true ? { locked: true } : {}),
    ...(type === 'frame' && node.clip === false ? { clip: false } : {}),
    ...(typeof node.cornerRadius === 'number' && node.cornerRadius > 0 ? { cornerRadius: round2(node.cornerRadius) } : {}),
    ...(radii ? { cornerRadii: radii } : {}),
    ...(normalizeIrFills(node.fills) ? { fills: normalizeIrFills(node.fills) } : {}),
    ...(normalizeIrStrokes(node.strokes) ? { strokes: normalizeIrStrokes(node.strokes) } : {}),
    ...(normalizeIrEffects(node.effects) ? { effects: normalizeIrEffects(node.effects) } : {}),
    ...(normalizeIrLayout(node.layout) ? { layout: normalizeIrLayout(node.layout) } : {}),
    ...(node.layoutSizing && typeof node.layoutSizing === 'object' ? { layoutSizing: node.layoutSizing as FigmaIrNode['layoutSizing'] } : {}),
    ...(node.layoutPositioning === 'absolute' ? { layoutPositioning: 'absolute' } : {}),
    ...(type === 'text' ? { text: typeof node.text === 'string' ? node.text : '' } : {}),
    ...(type === 'text' && normalizeIrFont(node.font) ? { font: normalizeIrFont(node.font) } : {}),
    ...(type === 'text' && typeof node.align === 'string' ? { align: node.align as FigmaIrNode['align'] } : {}),
    ...(type === 'text' && typeof node.verticalAlign === 'string' ? { verticalAlign: node.verticalAlign as FigmaIrNode['verticalAlign'] } : {}),
    ...(type === 'text' && node.autoHeight === false ? { autoHeight: false } : {}),
    ...(type === 'path' && typeof node.d === 'string' ? { d: node.d } : {}),
    ...(type === 'path' && node.viewBox && typeof node.viewBox === 'object' ? { viewBox: node.viewBox as FigmaIrNode['viewBox'] } : {}),
    ...(type === 'path' && (node.fillRule === 'evenodd' || node.fillRule === 'nonzero') ? { fillRule: node.fillRule } : {}),
    ...(type === 'instance' && typeof node.componentId === 'string' ? { componentId: node.componentId } : {}),
    ...(children && children.length > 0 ? { children } : {}),
    ...(options.passthroughByDshId?.[id] ? { passthrough: options.passthroughByDshId[id] } : {}),
  }
  return ir
}

/**
 * Convert an entire `dsh.canvas@1` document to `dsh.figma.ir@1`.
 * Runs headless `buildScene + layoutScene` per page so auto-layout children carry exact coordinates.
 */
export function dshDocToIr(
  doc: Record<string, unknown>,
  sidecar?: FigmaSyncSidecar | null,
): FigmaIrDocument {
  const pagesRaw = Array.isArray(doc.pages) ? (doc.pages as Array<Record<string, unknown>>) : []
  const pages: FigmaIrPage[] = pagesRaw.map((page) => {
    const pageId = typeof page.id === 'string' ? page.id : newId('page')
    const computedById = new Map<string, { x: number; y: number; width: number; height: number }>()
    try {
      const scene = buildScene(doc, { pageId })
      layoutScene(scene)
      const visitScene = (rnode: Record<string, unknown>) => {
        if (typeof rnode.id === 'string' && rnode.editable !== false) {
          computedById.set(rnode.id, {
            x: Number(rnode.x ?? 0),
            y: Number(rnode.y ?? 0),
            width: Number(rnode.width ?? 0),
            height: Number(rnode.height ?? 0),
          })
        }
        if (Array.isArray(rnode.children)) {
          for (const c of rnode.children) visitScene(c as Record<string, unknown>)
        }
      }
      for (const root of scene.roots ?? []) visitScene(root)
    } catch {
      // Fallback to raw document coordinates if layout cannot run.
    }
    const children = Array.isArray(page.children)
      ? (page.children as Array<Record<string, unknown>>).map((child) =>
          dshNodeToIrNode(child, {
            figmaNodeIds: sidecar?.binding.nodes,
            passthroughByDshId: sidecar?.passthrough,
            computedById,
          }),
        )
      : []
    return {
      dshId: pageId,
      ...(sidecar?.binding.pages[pageId] ? { figmaId: sidecar.binding.pages[pageId] } : {}),
      name: typeof page.name === 'string' ? page.name : 'Page 1',
      ...(typeof page.background === 'string' ? { background: page.background } : {}),
      children,
    }
  })

  return {
    format: FIGMA_IR_FORMAT,
    version: FIGMA_IR_VERSION,
    ...(sidecar?.binding.fileKey ? { fileKey: sidecar.binding.fileKey } : {}),
    ...(typeof doc.title === 'string' ? { fileName: doc.title } : {}),
    readCompleteness: 'complete',
    pages,
  }
}

/** Convert an IR node into a valid `dsh.canvas@1` node, collecting ID mappings and passthrough props. */
export function irNodeToDshNode(
  ir: FigmaIrNode,
  collector?: {
    nodeBindings: Record<string, string>
    passthrough: Record<string, Record<string, unknown>>
    imageHashes: Record<string, string>
    usedIds: Set<string>
  },
): Record<string, unknown> {
  let id = ir.dshId && /^[A-Za-z0-9_-]{1,64}$/.test(ir.dshId) ? ir.dshId : newId(ir.type.slice(0, 2))
  if (collector) {
    while (collector.usedIds.has(id)) id = newId(ir.type.slice(0, 2))
    collector.usedIds.add(id)
    if (ir.figmaId) collector.nodeBindings[id] = ir.figmaId
    if (ir.passthrough && Object.keys(ir.passthrough).length > 0) {
      collector.passthrough[id] = structuredClone(ir.passthrough)
    }
  }

  const fills: Array<Record<string, unknown>> = (ir.fills ?? []).flatMap((fill): Array<Record<string, unknown>> => {
    if (fill.type === 'solid') {
      return [{ type: 'solid', color: fill.color, ...(fill.opacity !== undefined && fill.opacity < 1 ? { opacity: fill.opacity } : {}) }]
    }
    if (fill.type === 'linear-gradient' || fill.type === 'radial-gradient') {
      return [{
        type: fill.type,
        ...(fill.angle !== undefined ? { angle: fill.angle } : {}),
        stops: fill.stops.map((s) => ({ position: s.position, color: s.color, ...(s.opacity !== undefined && s.opacity < 1 ? { opacity: s.opacity } : {}) })),
        ...(fill.opacity !== undefined && fill.opacity < 1 ? { opacity: fill.opacity } : {}),
      }]
    }
    if (fill.type === 'image') {
      const asset = fill.asset ?? (fill.imageHash ? collector?.imageHashes[fill.imageHash] : undefined)
      if (!asset) return []
      if (fill.imageHash && collector) collector.imageHashes[fill.imageHash] = asset
      return [{
        type: 'image',
        asset,
        scaleMode: fill.scaleMode ?? 'fill',
        ...(fill.opacity !== undefined && fill.opacity < 1 ? { opacity: fill.opacity } : {}),
      }]
    }
    return []
  })

  const strokes = (ir.strokes ?? []).map((s) => ({
    color: s.color,
    width: s.width,
    ...(s.opacity !== undefined && s.opacity < 1 ? { opacity: s.opacity } : {}),
    ...(s.align ? { align: s.align } : {}),
    ...(s.dash ? { dash: s.dash } : {}),
  }))

  const effects = (ir.effects ?? []).map((e) =>
    e.type === 'blur'
      ? { type: 'blur', blur: e.blur }
      : {
          type: e.type,
          color: e.color ?? '#000000',
          x: e.x ?? 0,
          y: e.y ?? 2,
          blur: e.blur,
          ...(e.spread !== undefined ? { spread: e.spread } : {}),
          ...(e.opacity !== undefined ? { opacity: e.opacity } : {}),
        },
  )

  const node: Record<string, unknown> = {
    id,
    type: ir.type === 'instance' && !ir.componentId ? 'frame' : ir.type,
    name: ir.name || ir.type,
    x: round2(ir.x),
    y: round2(ir.y),
    width: round2(Math.max(0, ir.width)),
    height: round2(Math.max(0, ir.height)),
    ...(ir.rotation ? { rotation: round2(ir.rotation) } : {}),
    ...(ir.opacity !== undefined && ir.opacity < 1 ? { opacity: round2(clamp01(ir.opacity)) } : {}),
    ...(ir.visible === false ? { visible: false } : {}),
    ...(ir.locked === true ? { locked: true } : {}),
    ...(ir.layoutSizing ? { layoutSizing: ir.layoutSizing } : {}),
    ...(ir.layoutPositioning === 'absolute' ? { layoutPositioning: 'absolute' } : {}),
  }

  if (node.type === 'frame' || node.type === 'rect' || node.type === 'ellipse' || node.type === 'path') {
    if (fills.length) node.fills = fills
    if (strokes.length) node.strokes = strokes
    if (effects.length) node.effects = effects
    if (ir.cornerRadius && ir.cornerRadius > 0) node.cornerRadius = round2(ir.cornerRadius)
    if (ir.cornerRadii) node.cornerRadii = ir.cornerRadii
  }
  if (node.type === 'frame') {
    node.clip = ir.clip !== false
    if (ir.layout) node.layout = ir.layout
    node.children = (ir.children ?? []).map((child) => irNodeToDshNode(child, collector))
  } else if (node.type === 'group') {
    node.children = (ir.children ?? []).map((child) => irNodeToDshNode(child, collector))
  } else if (node.type === 'line') {
    node.strokes = strokes.length ? strokes : [{ color: '#111827', width: 1 }]
  } else if (node.type === 'text') {
    node.text = ir.text ?? ''
    node.font = ir.font ?? { family: 'Inter', weight: 400, size: 14, lineHeight: 1.4 }
    node.fills = fills.length ? fills : [{ type: 'solid', color: '#111827' }]
    if (ir.align) node.align = ir.align
    if (ir.verticalAlign) node.verticalAlign = ir.verticalAlign
    node.autoHeight = ir.autoHeight !== false
    if (effects.length) node.effects = effects
  } else if (node.type === 'path') {
    node.d = ir.d || 'M 0 0 L 1 0'
    node.viewBox = ir.viewBox ?? { x: 0, y: 0, width: Math.max(1, ir.width), height: Math.max(1, ir.height) }
    node.fillRule = ir.fillRule ?? 'nonzero'
    // Path image fills are rejected by dsh.canvas@1 format rules.
    if (Array.isArray(node.fills)) {
      node.fills = (node.fills as Array<Record<string, unknown>>).filter((f) => f.type !== 'image')
    }
  } else if (node.type === 'instance' && ir.componentId) {
    node.componentId = ir.componentId
  }

  return node
}

/** Build a fresh `FigmaSyncSidecar` from a document + IR pair after cold import or initial binding. */
export function createInitialSidecar(params: {
  canvasName: string
  canvasDocId: string
  canvasRevision: string
  fileKey: string
  fileName?: string
  fileUrl?: string
  transport: FigmaSyncSidecar['binding']['transport']
  remoteIr: FigmaIrDocument
  pageBindings: Record<string, string>
  nodeBindings: Record<string, string>
  passthrough: Record<string, Record<string, unknown>>
  imageHashes?: Record<string, string>
  localIr?: FigmaIrDocument
}): FigmaSyncSidecar {
  const localNodes: Record<string, SyncedNodeBase> = {}
  const remoteProjectedNodes: Record<string, SyncedNodeBase> = {}
  const order: Record<string, string[]> = {}
  const figmaToDsh = new Map<string, string>()
  for (const [dshId, figmaId] of Object.entries(params.nodeBindings)) figmaToDsh.set(figmaId, dshId)

  const recordTree = (
    irDoc: FigmaIrDocument,
    target: Record<string, SyncedNodeBase>,
    recordOrder: boolean,
  ) => {
    for (const page of irDoc.pages) {
      const pageKey = page.dshId ?? (page.figmaId ? findKeyByVal(params.pageBindings, page.figmaId) : undefined) ?? 'page-1'
      const visitList = (nodes: FigmaIrNode[], parentId: string | null) => {
        const ids: string[] = []
        for (const n of nodes) {
          const id = n.dshId ?? (n.figmaId ? figmaToDsh.get(n.figmaId) : undefined)
          if (!id) continue
          ids.push(id)
          target[id] = extractNodeSnapshot(n, parentId)
          if (n.children?.length) visitList(n.children, id)
        }
        if (recordOrder) order[parentId ?? `page:${pageKey}`] = ids
      }
      visitList(page.children, null)
    }
  }

  recordTree(params.remoteIr, remoteProjectedNodes, true)
  recordTree(params.localIr ?? params.remoteIr, localNodes, false)

  return {
    format: FIGMA_SYNC_FORMAT,
    version: FIGMA_SYNC_VERSION,
    canvasName: params.canvasName,
    canvasDocId: params.canvasDocId,
    identities: {
      logicalPages: {},
      placements: {},
      interactions: {},
    },
    binding: {
      bindingId: newId('bind'),
      fileKey: params.fileKey,
      ...(params.fileName ? { fileName: params.fileName } : {}),
      ...(params.fileUrl ? { fileUrl: params.fileUrl } : {}),
      scope: { kind: 'document' },
      transport: params.transport,
      lastSyncedAt: new Date().toISOString(),
      lastCanvasRevision: params.canvasRevision,
      ...(params.remoteIr.remoteVersion ? { lastRemoteVersion: params.remoteIr.remoteVersion } : {}),
      pages: { ...params.pageBindings },
      nodes: { ...params.nodeBindings },
      styles: {},
      components: {},
      imageHashes: { ...(params.imageHashes ?? {}) },
    },
    base: {
      localNodes,
      remoteProjectedNodes,
      order,
    },
    passthrough: structuredClone(params.passthrough),
  }
}

function findKeyByVal(record: Record<string, string>, val: string): string | undefined {
  for (const [k, v] of Object.entries(record)) {
    if (v === val) return k
  }
  return undefined
}

function isSupportedNodeType(value: unknown): value is FigmaIrNode['type'] {
  return (
    value === 'frame' ||
    value === 'group' ||
    value === 'rect' ||
    value === 'ellipse' ||
    value === 'line' ||
    value === 'text' ||
    value === 'path' ||
    value === 'instance'
  )
}
