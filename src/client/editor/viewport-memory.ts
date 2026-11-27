type Viewport = { x: number; y: number; zoom: number }
type SavedView = Viewport & { pageId: string }
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>

function validView(value: unknown): value is SavedView {
  if (typeof value !== 'object' || !value) return false
  const entry = value as Partial<SavedView>
  return typeof entry.pageId === 'string' && Number.isFinite(entry.x) && Number.isFinite(entry.y) &&
    Number.isFinite(entry.zoom) && entry.zoom >= 0.02 && entry.zoom <= 32
}

/** Per-device view preferences. Only user navigation schedules a local write. */
export class ViewportMemory {
  private key = ''
  private current?: SavedView
  private byPage = new Map<string, Viewport>()
  private timer?: ReturnType<typeof setTimeout>

  constructor(private storage: () => StorageAccess = () => window.localStorage) {}

  open(identity: string[], pages: { id: string }[]): SavedView {
    const key = 'dsh-canvas:view:1:' + JSON.stringify(identity)
    if (key !== this.key) {
      this.flush()
      this.key = key
      this.current = undefined
      this.byPage.clear()
      try {
        const saved: unknown = JSON.parse(this.storage().getItem(key) ?? 'null')
        if (validView(saved)) {
          this.current = saved
          this.byPage.set(saved.pageId, { x: saved.x, y: saved.y, zoom: saved.zoom })
        }
      } catch { /* Storage can be unavailable in an embedded browser. */ }
    }
    if (!pages.some(page => page.id === this.current?.pageId)) {
      this.current = { pageId: pages[0].id, x: 40, y: 40, zoom: 1 }
    }
    if (!this.byPage.has(this.current.pageId)) {
      this.byPage.set(this.current.pageId, { x: this.current.x, y: this.current.y, zoom: this.current.zoom })
    }
    return this.current
  }

  getPageViewport(pageId: string): Viewport | null {
    const saved = this.byPage.get(pageId)
    return saved ? { ...saved } : null
  }

  observe(pageId: string, viewport: Viewport) {
    const previous = this.current
    if (!previous || !pageId || (previous.pageId === pageId && previous.x === viewport.x &&
      previous.y === viewport.y && previous.zoom === viewport.zoom)) return
    const next = { pageId, ...viewport }
    if (!validView(next)) return
    this.current = next
    this.byPage.set(pageId, { x: viewport.x, y: viewport.y, zoom: viewport.zoom })
    // Coalesce pan/zoom events and checkpoint during a long gesture.
    this.timer ??= setTimeout(this.flush, 200)
  }

  flush = () => {
    if (this.timer === undefined) return
    clearTimeout(this.timer)
    this.timer = undefined
    try { this.storage().setItem(this.key, JSON.stringify(this.current)) } catch { /* best effort */ }
  }
}
