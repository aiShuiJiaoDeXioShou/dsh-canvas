import { rectOf, unionRects } from './geometry.js'

export interface InteractionLocation {
  id: string
  pageId: string
}

interface SceneNode {
  key: string
  absX: number
  absY: number
  width: number
  height: number
  rotation: number
}

interface NavigationStore {
  state: {
    pageId: string
  }
  findSceneNode(id: string): SceneNode | null
  set(patch: { pageId: string }, emit: boolean): void
  emit(): void
  viewportSize?(): { width: number; height: number }
  rebuild(): void
  zoomToRect(rect: { x: number; y: number; width: number; height: number }, padding: number): void
}

export function revealInteractionNode(store: NavigationStore, location: InteractionLocation, contextIds: string[] = []): boolean {
  const changedPage = store.state.pageId !== location.pageId
  if (changedPage) {
    const previous = store.state.pageId
    store.set({ pageId: location.pageId }, false)
    store.rebuild()
    if (!store.findSceneNode(location.id)) {
      store.set({ pageId: previous }, false)
      store.rebuild()
      store.emit()
      return false
    }
  }
  const node = store.findSceneNode(location.id)
  if (!node) return false
  let rect = rectOf(node)
  const view = store.viewportSize?.()
  if (view && contextIds.length) {
    const context = contextIds.map(id => store.findSceneNode(id)).filter(Boolean)
    const bounds = unionRects([rect, ...context.map(rectOf)])
    const zoom = Math.min((view.width - 76) / Math.max(1, bounds.width), (view.height - 76) / Math.max(1, bounds.height))
    if (rect.height * zoom >= Math.min(180, (view.height - 76) / 2)) rect = bounds
  }
  store.zoomToRect(rect, 38)
  if (changedPage) store.emit()
  return true
}

