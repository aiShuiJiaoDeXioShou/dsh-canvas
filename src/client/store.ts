// @ts-nocheck
/**
 * Canvas store: the single mutable source of truth for one canvas tab.
 * React subscribes to a version counter; edits mutate the document in place
 * (cheap pointer-move updates), history snapshots whole documents on commit.
 */

import {
  emptyDoc,
  findPage,
  normalizeDoc,
  newId,
} from '../shared/format.js'
import { addComment as addCommentOp, replyComment, resolveComment, removeComment, cloneTree } from '../shared/ops.js'
import { buildScene } from './editor/resolve.js'
import { layoutScene } from './editor/layout.js'
import { createTextMeasurer } from './editor/text-measure.js'
import { History } from './editor/history.js'
import { formatCanvasLink } from './editor/canvas-link.js'
import { announceCanvasSelection } from './selection-bridge.js'
import { instantiateTemplate } from '../shared/templates.js'
import { importSvgPaths } from '../shared/path/svg-import.js'
import { DEFAULT_DEVICE, DEFAULT_PRESET, getDevice, getPreset } from '../shared/foundation.js'
import { designSystemStyles, getDesignSystem } from '../shared/design-system.js'
import {
  centerOf,
  clamp,
  sceneBounds,
  screenPoint,
  unionRects,
  worldPoint,
} from './editor/geometry.js'
import {
  ApiError,
  assetUrl,
  fontUrl,
  auditCanvas,
  deleteCanvasDoc,
  generateCanvasImage,
  imageCapabilities,
  loadState,
  fetchPack,
  importPack,
  openEvents,
  postSelection,
  postSnapshot,
  renameCanvasDoc,
  saveDoc,
  uploadFont,
  uploadImage,
} from './api.js'

const DEFAULT_DOC = 'main'

function clone(value) {
  return structuredClone(value)
}

function deepFind(nodes, id) {
  for (const node of nodes ?? []) {
    if (node.id === id) return node
    const found = deepFind(node.children, id)
    if (found) return found
  }
  return null
}

function parentOfNode(nodes, id, parent = null) {
  for (const node of nodes ?? []) {
    if (node.id === id) return parent
    const found = parentOfNode(node.children, id, node)
    if (found !== undefined) return found
  }
  return undefined
}

function removeFromTree(nodes, id) {
  const index = nodes.findIndex((node) => node.id === id)
  if (index !== -1) return nodes.splice(index, 1)[0]
  for (const node of nodes) {
    const removed = removeFromTree(node.children ?? [], id)
    if (removed) return removed
  }
  return null
}

/** Unique string keys for duplicated subtrees; overrides are remapped too. */
function reidTree(node, mapper) {
  const copy = clone(node)
  const walk = (current) => {
    const next = mapper(current.id)
    current.id = next
    if (Array.isArray(current.children)) current.children.forEach(walk)
  }
  walk(copy)
  if (copy.type === 'instance' && copy.overrides) {
    const remapped = {}
    for (const [key, value] of Object.entries(copy.overrides)) remapped[mapper(key)] = value
    copy.overrides = remapped
  }
  return copy
}

