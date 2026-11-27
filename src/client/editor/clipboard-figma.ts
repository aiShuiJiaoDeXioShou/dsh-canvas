/**
 * Browser-side Figma clipboard integration:
 * - Intercepts Figma native HTML (`<!--(figma)...-->`) and SVG pastes, delegating Kiwi decoding
 *   and image asset persistence to `POST /dsh-canvas/api/figma/paste` (keeping Client zero-dependency).
 * - Writes lightweight SVG to system clipboard when copying Drafi nodes for instant paste into Figma.
 */

import { buildSvg } from './export-svg.js'
import { pasteFigmaClipboard } from '../api.js'

const FIGMA_MARKER = '<!--(figma)'

let lastCopiedDrafiSvg: string | null = null

function isEditableTarget(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false
  const el = target as { tagName?: string; isContentEditable?: boolean }
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(el.isContentEditable)
}

export function isSelfCopiedDrafiSvg(clipboardData: DataTransfer | null | undefined): boolean {
  if (!clipboardData || !lastCopiedDrafiSvg) return false
  const html = clipboardData.getData('text/html') || ''
  if (html.includes(FIGMA_MARKER)) return false
  const text = clipboardData.getData('text/plain') || ''
  return text === lastCopiedDrafiSvg
}

export function hasFigmaClipboardData(clipboardData: DataTransfer | null | undefined): boolean {
  if (!clipboardData) return false
  const html = clipboardData.getData('text/html') || ''
  if (html.includes(FIGMA_MARKER)) return true
  const text = clipboardData.getData('text/plain') || ''
  if (/<svg[\s>]/i.test(text)) return true
  return false
}

export async function handleFigmaPasteEvent(
  event: ClipboardEvent,
  store: any,
): Promise<boolean> {
  const activeEl = typeof document !== 'undefined' ? document.activeElement : null
  if (isEditableTarget(event.target) || isEditableTarget(activeEl)) {
    return false
  }
  const dt = event.clipboardData
  if (!hasFigmaClipboardData(dt)) return false
  event.preventDefault()

  const html = dt?.getData('text/html') || undefined
  const text = dt?.getData('text/plain') || undefined
  const existingIds = collectDocNodeIds(store.state.doc)

  try {
    const res = await pasteFigmaClipboard(store.sessionId, { html, text, existingIds })
    if (!Array.isArray(res.nodes) || res.nodes.length === 0) {
      store.toast('剪贴板中没有可导入的 Figma 图层', 'error')
      return true
    }
    const inserted = insertPastedFigmaNodes(store, res.nodes)
    if (inserted > 0) {
      const label = res.source === 'figma-kiwi' ? 'Figma 图层' : 'SVG 路径'
      const warn = res.warnings?.length ? `（${res.warnings.length} 条提示）` : ''
      store.toast(`已粘贴 ${inserted} 个${label}${warn}`)
    }
    return true
  } catch (error) {
    store.toast(`粘贴 Figma 内容失败：${error instanceof Error ? error.message : String(error)}`, 'error')
    return true
  }
}

function collectDocNodeIds(doc: any): string[] {
  const ids: string[] = []
  const visit = (nodes: any[]) => {
    for (const n of nodes ?? []) {
      if (typeof n?.id === 'string') ids.push(n.id)
      if (Array.isArray(n?.children)) visit(n.children)
    }
  }
  for (const page of doc?.pages ?? []) visit(page.children ?? [])
  for (const component of doc?.components ?? []) {
    if (component?.root) visit([component.root])
  }
  return ids
}

function insertPastedFigmaNodes(store: any, nodes: Array<Record<string, unknown>>): number {
  // Re-anchor top-level pasted nodes near the center of the current viewport,
  // using the active container so component editing mode inserts inside the component root.
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    const nx = Number(n.x ?? 0)
    const ny = Number(n.y ?? 0)
    const nw = Math.max(0, Number(n.width ?? 0))
    const nh = Math.max(0, Number(n.height ?? 0))
    minX = Math.min(minX, nx)
    minY = Math.min(minY, ny)
    maxX = Math.max(maxX, nx + nw)
    maxY = Math.max(maxY, ny + nh)
  }
  const groupW = Number.isFinite(maxX - minX) ? maxX - minX : 0
  const groupH = Number.isFinite(maxY - minY) ? maxY - minY : 0
  const vp = store.state.viewport ?? { x: 0, y: 0, zoom: 1 }
  const size = store.viewportSize?.() ?? { width: 800, height: 600 }
  const worldCenterX = (-vp.x + size.width / 2) / Math.max(0.05, vp.zoom)
  const worldCenterY = (-vp.y + size.height / 2) / Math.max(0.05, vp.zoom)

  let originX = 0
  let originY = 0
  if (store.state.componentMode) {
    const activeContainer = store.activeRootContainer?.(store.state.doc)
    const rootScene = activeContainer?.id ? store.findSceneNode?.(activeContainer.id) : null
    if (rootScene) {
      originX = Number(rootScene.absX ?? 0)
      originY = Number(rootScene.absY ?? 0)
    }
  }

  const anchorX = Math.round(worldCenterX - originX - (groupW > 0 ? groupW / 2 : 120))
  const anchorY = Math.round(worldCenterY - originY - (groupH > 0 ? groupH / 2 : 120))
  const dx = Number.isFinite(minX) ? anchorX - minX : 0
  const dy = Number.isFinite(minY) ? anchorY - minY : 0

  const insertedIds: string[] = []
  if (typeof store.mutate === 'function') {
    store.mutate((doc: any) => {
      const container =
        store.activeRootContainer?.(doc) ??
        doc.pages.find((entry: any) => entry.id === store.state.pageId) ??
        doc.pages[0]
      if (!container) return
      if (store.state.componentMode && container.type !== 'frame' && container.type !== 'group') {
        throw new Error('当前主组件根节点不支持粘贴子图层')
      }
      container.children = container.children ?? []
      for (const raw of nodes) {
        const node = structuredClone(raw)
        node.x = Math.round((Number(node.x ?? 0) + dx) * 100) / 100
        node.y = Math.round((Number(node.y ?? 0) + dy) * 100) / 100
        container.children.push(node)
        if (typeof node.id === 'string') insertedIds.push(node.id)
      }
    }, { select: insertedIds })
    return insertedIds.length
  }

  if (typeof store.addNode === 'function') {
    for (const raw of nodes) {
      const node = structuredClone(raw)
      node.x = Math.round((Number(node.x ?? 0) + dx) * 100) / 100
      node.y = Math.round((Number(node.y ?? 0) + dy) * 100) / 100
      const created = store.addNode(node, null)
      if (created?.id) insertedIds.push(created.id)
    }
    if (insertedIds.length) store.setSelection?.(insertedIds)
  }
  return insertedIds.length
}

/**
 * Best-effort write of the current selection as SVG to the system clipboard
 * so users can press ⌘C in Drafi and ⌘V directly into Figma without a plugin.
 */
export async function copySelectionSvgForFigma(store: any): Promise<boolean> {
  try {
    if (!store.state.scene || !store.state.selection?.length) return false
    const svg = await buildSvg(store.state.scene, {
      nodeKeys: store.state.selection,
    })
    if (!svg || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(svg)
    lastCopiedDrafiSvg = svg
    return true
  } catch {
    return false
  }
}
