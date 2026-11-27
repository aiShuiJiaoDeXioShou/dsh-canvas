/**
 * Cached miniature SVG preview builder & HTML5 drag-state bridge for TemplatesPanel.
 * Pure TypeScript (zero React / zero DOM dependency) so it runs identically in browser and Node tests.
 */

import { DEFAULT_DEVICE, getDevice } from '../../shared/foundation.js'
import { buildScene } from '../../shared/scene/resolve.js'
import { layoutScene } from '../../shared/scene/layout.js'
import { instantiateTemplate } from '../../shared/templates.js'

export const TEMPLATE_DRAG_MIME = 'application/x-dshc-template'
export const COMPONENT_DRAG_MIME = 'application/x-dshc-component'
export const STYLE_DRAG_MIME = 'application/x-dshc-style'

export type ActiveCanvasDrag =
  | {
      kind: 'template' | 'component'
      id: string
      name: string
      width: number
      height: number
    }
  | {
      kind: 'style'
      id: string
      name: string
      styleType: 'fill' | 'text' | 'effect'
      width?: number
      height?: number
    }

export interface ActiveTemplateDrag {
  templateId: string
  name: string
  width: number
  height: number
}

let activeCanvasDrag: ActiveCanvasDrag | null = null

export function setActiveCanvasDrag(info: ActiveCanvasDrag | null): void {
  if (!info) {
    activeCanvasDrag = null
    return
  }
  if (info.kind === 'style') {
    activeCanvasDrag = {
      ...info,
      width: info.width ?? 0,
      height: info.height ?? 0,
    }
    return
  }
  activeCanvasDrag = info
}

export function getActiveCanvasDrag(): ActiveCanvasDrag | null {
  return activeCanvasDrag
}

export function clearActiveCanvasDrag(): void {
  activeCanvasDrag = null
}

export function setActiveTemplateDrag(info: ActiveTemplateDrag | null): void {
  activeCanvasDrag = info
    ? { kind: 'template', id: info.templateId, name: info.name, width: info.width, height: info.height }
    : null
}

export function getActiveTemplateDrag(): ActiveTemplateDrag | null {
  if (!activeCanvasDrag || activeCanvasDrag.kind !== 'template') return null
  return {
    templateId: activeCanvasDrag.id,
    name: activeCanvasDrag.name,
    width: activeCanvasDrag.width,
    height: activeCanvasDrag.height,
  }
}

export function clearActiveTemplateDrag(): void {
  activeCanvasDrag = null
}

export interface TemplatePreview {
  templateId: string
  deviceId: string
  width: number
  height: number
  svg: string
  dataUri: string
}

const previewCache = new Map<string, TemplatePreview>()

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fillColor(fills: unknown): string {
  if (!Array.isArray(fills) || fills.length === 0) return 'none'
  const first = fills.find((f) => f && typeof f === 'object' && (f as Record<string, unknown>).type === 'solid') as
    | { color?: string; opacity?: number }
    | undefined
  if (!first?.color) return 'none'
  return first.color
}

function fillOpacity(fills: unknown): number {
  if (!Array.isArray(fills) || fills.length === 0) return 1
  const first = fills.find((f) => f && typeof f === 'object' && (f as Record<string, unknown>).type === 'solid') as
    | { opacity?: number }
    | undefined
  return typeof first?.opacity === 'number' ? first.opacity : 1
}