class CanvasStore {
  constructor({ sessionId, inputActions, onToast }) {
    this.sessionId = sessionId
    this.inputActions = inputActions
    this.onToast = onToast ?? (() => {})
    this.listeners = new Set()
    this.version = 0
    this.measure = createTextMeasurer()
    this.history = new History(100)
    this.saveTimer = null
    this.selectionTimer = null
    this.eventsAbort = null
    this.pollTimer = null
    this.mounted = false
    this.loadingAbort = null
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve
    })
    this.fontAssets = new Map()
    this.state = {
      ready: false,
      error: null,
      loading: true,
      docs: [],
      name: DEFAULT_DOC,
      doc: null,
      revision: null,
      path: '',
      pageId: null,
      selection: [],
      primaryKey: null,
      viewport: { x: 40, y: 40, zoom: 1 },
      tool: 'pointer',
      panel: 'layers',
      inspectorOpen: true,
      dirty: false,
      saving: false,
      savedAt: null,
      conflict: null,
      notice: null,
      editingText: null,
      commentDraft: null,
      enteredInstance: null,
      componentMode: null,
      crop: null,
      scene: null,
      sceneIssues: [],
      showComments: true,
      fontVersion: 0,
      zoomLabel: '100%',
      historyVersion: 0,
      foundation: { device: DEFAULT_DEVICE, preset: DEFAULT_PRESET },
      audit: null,
      imageCapabilities: null,
      imageGenerating: false,
    }
  }

  subscribe = (listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getVersion = () => this.version

  emit() {
    this.version += 1
    for (const listener of this.listeners) listener()
  }

  set(patch, emit = true) {
    Object.assign(this.state, patch)
    if (emit) this.emit()
  }

  toast(text, kind = 'info') {
    this.state.notice = { text, kind, at: Date.now() }
    this.emit()
    this.onToast?.({ text, kind })
    clearTimeout(this.noticeTimer)
    this.noticeTimer = setTimeout(() => {
      this.state.notice = null
      this.emit()
    }, 3200)
  }

  async mount() {
    if (this.mounted) return
    this.mounted = true
    await this.bootstrap()
  }

  unmount() {
    this.mounted = false
    clearTimeout(this.saveTimer)
    clearTimeout(this.selectionTimer)
    this.eventsAbort?.abort()
    clearInterval(this.pollTimer)
    this.loadingAbort?.abort()
    this.flush().catch(() => {})
  }

  async bootstrap() {
    this.state.loading = true
    this.emit()
    try {
      const data = await loadState(this.sessionId, undefined)
      this.applyState(data, { resetHistory: true })
      this.state.ready = true
      this.state.loading = false
      this.emit()
      await this.ensureFonts()
      this.connectEvents()
      this.startPolling()
    } catch (error) {
      this.state.loading = false
      this.state.ready = false
      this.state.error = error instanceof ApiError ? error.message : String(error?.message ?? error)
      this.emit()
    } finally {
      this.resolveReady?.()
    }
  }

  /** Wait for bootstrap, load a document if needed, then select and reveal a node. */
  async focusNode(request = {}) {
    await this.readyPromise
    if (!this.state.ready) return false
    if (request.doc && request.doc !== this.state.name) await this.loadDoc(request.doc)
    if (request.page && findPage(this.state.doc, request.page)) {
      this.state.pageId = request.page
      this.rebuild()
    }
    const node = request.node ? this.findSceneNode(request.node) : null
    if (request.node && !node) {
      this.toast('画布中找不到这个元素，可能已被删除')
      return false
    }
    if (node) {
      if (node.instanceId) this.state.enteredInstance = node.instanceId
      this.state.inspectorOpen = true
      this.setSelection([node.key])
      this.zoomToSelection()
    }
    this.emit()
    return true
  }

  applyState(data, { resetHistory = false } = {}) {
    const doc = normalizeDoc(data.doc)
    this.state.doc = doc
    this.state.name = data.name ?? DEFAULT_DOC
    this.state.revision = data.revision ?? null
    this.state.path = data.path ?? ''
    this.state.docs = data.docs ?? []
    this.state.pageId = doc.pages[0]?.id ?? null
    this.state.selection = [...new Set(data.selection?.ids ?? [])]
    this.state.primaryKey = this.state.selection[0] ?? null
    this.state.conflict = null
    this.state.dirty = false
    this.state.error = null
    if (resetHistory) this.history.reset(doc)
    this.rebuild()
  }

  rebuild() {
    if (!this.state.doc) return
    try {
      const scene = buildScene(this.state.doc, {
        pageId: this.state.pageId,
        mode: this.state.componentMode ? 'component' : 'design',
        componentId: this.state.componentMode?.componentId,
        measureText: this.measure,
      })
      layoutScene(scene)
      this.state.scene = scene
      this.state.sceneIssues = scene.issues ?? []
      const validKeys = new Set(this.state.selection.filter((key) => scene.byKey.has(key)))
      if (validKeys.size !== this.state.selection.length) {
        this.state.selection = [...validKeys]
        this.state.primaryKey = this.state.selection[0] ?? null
      }
    } catch (error) {
      this.state.scene = null
      this.state.error = `画布渲染失败：${String(error?.message ?? error)}`
    }
    this.state.historyVersion += 1
  }

  findSceneNode(key) {
    return this.state.scene?.byKey.get(key) ?? null
  }

  selectedNodes() {
    return this.state.selection.map((key) => this.findSceneNode(key)).filter(Boolean)
  }

  primaryNode() {
    return this.state.primaryKey ? this.findSceneNode(this.state.primaryKey) : null
  }

  // ───────────────────────────── selection / viewport ─────────────────────────────

  setSelection(keys, primaryKey) {
    this.state.selection = [...new Set(keys)]
    this.state.primaryKey = primaryKey ?? this.state.selection[0] ?? null
    this.state.editingText = null
    this.emit()
    this.queueSelectionPost()
  }

  toggleSelection(key) {
    const exists = this.state.selection.includes(key)
    this.setSelection(exists ? this.state.selection.filter((entry) => entry !== key) : [...this.state.selection, key], key)
  }

  clearSelection() {
    this.setSelection([], null)
  }

  queueSelectionPost() {
    clearTimeout(this.selectionTimer)
    this.selectionTimer = setTimeout(() => {
      const ids = new Set()
      for (const key of this.state.selection) {
        const node = this.findSceneNode(key)
        ids.add(node?.instanceId ?? node?.id ?? key)
      }
      postSelection(this.sessionId, this.state.name, [...ids], this.state.pageId)
    }, 120)
  }

  setTool(tool) {
    this.state.tool = tool
    if (tool !== 'comment') this.state.commentDraft = null
    this.emit()
  }

  setPanel(panel) {
    this.state.panel = panel
    this.emit()
  }

  setViewport(viewport) {
    this.state.viewport = viewport
    this.emit()
  }

  zoomAt(screen, factor) {
    const viewport = this.state.viewport
    const world = worldPoint(viewport, screen)
    const zoom = clamp(viewport.zoom * factor, 0.02, 32)
    this.state.viewport = {
      zoom,
      x: screen.x - world.x * zoom,
      y: screen.y - world.y * zoom,
    }
    this.emit()
  }

  zoomToFit(padding = 48) {
    const rect = this.state.scene ? sceneBounds(this.state.scene) : null
    if (!rect) return
    this.zoomToRect(rect, padding)
  }

  zoomToSelection(padding = 64) {
    const nodes = this.selectedNodes()
    if (!nodes.length) {
      this.zoomToFit(padding)
      return
    }
    const rect = unionRects(nodes.map((node) => ({ x: node.absX, y: node.absY, width: node.width, height: node.height })))
    if (rect) this.zoomToRect(rect, padding)
  }

  zoomToRect(rect, padding = 48) {
    const view = this.viewportSize()
    const width = Math.max(1, rect.width)
    const height = Math.max(1, rect.height)
    const zoom = clamp(Math.min((view.width - padding * 2) / width, (view.height - padding * 2) / height), 0.02, 8)
    this.state.viewport = {
      zoom,
      x: view.width / 2 - (rect.x + width / 2) * zoom,
      y: view.height / 2 - (rect.y + height / 2) * zoom,
    }
    this.emit()
  }

  viewportSize() {
    return this.canvasSize ?? { width: 900, height: 600 }
  }

  // ───────────────────────────── doc loading / saving ─────────────────────────────

  async loadDoc(name, { resetHistory = true } = {}) {
    await this.flush()
    try {
      const data = await loadState(this.sessionId, name)
      this.applyState(data, { resetHistory })
      this.emit()
      await this.ensureFonts()
      this.connectEvents()
      this.startPolling()
    } catch (error) {
      this.toast(error instanceof ApiError ? error.message : String(error), 'error')
    }
  }

  async createDoc(name) {
    if (!/^[a-z0-9][a-z0-9-_]{0,63}$/.test(name)) {
      this.toast('文档名只能是小写字母、数字、- 和 _', 'error')
      return
    }
    try {
      await this.flush()
      const doc = emptyDoc('新画布')
      doc.pages[0].name = 'Page 1'
      const result = await saveDoc(this.sessionId, name, null, doc)
      this.state.revision = result.revision
      await this.loadDoc(name)
      this.toast('已创建画布')
    } catch (error) {
      this.toast(error instanceof ApiError ? error.message : String(error), 'error')
    }
  }

  async renameDoc(name, from = this.state.name) {
    if (!/^[a-z0-9][a-z0-9-_]{0,63}$/.test(name)) {
      this.toast('文档名只能是小写字母、数字、- 和 _', 'error')
      return
    }
    if (name === from) {
      this.toast('名称没有变化')
      return
    }
    try {
      await this.flush()
      if (this.state.dirty || this.state.saving) {
        this.toast('请先解决画布保存冲突，再重命名', 'error')
        return
      }
      const oldName = this.state.name
      const result = await renameCanvasDoc(this.sessionId, from, name)
      const nextName = result.name ?? name
      this.state.docs = result.docs ?? this.state.docs
      if (from !== oldName) {
        this.emit()
        this.toast('已重命名画布')
        return
      }
      await this.loadDoc(nextName)
      const doc = this.state.doc
      if (doc) {
        const genericTitle = !doc.title || doc.title === '主画布' || doc.title === '新画布' || doc.title === oldName
        if (genericTitle && doc.title !== nextName) {
          doc.title = nextName
          this.state.dirty = true
          this.state.docs = (this.state.docs ?? []).map((entry) => entry.name === nextName ? { ...entry, title: nextName } : entry)
          this.scheduleSave()
        }
      }
      this.toast('已重命名画布')
    } catch (error) {
      this.toast(error instanceof ApiError ? error.message : String(error), 'error')
    }
  }

  async deleteDoc() {
    try {
      await this.flush()
      if (this.state.dirty || this.state.saving) {
        this.toast('请先解决画布保存冲突，再删除', 'error')
        return
      }
      const result = await deleteCanvasDoc(this.sessionId, this.state.name)
      const nextName = result.name ?? 'main'
      this.state.docs = result.docs ?? []
      await this.loadDoc(nextName)
      this.toast('已删除画布')
    } catch (error) {
      this.toast(error instanceof ApiError ? error.message : String(error), 'error')
    }
  }

  async flush() {
    clearTimeout(this.saveTimer)
    if (!this.state.doc || !this.state.dirty || this.state.saving) return
    const revision = this.state.revision
    const doc = clone(this.state.doc)
    this.state.saving = true
    this.emit()
    const savedJson = JSON.stringify(doc)
    try {
      const result = await saveDoc(this.sessionId, this.state.name, revision, doc)
      this.state.revision = result.revision
      this.state.path = result.path
      this.state.savedAt = Date.now()
      if (JSON.stringify(this.state.doc) === savedJson) this.state.dirty = false
      else {
        this.state.dirty = true
        clearTimeout(this.saveTimer)
        this.saveTimer = setTimeout(() => this.flush(), 250)
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        this.state.conflict = {
          revision: error.revision,
          doc: error.doc ? normalizeDoc(error.doc) : null,
          message: '画布在别处被修改了',
        }
      } else {
        this.toast(error instanceof ApiError ? error.message : String(error), 'error')
      }
    } finally {
      this.state.saving = false
      this.emit()
    }
  }

  scheduleSave() {
    this.state.dirty = true
    clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.flush(), 400)
    this.emit()
  }

  startPolling() {
    clearInterval(this.pollTimer)
    this.pollTimer = setInterval(() => {
      if (!this.mounted || !this.state.ready || this.state.saving) return
      this.pollRemote().catch(() => {})
    }, 3000)
  }

  async pollRemote() {
    const data = await loadState(this.sessionId, this.state.name)
    if (!data || data.revision === this.state.revision) return
    if (this.state.dirty) {
      this.state.conflict = { revision: data.revision, doc: data.doc ? normalizeDoc(data.doc) : null, message: '画布在别处被修改了' }
      this.emit()
      return
    }
    this.applyState(data, { resetHistory: false })
    this.emit()
  }

  connectEvents() {
    this.eventsAbort?.abort()
    const controller = new AbortController()
    this.eventsAbort = controller
    openEvents(
      this.sessionId,
      this.state.name,
      (event) => {
        if (event.type === 'snapshot-request') {
          this.renderSnapshotFor(event).catch((error) => {
            console.warn('[dsh-canvas] snapshot failed', error)
          })
          return
        }
        if (event.type !== 'doc-changed') return
        if (event.revision === this.state.revision) return
        if (event.source === 'client') return
        if (this.state.dirty || this.state.saving) {
          this.state.conflict = {
            revision: event.revision,
            message: '画布在别处被修改了',
          }
          this.emit()
          return
        }
        this.reloadFromServer(false)
      },
      controller.signal,
    )
  }

  async reloadFromServer(keepHistory = true) {
    try {
      const data = await loadState(this.sessionId, this.state.name)
      const previousHistory = this.history
      this.applyState(data, { resetHistory: false })
      if (!keepHistory) previousHistory.reset(data.doc)
      this.emit()
    } catch (error) {
      this.toast(error instanceof ApiError ? error.message : String(error), 'error')
    }
  }

  resolveConflict(useServer) {
    const conflict = this.state.conflict
    if (!conflict) return
    if (useServer && !conflict.doc) {
      this.state.conflict = null
      this.reloadFromServer(false)
      return
    }
    if (useServer && conflict.doc) {
      this.state.doc = normalizeDoc(conflict.doc)
      this.state.revision = conflict.revision
      this.state.conflict = null
      this.state.dirty = false
      this.history.reset(this.state.doc)
      this.rebuild()
      this.emit()
      this.toast('已加载最新画布')
      return
    }
    // Keep local edits and overwrite the file using the server revision.
    this.state.revision = conflict.revision
    this.state.conflict = null
    this.state.dirty = true
    this.flush()
  }

  // ───────────────────────────── edits ─────────────────────────────

  /** Mutate the document and rebuild; call commit() to record history + save. */
  mutate(fn, { commit = true, select, label } = {}) {
    if (!this.state.doc) return
    try {
      fn(this.state.doc)
    } catch (error) {
      this.toast(String(error?.message ?? error), 'error')
      return
    }
    if (select) {
      this.state.selection = [...new Set(select)]
      this.state.primaryKey = this.state.selection[0] ?? null
    }
    this.rebuild()
    this.emit()
    if (commit) {
      this.commit(label)
      this.scheduleSave()
      this.queueSelectionPost()
    }
  }

  commit() {
    if (this.state.doc) this.history.commit(this.state.doc)
    this.state.historyVersion += 1
    this.emit()
  }

  updateNode(id, patch, options = {}) {
    this.mutate((doc) => {
      const node = deepFind([...doc.pages.flatMap((page) => page.children), ...doc.components.map((c) => c.root)], id)
      if (!node) throw new Error(`找不到节点 ${id}`)
      Object.assign(node, patch)
    }, options)
  }

  updateSelected(patch, options = {}) {
    const nodes = this.selectedNodes().filter((node) => node.editable)
    if (!nodes.length) return
    this.mutate((doc) => {
      for (const rnode of nodes) {
        const node = deepFind([...doc.pages.flatMap((page) => page.children), ...doc.components.map((c) => c.root)], rnode.sourceId)
        if (node) Object.assign(node, patch)
      }
    }, options)
  }

  updateNodeBySource(sourceId, patch, options = {}) {
    this.updateNode(sourceId, patch, options)
  }

  addNode(node, parentId, index) {
    const id = node.id ?? newId(node.type === 'instance' ? 'i' : 'n')
    const created = {
      name: node.name ?? defaultName(node.type),
      x: 0,
      y: 0,
      width: 120,
      height: 120,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      ...node,
      id,
    }
    if (created.type !== 'frame' && created.type !== 'group' && created.type !== 'instance') {
      delete created.children
    }
    this.mutate((doc) => {
      const pages = doc.pages
      let container = pages.find((page) => page.id === this.state.pageId) ?? pages[0]
      let parent = null
      if (parentId) {
        parent = deepFind(pages.flatMap((page) => page.children), parentId)
        if (parent) container = parent
      }
      if (!parent) {
        container.children = container.children ?? []
        container.children.push(created)
      } else {
        parent.children = parent.children ?? []
        parent.children.splice(index == null ? parent.children.length : index, 0, created)
      }
    }, { select: [id] })
    return created
  }

  createShapeAt(type, point) {
    const defaults = {
      frame: { name: 'Frame', width: 320, height: 480, fills: [{ type: 'solid', color: '#FFFFFF' }], strokes: [], effects: [], cornerRadius: 0, clip: true, children: [] },
      rect: { name: 'Rectangle', width: 120, height: 120, fills: [{ type: 'solid', color: '#D9D9D9' }], strokes: [], effects: [], cornerRadius: 0 },
      ellipse: { name: 'Ellipse', width: 120, height: 120, fills: [{ type: 'solid', color: '#D9D9D9' }], strokes: [], effects: [], cornerRadius: 0 },
      text: {
        name: 'Text',
        width: 200,
        height: 28,
        text: 'Text',
        font: { family: 'system-ui', weight: 400, style: 'normal', size: 16, lineHeight: 1.4, letterSpacing: 0 },
        align: 'left',
        verticalAlign: 'top',
        fills: [{ type: 'solid', color: '#111111' }],
        effects: [],
        autoHeight: true,
      },
      line: { name: 'Line', width: 160, height: 0, strokes: [{ color: '#111111', width: 1, align: 'center' }] },
    }[type]
    if (!defaults) return
    const created = this.addNode({ type, ...defaults, x: point.x, y: point.y, rotation: 0, opacity: 1, visible: true, locked: false }, null)
    if (created) {
      this.setTool('pointer')
      if (created.type === 'text') this.beginTextEdit(created.id)
    }
    return created
  }

  deleteSelection() {
    const ids = this.selectedNodes().filter((node) => node.editable && !node.isInstanceRoot).map((node) => node.sourceId)
    const instanceIds = this.selectedNodes().filter((node) => node.isInstanceRoot).map((node) => node.sourceId)
    const all = [...new Set([...ids, ...instanceIds])]
    if (!all.length) return
    this.mutate((doc) => {
      for (const id of all) {
        for (const page of doc.pages) removeFromTree(page.children, id)
      }
    }, { select: [] })
  }

  duplicateSelection() {
    const nodes = this.selectedNodes().filter((node) => node.editable && !node.isInstanceRoot)
    if (!nodes.length) return
    const newKeys = []
    this.mutate((doc) => {
      for (const rnode of nodes) {
        const parent = this.findDocParent(doc, rnode.sourceId)
        const list = parent ? parent.children : doc.pages.find((page) => page.id === this.state.pageId)?.children
        if (!list) continue
        const source = deepFind(list, rnode.sourceId)
        if (!source) continue
        const copy = reidTree(source, (old) => newId('n'))
        copy.x += 10
        copy.y += 10
        list.push(copy)
        newKeys.push(copy.id)
      }
    }, { select: newKeys })
  }

  findDocParent(doc, id) {
    for (const page of doc.pages) {
      const parent = parentOfNode(page.children, id, null)
      if (parent !== undefined) return parent
    }
    return undefined
  }

  copySelection() {
    const nodes = this.selectedNodes().filter((node) => node.editable)
    if (!nodes.length) return
    this.clipboard = nodes.map((node) => clone(node.sourceNode))
    this.toast(`已复制 ${nodes.length} 个图层`)
  }

  paste() {
    if (!this.clipboard?.length) return
    const newKeys = []
    this.mutate((doc) => {
      const page = doc.pages.find((entry) => entry.id === this.state.pageId) ?? doc.pages[0]
      for (const source of this.clipboard) {
        const copy = reidTree(source, () => newId('n'))
        copy.x += 20
        copy.y += 20
        page.children.push(copy)
        newKeys.push(copy.id)
      }
    }, { select: newKeys })
  }

  groupSelection() {
    const nodes = this.selectedNodes().filter((node) => node.editable && !node.isInstanceRoot)
    if (nodes.length < 2) return
    const parentId = nodes[0].parent?.id ?? null
    if (!nodes.every((node) => (node.parent?.id ?? null) === parentId)) {
      this.toast('只有同一父级的图层可以成组')
      return
    }
    const rect = unionRects(nodes.map((node) => ({ x: node.absX, y: node.absY, width: node.width, height: node.height })))
    const groupId = newId('g')
    this.mutate((doc) => {
      const parent = parentId ? deepFind(doc.pages.flatMap((page) => page.children), parentId) : doc.pages.find((page) => page.id === this.state.pageId)
      if (!parent) return
      const list = parent.children
      const selectedIds = new Set(nodes.map((node) => node.sourceId))
      const originX = parentId ? 0 : 0
      const moved = []
      for (let index = list.length - 1; index >= 0; index -= 1) {
        if (!selectedIds.has(list[index].id)) continue
        moved.unshift(list.splice(index, 1)[0])
      }
      const parentAbs = nodes[0].parent ? { x: nodes[0].parent.absX, y: nodes[0].parent.absY } : { x: 0, y: 0 }
      const groupX = rect.x - parentAbs.x
      const groupY = rect.y - parentAbs.y
      for (const child of moved) {
        child.x -= groupX - originX
        child.y -= groupY - originY
      }
      list.push({
        id: groupId,
        type: 'group',
        name: 'Group',
        x: groupX,
        y: groupY,
        width: rect.width,
        height: rect.height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        children: moved,
      })
    }, { select: [groupId] })
  }

  ungroupSelection() {
    const groups = this.selectedNodes().filter((node) => node.sourceNode?.type === 'group' && node.editable)
    if (!groups.length) return
    const keep = []
    this.mutate((doc) => {
      for (const group of groups) {
        const parent = this.findDocParent(doc, group.sourceId)
        const list = parent ? parent.children : doc.pages.find((page) => page.id === this.state.pageId)?.children
        if (!list) continue
        const index = list.findIndex((node) => node.id === group.sourceId)
        if (index === -1) continue
        const [source] = list.splice(index, 1)
        let insertAt = index
        for (const child of source.children ?? []) {
          child.x += source.x
          child.y += source.y
          list.splice(insertAt, 0, child)
          insertAt += 1
          keep.push(child.id)
        }
      }
    }, { select: keep })
  }

  reorder(kind) {
    const nodes = this.selectedNodes().filter((node) => node.editable)
    if (!nodes.length) return
    this.mutate((doc) => {
      for (const rnode of nodes) {
        const parent = this.findDocParent(doc, rnode.sourceId)
        const list = parent ? parent.children : doc.pages.find((page) => page.id === this.state.pageId)?.children
        if (!list) continue
        const index = list.findIndex((node) => node.id === rnode.sourceId)
        if (index === -1) continue
        const [node] = list.splice(index, 1)
        if (kind === 'front') list.push(node)
        else if (kind === 'back') list.unshift(node)
        else if (kind === 'forward') list.splice(Math.min(list.length, index + 1), 0, node)
        else list.splice(Math.max(0, index - 1), 0, node)
      }
    }, { select: this.state.selection })
  }

  align(kind) {
    const nodes = this.selectedNodes().filter((node) => node.editable && !node.isInstanceRoot)
    if (nodes.length < 2) return
    const rect = unionRects(nodes.map((node) => ({ x: node.absX, y: node.absY, width: node.width, height: node.height })))
    this.mutate((doc) => {
      for (const rnode of nodes) {
        const node = deepFind(doc.pages.flatMap((page) => page.children), rnode.sourceId)
        if (!node) continue
        if (kind === 'left') node.x += rect.x - rnode.absX
        else if (kind === 'right') node.x += rect.x + rect.width - (rnode.absX + rnode.width)
        else if (kind === 'centerX') node.x += rect.x + rect.width / 2 - (rnode.absX + rnode.width / 2)
        else if (kind === 'top') node.y += rect.y - rnode.absY
        else if (kind === 'bottom') node.y += rect.y + rect.height - (rnode.absY + rnode.height)
        else if (kind === 'centerY') node.y += rect.y + rect.height / 2 - (rnode.absY + rnode.height / 2)
      }
    }, { select: this.state.selection })
  }

  distribute(axis) {
    const nodes = this.selectedNodes().filter((node) => node.editable && !node.isInstanceRoot)
    if (nodes.length < 3) return
    this.mutate((doc) => {
      const sorted = [...nodes].sort((a, b) => (axis === 'x' ? a.absX - b.absX : a.absY - b.absY))
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const total = axis === 'x'
        ? last.absX + last.width - first.absX
        : last.absY + last.height - first.absY
      const sizes = sorted.reduce((sum, node) => sum + (axis === 'x' ? node.width : node.height), 0)
      const gap = (total - sizes) / (sorted.length - 1)
      let cursor = axis === 'x' ? first.absX : first.absY
      for (const rnode of sorted) {
        const node = deepFind(doc.pages.flatMap((page) => page.children), rnode.sourceId)
        if (!node) continue
        if (axis === 'x') node.x += cursor - rnode.absX
        else node.y += cursor - rnode.absY
        cursor += (axis === 'x' ? rnode.width : rnode.height) + gap
      }
    }, { select: this.state.selection })
  }

  renameNode(sourceId, name) {
    this.updateNode(sourceId, { name }, { commit: true })
  }

  setVisibility(sourceId, visible) {
    this.updateNode(sourceId, { visible }, { commit: true })
  }

  setLocked(sourceId, locked) {
    this.updateNode(sourceId, { locked }, { commit: true })
  }

  setText(sourceId, text) {
    this.updateNode(sourceId, { text }, { commit: true })
  }

  beginTextEdit(key) {
    const node = this.findSceneNode(key)
    if (!node || node.type !== 'text') return
    this.state.editingText = { key, sourceId: node.sourceId, value: node.text ?? '' }
    this.state.selection = [key]
    this.state.primaryKey = key
    this.emit()
  }

  commitTextEdit(value) {
    const editing = this.state.editingText
    if (!editing) return
    this.state.editingText = null
    if (value !== editing.value) this.setText(editing.sourceId, value)
    else this.emit()
  }

  cancelTextEdit() {
    this.state.editingText = null
    this.emit()
  }

  undo() {
    const doc = this.history.undo()
    if (!doc) return
    this.state.doc = normalizeDoc(doc, { touch: false })
    this.rebuild()
    this.state.dirty = true
    this.emit()
    this.scheduleSave()
  }

  redo() {
    const doc = this.history.redo()
    if (!doc) return
    this.state.doc = normalizeDoc(doc, { touch: false })
    this.rebuild()
    this.state.dirty = true
    this.emit()
    this.scheduleSave()
  }

  // ───────────────────────────── components / styles ─────────────────────────────

  enterInstance(key) {
    const node = this.findSceneNode(key)
    if (!node || (node.type !== 'instance' && !node.isInstanceRoot)) return
    this.state.enteredInstance = node.key
    this.state.selection = []
    this.state.primaryKey = null
    this.toast('已进入实例，双击文本/形状可覆盖，Esc 退出')
    this.emit()
  }

  exitInstance() {
    this.state.enteredInstance = null
    this.state.selection = []
    this.state.primaryKey = null
    this.emit()
  }

  setOverride(instanceRootId, sourceId, patch) {
    this.mutate((doc) => {
      const instance = deepFind(doc.pages.flatMap((page) => page.children), instanceRootId)
      if (!instance || instance.type !== 'instance') return
      instance.overrides = instance.overrides ?? {}
      instance.overrides[sourceId] = { ...(instance.overrides[sourceId] ?? {}), ...patch }
    })
  }

  detachInstance(instanceRootId) {
    this.mutate((doc) => {
      for (const page of doc.pages) {
        const instance = deepFind(page.children, instanceRootId)
        if (!instance) continue
        const component = doc.components.find((entry) => entry.id === instance.componentId)
        if (!component) throw new Error('主组件不存在')
        const parent = parentOfNode(page.children, instanceRootId, null)
        const list = parent ? parent.children : page.children
        const index = list.findIndex((node) => node.id === instanceRootId)
        const copy = this.materializeInstance(doc, component, instance)
        list.splice(index, 1, copy)
        return
      }
    }, { select: [instanceRootId] })
  }

  materializeInstance(doc, component, instance) {
    const root = clone(component.root)
    const remap = new Map()
    const apply = (node) => {
      const nextId = newId('n')
      remap.set(node.id, nextId)
      node.id = nextId
      const override = instance.overrides?.[node.id]
      if (override) Object.assign(node, override)
      if (Array.isArray(node.children)) node.children.forEach(apply)
    }
    // Fix override keys before ids change.
    const overrides = instance.overrides ?? {}
    const overridesById = new Map(Object.entries(overrides))
    const applyWithOverrides = (node) => {
      const oldId = node.id
      const nextId = newId('n')
      remap.set(oldId, nextId)
      node.id = nextId
      const override = overridesById.get(oldId)
      if (override) {
        if (override.text != null) node.text = override.text
        if (override.fills != null) node.fills = override.fills
        if (override.visible != null) node.visible = override.visible
      }
      if (Array.isArray(node.children)) node.children.forEach(applyWithOverrides)
    }
    root.x = instance.x
    root.y = instance.y
    if (instance.width) root.width = instance.width
    if (instance.height) root.height = instance.height
    applyWithOverrides(root)
    return root
  }

  createComponentFromSelection(name = 'Component') {
    const node = this.primaryNode()
    if (!node || !node.editable) return
    const componentId = newId('cmp')
    const rootId = newId('n')
    const instanceId = newId('i')
    this.mutate((doc) => {
      const parent = this.findDocParent(doc, node.sourceId)
      const list = parent ? parent.children : doc.pages.find((page) => page.id === this.state.pageId)?.children
      if (!list) return
      const index = list.findIndex((entry) => entry.id === node.sourceId)
      if (index === -1) return
      const [source] = list.splice(index, 1)
      const sourceAbs = { x: node.absX, y: node.absY }
      const root = clone(source)
      root.x = 0
      root.y = 0
      root.id = rootId
      doc.components.push({
        id: componentId,
        name: name || source.name || 'Component',
        variantProps: {},
        root,
      })
      const instance = {
        id: instanceId,
        type: 'instance',
        name: source.name,
        x: sourceAbs.x - (parent ? this.findSceneNode(node.parent?.key)?.absX ?? 0 : 0),
        y: sourceAbs.y - (parent ? this.findSceneNode(node.parent?.key)?.absY ?? 0 : 0),
        width: source.width,
        height: source.height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        componentId,
        variantProps: {},
        overrides: {},
      }
      // Rebase to the actual parent's absolute origin; the scene node parent is
      // authoritative for page nodes.
      instance.x = node.absX - (node.parent?.absX ?? 0)
      instance.y = node.absY - (node.parent?.absY ?? 0)
      list.splice(index, 0, instance)
    }, { select: [instanceId] })
    this.toast('已创建组件')
  }

  insertInstance(componentId) {
    const doc = this.state.doc
    const component = doc?.components.find((entry) => entry.id === componentId)
    if (!component) return
    const view = this.viewportSize()
    const viewport = this.state.viewport
    const world = worldPoint(viewport, { x: view.width / 2, y: view.height / 2 })
    const node = {
      id: newId('i'),
      type: 'instance',
      name: component.name,
      x: world.x - (component.root.width ?? 120) / 2,
      y: world.y - (component.root.height ?? 40) / 2,
      width: component.root.width ?? 120,
      height: component.root.height ?? 40,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      componentId,
      variantProps: { ...(component.variantProps ?? {}) },
      overrides: {},
    }
    this.mutate((docValue) => {
      const page = docValue.pages.find((entry) => entry.id === this.state.pageId) ?? docValue.pages[0]
      page.children.push(node)
    }, { select: [node.id] })
  }

  setVariant(instanceId, key, value) {
    this.mutate((doc) => {
      const instance = deepFind(doc.pages.flatMap((page) => page.children), instanceId)
      if (!instance) return
      instance.variantProps = { ...(instance.variantProps ?? {}), [key]: value }
    })
  }

  swapComponent(instanceId, componentId) {
    if (!this.state.doc.components.some((entry) => entry.id === componentId)) return
    this.mutate((doc) => {
      const instance = deepFind(doc.pages.flatMap((page) => page.children), instanceId)
      if (!instance) return
      instance.componentId = componentId
      instance.variantProps = {}
      instance.overrides = {}
    })
  }

  createVariantSet(componentIds) {
    if (componentIds.length < 2) {
      this.toast('至少选择两个组件才能创建变体集')
      return
    }
    this.mutate((doc) => {
      const setId = newId('vs')
      const values = componentIds.map((id) => {
        const component = doc.components.find((entry) => entry.id === id)
        return (component?.name ?? 'Variant').split('/').pop().replace(/\s+/g, '-')
      })
      const unique = [...new Set(values)]
      for (const id of componentIds) {
        const component = doc.components.find((entry) => entry.id === id)
        if (!component) continue
        component.variantSetId = setId
        component.variantProps = { State: (component.name ?? 'Variant').split('/').pop().replace(/\s+/g, '-') }
      }
      doc.variantSets.push({
        id: setId,
        name: 'Variant set',
        properties: [{ name: 'State', values: unique }],
        componentIds,
      })
    })
  }

  editComponent(componentId) {
    this.state.componentMode = { componentId }
    this.state.selection = []
    this.state.primaryKey = null
    this.rebuild()
    this.emit()
  }

  exitComponentMode() {
    this.state.componentMode = null
    this.state.selection = []
    this.state.primaryKey = null
    this.rebuild()
    this.emit()
  }

  createStyle(type, name) {
    const node = this.primaryNode()
    if (!node) return
    const value = type === 'fill'
      ? node.fills?.[0]
      : type === 'text'
        ? { font: node.font, fills: node.fills }
        : node.effects
    if (!value) {
      this.toast('该图层没有可创建的样式')
      return
    }
    const styleId = newId('style')
    this.mutate((doc) => {
      doc.styles.push({ id: styleId, type, name: name || `${type} style`, value: clone(value) })
      const source = deepFind(doc.pages.flatMap((page) => page.children), node.sourceId)
      if (source) {
        if (type === 'fill') source.fillStyleId = styleId
        if (type === 'text') source.textStyleId = styleId
        if (type === 'effect') source.effectStyleId = styleId
      }
    })
    this.toast('已创建样式')
  }

  applyStyle(styleId) {
    const style = this.state.doc.styles.find((entry) => entry.id === styleId)
    if (!style) return
    const nodes = this.selectedNodes().filter((node) => node.editable)
    if (!nodes.length) return
    this.mutate((doc) => {
      for (const rnode of nodes) {
        const node = deepFind(doc.pages.flatMap((page) => page.children), rnode.sourceId)
        if (!node) continue
        if (style.type === 'fill' && ['frame', 'rect', 'ellipse', 'path', 'text'].includes(node.type)) node.fillStyleId = styleId
        if (style.type === 'text' && node.type === 'text') node.textStyleId = styleId
        if (style.type === 'effect') node.effectStyleId = styleId
      }
    })
  }

  detachStyle(styleId) {
    const style = this.state.doc.styles.find((entry) => entry.id === styleId)
    if (!style) return
    this.mutate((doc) => {
      const walk = (node) => {
        if (node.fillStyleId === styleId && style.type === 'fill') {
          node.fills = [clone(style.value)]
          delete node.fillStyleId
        }
        if (node.textStyleId === styleId && style.type === 'text') {
          node.font = clone(style.value.font)
          node.fills = clone(style.value.fills)
          delete node.textStyleId
        }
        if (node.effectStyleId === styleId && style.type === 'effect') {
          node.effects = clone(style.value)
          delete node.effectStyleId
        }
        for (const child of node.children ?? []) walk(child)
      }
      for (const page of doc.pages) page.children.forEach(walk)
      for (const component of doc.components) walk(component.root)
    })
  }

  updateStyle(styleId, patch) {
    this.mutate((doc) => {
      const style = doc.styles.find((entry) => entry.id === styleId)
      if (style) Object.assign(style, patch)
    })
  }

  deleteStyle(styleId) {
    this.mutate((doc) => {
      doc.styles = doc.styles.filter((entry) => entry.id !== styleId)
      const clear = (node) => {
        if (node.fillStyleId === styleId) delete node.fillStyleId
        if (node.textStyleId === styleId) delete node.textStyleId
        if (node.effectStyleId === styleId) delete node.effectStyleId
        for (const child of node.children ?? []) clear(child)
      }
      for (const page of doc.pages) page.children.forEach(clear)
      for (const component of doc.components) clear(component.root)
    })
  }

  // ───────────────────────────── comments ─────────────────────────────

  pageBounds() {
    const scene = this.state.scene
    if (!scene) return { x: 0, y: 0, width: 1, height: 1 }
    const roots = scene.roots.filter((node) => node.visible !== false)
    return unionRects(roots.map((node) => ({ x: node.absX, y: node.absY, width: node.width, height: node.height }))) ?? { x: 0, y: 0, width: 1, height: 1 }
  }

  commentPosition(comment) {
    if (comment.nodeId) {
      const node = this.findSceneNode(comment.nodeId)
      if (node) return screenPoint(this.state.viewport, centerOf(node))
    }
    const bounds = this.pageBounds()
    return screenPoint(this.state.viewport, {
      x: bounds.x + (comment.x ?? 0.5) * bounds.width,
      y: bounds.y + (comment.y ?? 0.5) * bounds.height,
    })
  }

  addComment(body, { nodeId, x, y }) {
    if (!this.state.doc || !body.trim()) return
    const bounds = this.pageBounds()
    const normalized = {
      x: x == null ? 0.5 : clamp((x - bounds.x) / Math.max(1, bounds.width), 0, 1),
      y: y == null ? 0.5 : clamp((y - bounds.y) / Math.max(1, bounds.height), 0, 1),
    }
    this.mutate((doc) => {
      addCommentOp(doc, {
        pageId: this.state.pageId ?? doc.pages[0].id,
        nodeId: nodeId ?? undefined,
        x: normalized.x,
        y: normalized.y,
        body,
        author: 'user',
      })
    })
    this.state.commentDraft = null
    this.emit()
  }

  replyComment(commentId, body) {
    if (!body.trim()) return
    this.mutate((doc) => replyComment(doc, commentId, body, 'user'))
  }

  resolveComment(commentId, resolved = true) {
    this.mutate((doc) => resolveComment(doc, commentId, resolved))
  }

  deleteComment(commentId) {
    this.mutate((doc) => removeComment(doc, commentId))
  }

  // ───────────────────────────── fonts / images ─────────────────────────────

  fontFaceStyle() {
    const rules = []
    for (const font of this.state.doc?.fonts ?? []) {
      if (!font?.asset) continue
      const url = fontUrl(this.sessionId, font.asset)
      rules.push(
        `@font-face{font-family:"${font.family}";font-style:${font.style ?? 'normal'};font-weight:${font.weight ?? 400};src:url("${url}") format("${font.asset.endsWith('.woff2') ? 'woff2' : font.asset.endsWith('.woff') ? 'woff' : font.asset.endsWith('.otf') ? 'opentype' : 'truetype'}");font-display:block}`,
      )
    }
    return rules.join('\n')
  }

  async ensureFonts() {
    const fonts = this.state.doc?.fonts ?? []
    if (!fonts.length || typeof document === 'undefined') return
    let style = document.getElementById('dsh-canvas-fonts')
    if (!style) {
      style = document.createElement('style')
      style.id = 'dsh-canvas-fonts'
      document.head.appendChild(style)
    }
    style.textContent = this.fontFaceStyle()
    try {
      await Promise.all(
        fonts.map((font) =>
          document.fonts?.load?.(`${font.style ?? 'normal'} ${font.weight ?? 400} 16px "${font.family}"`).catch(() => undefined),
        ),
      )
    } catch {
      // fall back to system fonts
    }
    this.state.fontVersion += 1
    this.rebuild()
    this.emit()
  }

  async uploadFontFile(file, family, weight, style) {
    try {
      const result = await uploadFont(this.sessionId, file, { family, weight: Number(weight) || 400, style: style || 'normal' })
      this.mutate((doc) => {
        doc.fonts = doc.fonts ?? []
        if (!doc.fonts.some((entry) => entry.asset === result.asset)) {
          doc.fonts.push({
            id: newId('font'),
            family,
            weight: Number(weight) || 400,
            style: style || 'normal',
            asset: result.asset,
            sourceName: file.name,
          })
        }
      })
      await this.ensureFonts()
      this.toast('字体已上传')
    } catch (error) {
      this.toast(error?.message ?? String(error), 'error')
    }
  }

  removeFont(fontId) {
    const font = this.state.doc.fonts.find((entry) => entry.id === fontId)
    if (!font) return
    let used = false
    const scan = (node) => {
      if (node.type === 'text' && node.font?.family === font.family && (node.font?.weight ?? 400) === font.weight) used = true
      for (const child of node.children ?? []) scan(child)
    }
    for (const page of this.state.doc.pages) page.children.forEach(scan)
    for (const component of this.state.doc.components) scan(component.root)
    if (used) {
      this.toast('该字体仍被文本使用，先替换后再删除')
      return
    }
    this.mutate((doc) => {
      doc.fonts = doc.fonts.filter((entry) => entry.id !== fontId)
    })
  }

  async uploadFillImage(sourceId, fillIndex, file) {
    try {
      const result = await uploadImage(this.sessionId, file)
      this.mutate((doc) => {
        const node = deepFind(
          [...doc.pages.flatMap((page) => page.children), ...doc.components.map((entry) => entry.root)],
          sourceId,
        )
        if (!node?.fills?.[fillIndex]) return
        node.fills[fillIndex] = { type: 'image', asset: result.asset, fit: 'cover' }
      })
    } catch (error) {
      this.toast(error?.message ?? String(error), 'error')
    }
  }

  importSvg(source) {
    const { paths, warnings } = importSvgPaths(source)
    if (!paths.length) {
      this.toast(warnings[0] ?? '没有可导入的 SVG path', 'error')
      return 0
    }
    const center = this.viewportCenterWorld()
    const createdIds = []
    for (const [index, path] of paths.entries()) {
      const scale = Math.min(1, 240 / Math.max(1, path.viewBox.width), 240 / Math.max(1, path.viewBox.height))
      const width = Math.max(1, path.viewBox.width * scale)
      const height = Math.max(1, path.viewBox.height * scale)
      const node = {
        id: newId('n'),
        type: 'path',
        name: path.name,
        x: center.x - width / 2 + index * 8,
        y: center.y - height / 2 + index * 8,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        d: path.d,
        viewBox: path.viewBox,
        fillRule: path.fillRule,
        fills: path.fills,
        strokes: path.strokes,
        effects: [],
      }
      const created = this.addNode(node, null)
      if (created) createdIds.push(created.id)
    }
    if (createdIds.length) this.setSelection(createdIds)
    this.toast(warnings.length ? `已导入 ${createdIds.length} 条 path；${warnings[0]}` : `已导入 ${createdIds.length} 条 path`)
    return createdIds.length
  }

  requestImagePick() {
    if (!this.imagePicker) {
      this.toast('图片选择器尚未准备好', 'error')
      return false
    }
    this.imagePicker.click()
    return true
  }

  async uploadImageFile(file, at) {
    try {
      const result = await uploadImage(this.sessionId, file)
      const size = await imageSize(assetUrl(this.sessionId, this.state.name, result.asset)).catch(() => ({ width: 320, height: 200 }))
      const width = Math.min(480, size.width || 320)
      const height = (size.height || 200) * (width / (size.width || 320))
      const point = at ?? this.viewportCenterWorld()
      const node = {
        id: newId('n'),
        type: 'rect',
        name: file.name.replace(/\.[^.]+$/, '') || 'Image',
        x: point.x - width / 2,
        y: point.y - height / 2,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        cornerRadius: 0,
        fills: [{ type: 'image', asset: result.asset, fit: 'cover' }],
        strokes: [],
        effects: [],
      }
      this.addNode(node, null)
    } catch (error) {
      this.toast(error?.message ?? String(error), 'error')
    }
  }

  viewportCenterWorld() {
    const view = this.viewportSize()
    return worldPoint(this.state.viewport, { x: view.width / 2, y: view.height / 2 })
  }

  // ───────────────────────────── composer / export ─────────────────────────────

  selectionText() {
    const nodes = this.selectedNodes()
    if (!nodes.length) return ''
    const primary = nodes[0]
    const label = nodes.length > 1 ? `画布选区（${nodes.length} 个图层）：${primary.name}` : `画布选区：${primary.name}`
    return formatCanvasLink({
      doc: this.state.name,
      node: primary.key,
      page: this.state.pageId ?? undefined,
      label,
    })
  }

  async insertSelectionToComposer() {
    const text = this.selectionText()
    const nodes = this.selectedNodes()
    if (!text || !nodes.length) {
      this.toast('先选中画布元素')
      return
    }
    announceCanvasSelection({
      sessionId: this.sessionId,
      doc: this.state.name,
      node: nodes[0].key,
      page: this.state.pageId ?? undefined,
      label: nodes[0].name || nodes[0].type,
    })
    const actions = this.inputActions
    let inserted = false
    try {
      if (actions && typeof actions.captureInsertion === 'function') {
        const span = actions.captureInsertion()
        inserted = actions.insertText(text, span)
      }
    } catch {
      inserted = false
    }
    if (!inserted) {
      try {
        await navigator.clipboard.writeText(text)
        this.toast('输入框不可用，选区已复制到剪贴板')
      } catch {
        this.toast('无法写入输入框或剪贴板', 'error')
      }
    } else {
      this.toast('已插入画布链接；发送后点消息里的画布 chip 可跳转')
    }
  }

  insertTemplate(templateId) {
    try {
      const { node, template } = instantiateTemplate(templateId, { device: this.state.foundation?.device ?? DEFAULT_DEVICE })
      const center = this.viewportCenterWorld()
      node.x = Math.round(center.x - node.width / 2)
      node.y = Math.round(center.y - node.height / 2)
      const created = this.addNode(node, null)
      if (!created) return
      this.setTool('pointer')
      this.zoomToSelection()
      this.toast(`已插入模板：${template.name}`)
    } catch (error) {
      this.toast(error?.message ?? String(error), 'error')
    }
  }

  setFoundation(patch = {}) {
    const device = getDevice(patch.device ?? this.state.foundation?.device ?? DEFAULT_DEVICE)
    const preset = getPreset(patch.preset ?? this.state.foundation?.preset ?? DEFAULT_PRESET)
    this.state.foundation = { device: device.id, preset: preset.id }
    this.emit()
  }

  async loadImageCapabilities() {
    try {
      const result = await imageCapabilities(this.sessionId)
      this.state.imageCapabilities = result.capabilities ?? null
      this.emit()
      return this.state.imageCapabilities
    } catch (error) {
      this.state.imageCapabilities = null
      this.emit()
      return null
    }
  }

  async insertImageAsset(asset, name = 'AI image') {
    if (!asset) return null
    const size = await imageSize(assetUrl(this.sessionId, this.state.name, asset)).catch(() => ({ width: 320, height: 200 }))
    const width = Math.min(480, size.width || 320)
    const height = (size.height || 200) * (width / (size.width || 320))
    const point = this.viewportCenterWorld()
    const node = {
      id: newId('n'),
      type: 'rect',
      name,
      x: point.x - width / 2,
      y: point.y - height / 2,
      width,
      height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      cornerRadius: 0,
      fills: [{ type: 'image', asset, fit: 'cover' }],
      strokes: [],
      effects: [],
    }
    return this.addNode(node, null)
  }

  async generateImage(prompt) {
    if (this.state.imageGenerating) return { ok: false, code: 'busy', message: '图片生成进行中' }
    const text = String(prompt ?? '').trim()
    if (!text) {
      this.toast('请输入图片描述')
      return { ok: false, code: 'prompt-required' }
    }
    this.state.imageGenerating = true
    this.emit()
    try {
      const result = await generateCanvasImage(this.sessionId, this.state.name, text)
      if (!result?.ok) {
        this.toast(result?.message ?? '图片生成失败', 'error')
        return result
      }
      await this.insertImageAsset(result.asset, 'AI image')
      this.toast('图片已生成并插入画布')
      return result
    } catch (error) {
      this.toast(error?.message ?? String(error), 'error')
      return { ok: false, code: error?.code ?? 'image-failed', message: error?.message }
    } finally {
      this.state.imageGenerating = false
      this.emit()
    }
  }

  async runAudit(scope = 'page') {
    const nodeId = scope === 'selection' ? this.selectedNodes()[0]?.sourceId : undefined
    if (scope === 'selection' && !nodeId) {
      this.toast('先选中一个节点')
      return null
    }
    try {
      const result = await auditCanvas(this.sessionId, this.state.name, {
        ...(nodeId ? { nodeId } : {}),
        ...(this.state.pageId ? { pageId: this.state.pageId } : {}),
        system: 'ios',
      })
      this.state.audit = result
      this.emit()
      const high = (result.findings ?? []).filter((finding) => finding.severity === 'high').length
      this.toast(high ? `检查完成：${high} 个高优先级问题` : '检查完成')
      return result
    } catch (error) {
      this.toast(error?.message ?? String(error), 'error')
      return null
    }
  }

  loadDesignSystem(systemId = 'material3') {
    const system = getDesignSystem(systemId)
    const styles = designSystemStyles(systemId)
    this.mutate(
      (doc) => {
        const names = new Set(doc.styles.map((style) => style.name))
        for (const style of styles) {
          if (names.has(style.name)) continue
          doc.styles.push(structuredClone(style))
          names.add(style.name)
        }
      },
      { select: [] },
    )
    this.toast(`已加载 ${system.name} 样式（${styles.length} 条），可在「样式」面板应用`)
  }

  insertPrompt(brief = '') {
    const device = getDevice(this.state.foundation?.device)
    const preset = getPreset(this.state.foundation?.preset)
    const prompt = [
      '使用 canvas-ui-design 技能，直接在画布中生成 UI。',
      `设备：${device.name} ${device.width}×${device.height}；风格预设：${preset.name}。`,
      '先 canvas_read 读取当前文档和选区，再用 canvas_template 的 foundation/页面骨架与 canvas_write/canvas_edit 生成真实内容。',
      '完成后运行 canvas_audit，并按 findings 修正；不要只给设计建议。',
      `需求：${String(brief || '').trim() || '生成一个移动端页面，包含标题、主内容和主按钮。'}`,
    ].join('\n')
    const actions = this.inputActions
    try {
      if (actions && typeof actions.captureInsertion === 'function') {
        const span = actions.captureInsertion()
        if (actions.insertText(prompt, span)) {
          this.toast('已写入 AI 生成请求')
          return
        }
      }
      navigator.clipboard?.writeText(prompt)
      this.toast('已复制 AI 生成请求')
    } catch {
      this.toast('无法写入输入框', 'error')
    }
  }

  insertImagePrompt(prompt = '') {
    const text = [
      '请使用当前模型的原生图片生成能力生成一张图片。',
      `图片描述：${String(prompt || '').trim() || '透明背景的移动 App 插画素材。'}`,
      '生成后把图片文件通过 canvas_image import 导入 canvas/assets/，再用 canvas_edit 放到当前设计里。',
      '如果当前没有原生图片工具，请改用 canvas_image probe 检查 Codex 路线，或要求用户导入图片。',
    ].join('\n')
    const actions = this.inputActions
    try {
      if (actions && typeof actions.captureInsertion === 'function') {
        const span = actions.captureInsertion()
        if (actions.insertText(text, span)) {
          this.toast('已写入生图请求')
          return
        }
      }
      navigator.clipboard?.writeText(text)
      this.toast('已复制生图请求')
    } catch {
      this.toast('无法写入输入框', 'error')
    }
  }

  /** Render the requested node, or the whole page, and return a PNG data URL. */
  async renderPngFor(nodeId, scale = 2) {
    const targetKeys = this.exportTargetKeys(nodeId)
    const svg = await this.buildExportSvg(targetKeys)
    const { svgToPng } = await import('./editor/export-png.js')
    return await svgToPng(svg, scale)
  }

  /** Keys for export: an explicit node id, else the selection, else every root. */
  exportTargetKeys(nodeId) {
    if (typeof nodeId === 'string' && nodeId) {
      const match = [...(this.state.scene?.byKey.values() ?? [])].find(
        (node) => node.id === nodeId || node.key === nodeId,
      )
      if (match) return [match.key]
    }
    const nodes = this.selectedNodes()
    if (nodes.length) return nodes.map((node) => node.key)
    return this.state.scene?.roots.map((node) => node.key) ?? []
  }

  async renderSnapshotFor(event) {
    const requestId = event?.requestId
    if (typeof requestId !== 'string' || !requestId) return
    const png = await this.renderPngFor(event.nodeId, Number(event.scale) || 2)
    await postSnapshot(this.sessionId, requestId, String(png).split(',')[1], event.nodeId)
  }

  async buildExportSvg(targetKeys) {
    const { buildSvg } = await import('./editor/export-svg.js')
    return await buildSvg(this.state.scene, {
      nodeKeys: targetKeys,
      background: this.state.doc.pages.find((page) => page.id === this.state.pageId)?.background ?? null,
      resolveAsset: async (asset) => {
        const response = await fetch(assetUrl(this.sessionId, this.state.name, asset), { credentials: 'same-origin' })
        if (!response.ok) throw new Error(`asset ${asset} unavailable`)
        const blob = await response.blob()
        return await blobToDataUrl(blob)
      },
      resolveFont: async (font) => {
        const response = await fetch(fontUrl(this.sessionId, font.asset), { credentials: 'same-origin' })
        if (!response.ok) throw new Error(`font ${font.asset} unavailable`)
        const blob = await response.blob()
        return await blobToDataUrl(blob)
      },
      fonts: this.state.doc.fonts ?? [],
    })
  }

  async exportSelection(kind) {
    const nodes = this.selectedNodes()
    const targetKeys = nodes.length ? nodes.map((node) => node.key) : this.state.scene?.roots.map((node) => node.key) ?? []
    try {
      const { saveFile } = await import('./save-file.js')
      const svg = await this.buildExportSvg(targetKeys)
      if (kind === 'svg') {
        const result = await saveFile(svg, `${this.state.name}.svg`, 'image/svg+xml')
        if (result.cancelled) return
        this.toast(`已保存 ${result.filename}`)
        return
      }
      const { svgToPng } = await import('./editor/export-png.js')
      const png = await svgToPng(svg, 2)
      const blob = await (await fetch(png)).blob()
      const result = await saveFile(blob, `${this.state.name}.png`, 'image/png')
      if (result.cancelled) return
      this.toast(`已保存 ${result.filename}`)
    } catch (error) {
      this.toast(`导出失败：${String(error?.message ?? error)}`, 'error')
    }
  }

  async exportPack() {
    try {
      const { saveFile } = await import('./save-file.js')
      const response = await fetchPack(this.sessionId, this.state.name)
      const json = JSON.stringify(response.pack)
      const result = await saveFile(json, `${this.state.name}.drafi.json`, 'application/json')
      if (result.cancelled) return null
      this.toast(`已保存 ${result.filename}`)
      return result
    } catch (error) {
      this.toast(`打包失败：${String(error?.message ?? error)}`, 'error')
      return null
    }
  }

  async importPackFile(file, name) {
    try {
      const text = await file.text()
      const pack = JSON.parse(text)
      const result = await importPack(this.sessionId, pack, name)
      const data = await loadState(this.sessionId, result.name)
      this.applyState(data, { resetHistory: true })
      this.toast(`已导入 ${result.path}（${result.assets} 个素材）`)
      this.emit()
      return result
    } catch (error) {
      this.toast(`导入失败：${String(error?.message ?? error)}`, 'error')
      return null
    }
  }

  /** Copy the current selection (or the page) as a PNG image to the clipboard. */
  async copySelectionImage() {
    try {
      const png = await this.renderPngFor(null, 2)
      const blob = await (await fetch(png)).blob()
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        this.toast('已复制渲染图片到剪贴板')
        return
      }
      const link = document.createElement('a')
      link.href = png
      link.download = `${this.state.name}.png`
      link.click()
      this.toast('剪贴板不可用，已下载 PNG')
    } catch (error) {
      this.toast(`复制图片失败：${String(error?.message ?? error)}`, 'error')
    }
  }

  // ───────────────────────────── crop / style helpers ─────────────────────────────

  beginCrop(nodeKey, fillIndex = 0) {
    const node = this.findSceneNode(nodeKey)
    if (!node || !node.fills?.[fillIndex] || node.fills[fillIndex].type !== 'image') {
      this.toast('该图层没有图片填充')
      return
    }
    this.state.crop = { key: nodeKey, sourceId: node.sourceId, fillIndex, crop: { ...(node.fills[fillIndex].crop ?? { x: 0, y: 0, width: 1, height: 1 }) } }
    this.state.selection = [nodeKey]
    this.state.primaryKey = nodeKey
    this.emit()
  }

  updateCrop(crop) {
    const state = this.state.crop
    if (!state) return
    state.crop = crop
    this.emit()
  }

  commitCrop() {
    const state = this.state.crop
    if (!state) return
    this.mutate((doc) => {
      const node = deepFind(doc.pages.flatMap((page) => page.children), state.sourceId)
      if (!node?.fills?.[state.fillIndex]) return
      node.fills[state.fillIndex].crop = state.crop
    })
    this.state.crop = null
    this.emit()
  }

  cancelCrop() {
    this.state.crop = null
    this.emit()
  }
}

function defaultName(type) {
  return { frame: 'Frame', group: 'Group', rect: 'Rectangle', ellipse: 'Ellipse', line: 'Line', text: 'Text', instance: 'Instance' }[type] ?? 'Node'
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function btoaUnicode(text) {
  return btoa(unescape(encodeURIComponent(text)))
}

function imageSize(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = reject
    image.src = url
  })
}

interface CanvasStore extends Record<string, any> {}

export { CanvasStore, deepFind, parentOfNode, removeFromTree, reidTree }