function renderPreviewNode(node: any, parentAbs: { x: number; y: number }, defs: string[], idPrefix: string): string {
  if (!node || node.visible === false) return ''
  const left = (Number(node.absX) || 0) - parentAbs.x
  const top = (Number(node.absY) || 0) - parentAbs.y
  const width = Math.max(0, Number(node.width) || 0)
  const height = Math.max(0, Number(node.height) || 0)
  const opacity = node.opacity == null ? 1 : Number(node.opacity)
  const radius = node.type === 'ellipse' ? Math.min(width, height) / 2 : Math.max(0, Number(node.cornerRadius) || 0)
  const transform = `translate(${left} ${top})`
  const parts: string[] = []

  if (node.type === 'group') {
    const kids = (node.children ?? [])
      .map((c: any, idx: number) => renderPreviewNode(c, { x: node.absX, y: node.absY }, defs, `${idPrefix}_${idx}`))
      .join('')
    return `<g transform="${transform}" opacity="${opacity}">${kids}</g>`
  }

  if (node.type === 'text') {
    const font = node.font ?? {}
    const size = Math.max(1, Number(font.size) || 14)
    const lineHeight = size * (Number(font.lineHeight) || 1.35)
    const lines = Array.isArray(node.lines) && node.lines.length ? node.lines : [{ text: String(node.text ?? '') }]
    const color = fillColor(node.fills)
    const anchor = node.align === 'center' ? 'middle' : node.align === 'right' ? 'end' : 'start'
    const tx = node.align === 'center' ? width / 2 : node.align === 'right' ? width : 0
    const contentHeight = lines.length * lineHeight
    const offset =
      node.verticalAlign === 'center'
        ? (height - contentHeight) / 2
        : node.verticalAlign === 'bottom'
          ? height - contentHeight
          : 0
    for (let i = 0; i < lines.length; i += 1) {
      parts.push(
        `<text x="${tx}" y="${offset + lineHeight * (i + 0.8)}" font-family="system-ui,-apple-system,sans-serif" font-size="${size}" font-weight="${Number(font.weight) || 400}" fill="${esc(color === 'none' ? '#111111' : color)}" text-anchor="${anchor}">${esc(lines[i].text ?? '')}</text>`,
      )
    }
    return `<g transform="${transform}" opacity="${opacity}">${parts.join('')}</g>`
  }

  if (node.type === 'line') {
    const stroke = node.strokes?.[0]
    parts.push(
      `<line x1="0" y1="0" x2="${width}" y2="0" stroke="${esc(stroke?.color ?? '#D1D5DB')}" stroke-width="${Math.max(1, Number(stroke?.width) || 1)}"/>`,
    )
    return `<g transform="${transform}" opacity="${opacity}">${parts.join('')}</g>`
  }

  if (node.type === 'path' && typeof node.d === 'string') {
    const color = fillColor(node.fills)
    const stroke = node.strokes?.[0]
    parts.push(
      `<path d="${esc(node.d)}" fill="${esc(color)}"${stroke ? ` stroke="${esc(stroke.color ?? '#111111')}" stroke-width="${Number(stroke.width) || 1}"` : ''}/>`,
    )
    return `<g transform="${transform}" opacity="${opacity}">${parts.join('')}</g>`
  }

  const bg = fillColor(node.fills)
  const bgOp = fillOpacity(node.fills)
  if (bg !== 'none') {
    if (node.type === 'ellipse') {
      parts.push(
        `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2}" ry="${height / 2}" fill="${esc(bg)}"${bgOp < 1 ? ` fill-opacity="${bgOp}"` : ''}/>`,
      )
    } else {
      parts.push(
        `<rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${esc(bg)}"${bgOp < 1 ? ` fill-opacity="${bgOp}"` : ''}/>`,
      )
    }
  }

  for (const stroke of node.strokes ?? []) {
    const sw = Number(stroke?.width) || 1
    if (node.type === 'ellipse') {
      parts.push(
        `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${Math.max(0, width / 2 - sw / 2)}" ry="${Math.max(0, height / 2 - sw / 2)}" fill="none" stroke="${esc(stroke.color ?? '#000000')}" stroke-width="${sw}"/>`,
      )
    } else {
      parts.push(
        `<rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="none" stroke="${esc(stroke.color ?? '#000000')}" stroke-width="${sw}"/>`,
      )
    }
  }

  if (Array.isArray(node.children) && node.children.length > 0) {
    let clipAttr = ''
    if (node.clip) {
      const clipId = `tp-${idPrefix}`
      defs.push(`<clipPath id="${clipId}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/></clipPath>`)
      clipAttr = ` clip-path="url(#${clipId})"`
    }
    const kids = node.children
      .map((c: any, idx: number) => renderPreviewNode(c, { x: node.absX, y: node.absY }, defs, `${idPrefix}_${idx}`))
      .join('')
    parts.push(`<g${clipAttr}>${kids}</g>`)
  }

  return `<g transform="${transform}" opacity="${opacity}">${parts.join('')}</g>`
}

/**
 * Return a cached miniature SVG preview for a built-in template at the given device size.
 */
export function getTemplatePreview(templateId: string, deviceId: string = DEFAULT_DEVICE): TemplatePreview {
  const device = getDevice(deviceId)
  const cacheKey = `${templateId}::${device.id}`
  const cached = previewCache.get(cacheKey)
  if (cached) return cached

  const { node } = instantiateTemplate(templateId, { device: device.id })
  const doc = {
    format: 'dsh.canvas',
    version: 1,
    id: `preview_${templateId}`,
    title: templateId,
    pages: [{ id: 'p1', name: 'Preview', background: null, children: [node] }],
    styles: [],
    components: [],
    variantSets: [],
    fonts: [],
    comments: [],
  }
  const scene = buildScene(doc, { pageId: 'p1' })
  layoutScene(scene)
  const root = scene.roots?.[0]
  const width = Math.max(1, Number(root?.width ?? node.width) || device.width)
  const height = Math.max(1, Number(root?.height ?? node.height) || 80)
  const defs: string[] = []
  const body = root ? renderPreviewNode(root, { x: root.absX ?? 0, y: root.absY ?? 0 }, defs, 'r') : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${body}</svg>`
  const preview: TemplatePreview = {
    templateId,
    deviceId: device.id,
    width,
    height,
    svg,
    dataUri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  }
  previewCache.set(cacheKey, preview)
  return preview
}

export interface ComponentPreview {
  componentId: string
  width: number
  height: number
  svg: string
  dataUri: string
}

const componentPreviewCache = new WeakMap<object, ComponentPreview>()

/**
 * Return a cached miniature SVG preview for a document component (cached by `component.root` identity).
 */
export function getComponentPreview(
  doc: Record<string, unknown>,
  component: { id: string; name?: string; root?: Record<string, unknown> },
): ComponentPreview {
  const rootObj = component.root && typeof component.root === 'object' ? component.root : null
  if (rootObj) {
    const cached = componentPreviewCache.get(rootObj)
    if (cached && cached.componentId === component.id) return cached
  }

  let width = Math.max(1, Number(rootObj?.width) || 120)
  let height = Math.max(1, Number(rootObj?.height) || 40)
  const defs: string[] = []
  let body = ''
  try {
    const scene = buildScene(doc, { mode: 'component', componentId: component.id })
    layoutScene(scene)
    const root = scene.roots?.[0]
    if (root) {
      width = Math.max(1, Number(root.width) || width)
      height = Math.max(1, Number(root.height) || height)
      body = renderPreviewNode(root, { x: root.absX ?? 0, y: root.absY ?? 0 }, defs, 'c')
    }
  } catch {
    body = `<rect width="${width}" height="${height}" rx="4" fill="#E5E7EB"/>`
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${body}</svg>`
  const preview: ComponentPreview = {
    componentId: component.id,
    width,
    height,
    svg,
    dataUri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  }
  if (rootObj) componentPreviewCache.set(rootObj, preview)
  return preview
}
