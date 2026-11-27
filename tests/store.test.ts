// @ts-nocheck
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test, afterEach } from 'node:test'

import { CanvasStore } from '../src/client/store.js'
import {
  STYLE_DRAG_MIME,
  clearActiveCanvasDrag,
  getActiveCanvasDrag,
  setActiveCanvasDrag,
} from '../src/client/ui/template-preview.js'
import { buildSelectionMenu } from '../src/client/ui/selection-menu.js'
import { normalizeDoc } from '../src/shared/format.js'
import { buildScene } from '../src/client/editor/resolve.js'
import { layoutScene } from '../src/client/editor/layout.js'
import { buildSvg } from '../src/client/editor/export-svg.js'

const example = JSON.parse(await readFile(new URL('../examples/login.canvas.json', import.meta.url), 'utf8'))
const responses = []
let savedDoc = null
let activeName = 'main'

function jsonResponse(value) {
  return {
    ok: true,
    status: 200,
    async text() {
      return JSON.stringify(value)
    },
  }
}

globalThis.fetch = async (url, options = {}) => {
  const text = String(url)
  if (text.includes('/dsh-canvas/api/state')) {
    return jsonResponse({
      ok: true,
      name: activeName,
      path: `.dsh-canvas/${activeName}.canvas.json`,
      revision: 'rev-1',
      doc: structuredClone(example),
      docs: [{ name: activeName, title: '主画布', updatedAt: new Date().toISOString(), bytes: 100 }],
      selection: { ids: [], pageId: 'page-1' },
    })
  }
  if (text.includes('/dsh-canvas/api/doc/delete')) {
    activeName = 'main'
    return jsonResponse({ ok: true, name: 'main', docs: [{ name: 'main', title: '主画布', updatedAt: new Date().toISOString(), bytes: 100 }] })
  }
  if (text.includes('/dsh-canvas/api/doc/rename')) {
    const body = JSON.parse(options.body)
    activeName = body.to
    return jsonResponse({ ok: true, name: body.to, path: `.dsh-canvas/${body.to}.canvas.json`, revision: 'rev-renamed', docs: [] })
  }
  if (text.includes('/dsh-canvas/api/doc') && options.method === 'PUT') {
    savedDoc = JSON.parse(options.body).doc
    return jsonResponse({ ok: true, name: 'main', path: '.dsh-canvas/main.canvas.json', revision: 'rev-2', stats: {} })
  }
  if (text.includes('/dsh-canvas/api/selection')) return jsonResponse({ ok: true })
  if (text.includes('/dsh-canvas/api/audit')) return jsonResponse({ ok: true, findings: [{ severity: 'high', code: 'contrast', nodeId: 'login-title', nodeName: 'Title', message: 'contrast' }], checked: ['contrast'], skipped: [] })
  if (text.includes('/dsh-canvas/api/image/capabilities')) return jsonResponse({ ok: true, capabilities: { recommended: 'codex', codex: { available: true, imageGeneration: true }, model: { provider: 'deepseek-official', model: 'deepseek-flash' } } })
  if (text.includes('/dsh-canvas/api/export')) return jsonResponse({ ok: true, path: 'canvas/exports/test.svg' })
  if (text.includes('/dsh-canvas/api/events')) {
    return { ok: false, status: 204, async text() { return '' }, body: null }
  }
  return jsonResponse({ ok: true })
}

function createStore() {
  const toasts = []
  const store = new CanvasStore({
    sessionId: 'session-test',
    inputActions: null,
    onToast: (toast) => toasts.push(toast),
  })
  store.onToast = (toast) => toasts.push(toast)
  return { store, toasts }
}

async function boot() {
  const { store, toasts } = createStore()
  await store.bootstrap()
  store.eventsAbort?.abort()
  return { store, toasts }
}

afterEach(async () => {
  savedDoc = null
  activeName = 'main'
  responses.length = 0
})

test('store bootstraps, resolves and lays out the example', async () => {
  const { store } = await boot()
  assert.equal(store.state.ready, true)
  assert.equal(store.state.name, 'main')
  assert.equal(store.state.revision, 'rev-1')
  assert.ok(store.state.doc)
  assert.equal(store.state.scene.roots.length, 1)
  assert.equal(store.state.scene.issues.length, 0)
  const button = store.findSceneNode('btn-instance')
  assert.ok(button)
  assert.equal(button.type, 'instance')
  assert.equal(button.children[0].lines[0].text, 'Sign in')
  store.unmount()
})

test('selection text is a single canvas reference link', async () => {
  const { store } = await boot()
  store.setSelection(['btn-instance'])
  const text = store.selectionText()
  assert.equal(text.split('\n').length, 1)
  assert.match(text, /^\[画布选区：Primary button\]\(dsh-canvas:\/\/main\?node=btn-instance/)
  assert.doesNotMatch(text, /revision|Sign in|节点|可调用/)
  store.unmount()
})

test('focusNode selects and reveals a node for a canvas link', async () => {
  const { store } = await boot()
  const ok = await store.focusNode({ node: 'login-title' })
  assert.equal(ok, true)
  assert.deepEqual(store.state.selection, ['login-title'])
  assert.equal(store.state.primaryKey, 'login-title')
  store.unmount()
})

test('selection menu reflects the current selection and canvas extras', async () => {
  const { store } = await boot()
  const root = store.state.scene.roots[0]
  store.setSelection([root.key])
  let items = buildSelectionMenu(store)
  let byLabel = new Map(items.filter((item) => item.label).map((item) => [item.label, item]))
  assert.ok(byLabel.has('复制'))
  assert.equal(byLabel.get('编组').disabled, true)
  assert.equal(byLabel.has('新建 Frame'), false)

  store.setSelection([root.key, root.children[0].key])
  items = buildSelectionMenu(store)
  byLabel = new Map(items.filter((item) => item.label).map((item) => [item.label, item]))
  assert.equal(byLabel.get('编组').disabled, false)
  assert.equal(byLabel.get('插入到对话').disabled, false)
  assert.equal(byLabel.has('让 AI 生成 UI'), false)
  assert.equal(items.some((item) => item.insertGrid), false)
  store.unmount()
})

test('importSvg adds editable path nodes to the current page', async () => {
  const { store } = await boot()
  const count = store.importSvg('<svg viewBox="0 0 24 24"><path id="star" d="M0 0h24v24H0z" fill="#123456"/></svg>')
  assert.equal(count, 1)
  const node = store.selectedNodes()[0]
  assert.equal(node.type, 'path')
  assert.equal(node.sourceNode.d, 'M0 0h24v24H0z')
  store.unmount()
})

test('createShapeAt creates a shape at the requested page point', async () => {
  const { store } = await boot()
  store.createShapeAt('rect', { x: 42, y: 24 })
  const node = store.selectedNodes()[0]
  assert.equal(node.type, 'rect')
  assert.equal(node.sourceNode.x, 42)
  assert.equal(node.sourceNode.y, 24)
  assert.equal(node.sourceNode.width, 120)
  assert.equal(store.state.scene.issues.length, 0)
  store.unmount()
})

test('foundation selects the device/preset for template insertion', async () => {
  const { store } = await boot()
  store.setFoundation({ device: 'iphone15', preset: 'soft' })
  assert.equal(store.state.foundation.device, 'iphone15')
  assert.equal(store.state.foundation.preset, 'soft')
  store.insertTemplate('ios-form-screen')
  const template = store.selectedNodes()[0]
  assert.equal(template.width, 390)
  assert.equal(template.height, 844)
  store.unmount()
})

test('runAudit stores findings and image capabilities can be loaded', async () => {
  const { store } = await boot()
  const audit = await store.runAudit('page')
  assert.equal(store.state.audit.findings.length, 1)
  assert.equal(audit.findings[0].nodeId, 'login-title')
  const capabilities = await store.loadImageCapabilities()
  assert.equal(capabilities.recommended, 'codex')
  store.unmount()
})

test('renameDoc changes the active canvas document name', async () => {
  const { store } = await boot()
  await store.renameDoc('renamed-canvas')
  assert.equal(store.state.name, 'renamed-canvas')
  assert.equal(store.state.path, '.dsh-canvas/renamed-canvas.canvas.json')
  store.unmount()
})

test('renameDoc can rename a non-active document without switching', async () => {
  const { store } = await boot()
  await store.renameDoc('other-name', 'some-other-doc')
  assert.equal(store.state.name, 'main')
  store.unmount()
})

test('deleteDoc removes the active document and loads a fallback', async () => {
  const { store } = await boot()
  await store.deleteDoc()
  assert.equal(store.state.name, 'main')
  store.unmount()
})

test('loadDesignSystem merges a local style library into the document', async () => {
  const { store } = await boot()
  const before = store.state.doc.styles.length
  store.loadDesignSystem('material3')
  assert.ok(store.state.doc.styles.length > before)
  assert.ok(store.state.doc.styles.some((style) => style.name === 'M3/Color/Primary'))
  store.loadDesignSystem('material3')
  const count = store.state.doc.styles.length
  store.loadDesignSystem('material3')
  assert.equal(store.state.doc.styles.length, count)
  assert.equal(store.state.scene.issues.length, 0)
  store.unmount()
})

test('insertTemplate inserts a built-in iOS screen into the current page', async () => {
  const { store } = await boot()
  store.insertTemplate('ios-screen')
  assert.equal(store.state.scene.roots.length, 2)
  const template = store.state.scene.roots.find((node) => node.name === 'iOS 屏幕')
  assert.ok(template)
  assert.equal(template.width, 393)
  assert.equal(template.height, 852)
  assert.equal(store.state.scene.issues.length, 0)
  assert.equal(store.state.selection.length, 1)
  store.unmount()
})

test('insertSelectionToComposer uses inputActions and falls back to clipboard', async () => {
  const { store } = await boot()
  const inserted = []
  store.inputActions = {
    captureInsertion: () => ({ draftRev: 3 }),
    insertText: (text, span) => {
      inserted.push({ text, span })
      return true
    },
  }
  store.setSelection(['btn-instance'])
  await store.insertSelectionToComposer()
  assert.equal(inserted.length, 1)
  assert.match(inserted[0].text, /画布选区/)
  assert.equal(inserted[0].text.startsWith('\n'), false)
  assert.equal(inserted[0].text.endsWith('\n'), false)

  store.inputActions = { captureInsertion: () => ({ draftRev: 9 }), insertText: () => false }
  let clipboard = ''
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async (value) => { clipboard = value } },
  })
  await store.insertSelectionToComposer()
  assert.match(clipboard, /btn-instance/)
  store.unmount()
})

test('node edits, undo and redo work', async () => {
  const { store } = await boot()
  const before = store.state.doc.pages[0].children[0].children[2].children[1].x
  store.updateNode('email-field', { x: 123 })
  assert.equal(store.state.doc.pages[0].children[0].children[2].children[1].x, 123)
  assert.equal(store.history.canUndo(), true)
  store.undo()
  assert.equal(store.state.doc.pages[0].children[0].children[2].children[1].x, before)
  store.redo()
  assert.equal(store.state.doc.pages[0].children[0].children[2].children[1].x, 123)
  store.unmount()
})

test('adding, duplicating, grouping and ungrouping keep the scene valid', async () => {
  const { store } = await boot()
  const rect = store.addNode({ type: 'rect', x: 10, y: 10, width: 40, height: 40, fills: [] })
  assert.ok(rect)
  store.setSelection([rect.id])
  store.duplicateSelection()
  assert.equal(store.state.selection.length, 1)
  store.addNode({ type: 'rect', x: 60, y: 60, width: 40, height: 40, fills: [] })
  store.setSelection([rect.id, store.state.selection[0]])
  store.groupSelection()
  const scene = store.state.scene
  assert.ok(scene.issues.length === 0, scene.issues.join('\n'))
  store.ungroupSelection()
  assert.equal(store.state.scene.issues.length, 0)
  store.unmount()
})

test('comments can be added, replied to and resolved', async () => {
  const { store } = await boot()
  store.addComment('按钮再大一点', { nodeId: 'btn-instance' })
  assert.equal(store.state.doc.comments.length, 2)
  const comment = store.state.doc.comments[store.state.doc.comments.length - 1]
  store.replyComment(comment.id, '已调整')
  assert.equal(store.state.doc.comments.find((entry) => entry.id === comment.id).replies.length, 1)
  store.resolveComment(comment.id, true)
  assert.equal(store.state.doc.comments.find((entry) => entry.id === comment.id).resolved, true)
  store.deleteComment(comment.id)
  assert.equal(store.state.doc.comments.some((entry) => entry.id === comment.id), false)
  store.unmount()
})

test('creating a component from the frame inserts an instance and supports component mode', async () => {
  const { store } = await boot()
  store.setSelection(['login-frame'])
  store.createComponentFromSelection('Login Screen')
  const component = store.state.doc.components.find((entry) => entry.name === 'Login Screen')
  assert.ok(component)
  assert.equal(store.state.scene.roots[0].type, 'instance')
  store.editComponent(component.id)
  assert.equal(store.state.scene.mode, 'component')
  assert.equal(store.state.scene.roots.length, 1)
  store.exitComponentMode()
  assert.equal(store.state.scene.mode, 'design')
  store.unmount()
})

test('styles can be created, applied and detached', async () => {
  const { store } = await boot()
  store.setSelection(['email-field'])
  store.createStyle('fill', 'Field/Fill')
  const style = store.state.doc.styles.find((entry) => entry.name === 'Field/Fill')
  assert.ok(style)
  store.setSelection(['password-field'])
  store.applyStyle(style.id)
  store.detachStyle(style.id)
  assert.equal(store.state.scene.issues.length, 0)
  store.unmount()
})

test('image crop updates the document fill', async () => {
  const { store } = await boot()
  store.updateNode('email-field', { fills: [{ type: 'image', asset: 'assets/example.png', fit: 'cover' }] })
  store.setSelection(['email-field'])
  store.beginCrop('email-field', 0)
  store.updateCrop({ x: 0.1, y: 0.1, width: 0.5, height: 0.5 })
  store.commitCrop()
  const fill = store.state.doc.pages[0].children[0].children[2].children[1].fills[0]
  assert.equal(fill.type, 'image')
  assert.equal(fill.crop.width, 0.5)
  store.unmount()
})

test('saving after edits sends a revision guard', async () => {
  const { store } = await boot()
  store.updateNode('email-field', { x: 99 })
  await store.flush()
  assert.ok(savedDoc)
  assert.equal(savedDoc.pages[0].children[0].children[2].children[1].x, 99)
  store.unmount()
})

test('SVG export includes text, gradients and instance content', async () => {
  const scene = buildScene(normalized(), { pageId: 'page-1', measureText: (request) => fakeMeasure(request) })
  layoutScene(scene)
  const svg = await buildSvg(scene, { background: '#0B1220' })
  assert.match(svg, /<svg/)
  assert.match(svg, /Welcome back/)
  assert.match(svg, /linearGradient/)
  assert.match(svg, /Sign in/)
  assert.match(svg, /<image|linearGradient/)
})

test('SVG export draws line nodes', async () => {
  const doc = normalized()
  doc.pages[0].children[0].children.push({
    id: 'line-1',
    type: 'line',
    name: 'Divider',
    x: 20,
    y: 20,
    width: 100,
    height: 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    strokes: [{ color: '#FF0000', width: 2, align: 'center' }],
  })
  const scene = buildScene(doc, { pageId: 'page-1', measureText: (request) => fakeMeasure(request) })
  layoutScene(scene)
  const svg = await buildSvg(scene, {})
  assert.match(svg, /<line x1="0" y1="0" x2="100" y2="0" stroke="#FF0000"/)
})

test('SVG export preserves relative child coordinates for offset root frames and respects image fit', async () => {
  const doc = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    id: 'svg-offset-fit',
    title: 'SVG Offset & Fit',
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        children: [
          {
            id: 'screen',
            type: 'frame',
            name: 'Offset Screen',
            x: 240,
            y: 120,
            width: 393,
            height: 852,
            clip: true,
            fills: [{ type: 'solid', color: '#FFFFFF' }],
            children: [
              {
                id: 'icon-contain',
                type: 'rect',
                name: 'Icon',
                x: 16,
                y: 24,
                width: 40,
                height: 20,
                fills: [{ type: 'image', asset: 'assets/icon.png', fit: 'contain' }],
              },
              {
                id: 'photo-cover',
                type: 'rect',
                name: 'Photo',
                x: 80,
                y: 24,
                width: 40,
                height: 40,
                fills: [{ type: 'image', asset: 'assets/photo.png', fit: 'cover' }],
              },
              {
                id: 'stretch-fill',
                type: 'rect',
                name: 'Stretch',
                x: 140,
                y: 24,
                width: 40,
                height: 20,
                fills: [{ type: 'image', asset: 'assets/stretch.png', fit: 'fill' }],
              },
            ],
          },
        ],
      },
    ],
  })
  const scene = buildScene(doc, { pageId: 'page-1', measureText: (request) => fakeMeasure(request) })
  layoutScene(scene)
  const svg = await buildSvg(scene, {
    resolveAsset: async (asset) => `data:image/png;base64,${Buffer.from(asset).toString('base64')}`,
  })
  // Root screen sits at (0, 0) in viewBox, and children keep exact relative offsets (16, 24) without +minX/+minY double-shift
  assert.match(svg, /<g transform="translate\(0 0\)"[^>]*data-node="screen"/)
  assert.match(svg, /<g transform="translate\(16 24\)"[^>]*data-node="icon-contain"/)
  assert.match(svg, /data-node="icon-contain"[\s\S]*?preserveAspectRatio="xMidYMid meet"/)
  assert.match(svg, /data-node="photo-cover"[\s\S]*?preserveAspectRatio="xMidYMid slice"/)
  assert.match(svg, /data-node="stretch-fill"[\s\S]*?preserveAspectRatio="none"/)
})

test('setPage and addPage rebuild the scene, exit component mode, notify subscribers, and remember per-page viewports', async () => {
  const multiPage = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    id: 'multi-page-doc',
    title: 'Multi Page',
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        children: [{ id: 'p1-root', type: 'frame', name: 'P1 Frame', x: 0, y: 0, width: 393, height: 852, children: [] }],
      },
      {
        id: 'page-2',
        name: 'Page 2',
        children: [{ id: 'p2-root', type: 'frame', name: 'P2 Frame', x: 2000, y: 1200, width: 393, height: 852, children: [] }],
      },
    ],
    components: [
      {
        id: 'comp-1',
        name: 'Button',
        root: { id: 'comp-root', type: 'frame', name: 'Btn', x: 0, y: 0, width: 120, height: 44, children: [] },
      },
    ],
  })

  const store = new CanvasStore({ sessionId: 's-pages' })
  store.applyState({ doc: multiPage, name: 'multi', revision: 'rev-1', docs: [] }, { resetHistory: true })
  store.state.ready = true
  store.mounted = true

  let notifications = 0
  const off = store.subscribe(() => {
    notifications += 1
  })

  // Pan on page 1, enter component mode, then switch to page 2
  store.setViewport({ x: -120, y: -80, zoom: 1.5 })
  store.editComponent('comp-1')
  assert.equal(store.state.componentMode?.componentId, 'comp-1')

  const beforeNotifies = notifications
  store.setPage('page-2')
  assert.equal(store.state.componentMode, null)
  assert.equal(store.state.pageId, 'page-2')
  assert.equal(store.state.scene?.pageId, 'page-2')
  assert.deepEqual(
    store.state.scene?.roots?.map((r) => r.id),
    ['p2-root'],
  )
  assert.ok(notifications > beforeNotifies, 'setPage must notify subscribers')
  // Page 2 had no saved viewport and lives at (2000, 1200), so zoomToFit should frame it instead of staying at (-120, -80)
  assert.notDeepEqual(store.state.viewport, { x: -120, y: -80, zoom: 1.5 })

  // Switching back to page 1 restores page 1's remembered viewport
  store.setPage('page-1')
  assert.equal(store.state.pageId, 'page-1')
  assert.equal(store.state.scene?.pageId, 'page-1')
  assert.deepEqual(store.state.viewport, { x: -120, y: -80, zoom: 1.5 })

  // addPage creates a new canvas with default Chinese naming ("画布 N") and switches cleanly to it
  const prevPageCount = store.state.doc.pages.length
  store.addPage()
  assert.equal(store.state.doc.pages.length, prevPageCount + 1)
  const createdPage = store.state.doc.pages[prevPageCount]
  assert.equal(createdPage.name, `画布 ${prevPageCount + 1}`)
  assert.equal(store.state.pageId, createdPage.id)
  assert.equal(store.state.scene?.pageId, createdPage.id)
  assert.deepEqual(store.state.scene?.roots, [])
  assert.deepEqual(store.state.viewport, { x: 40, y: 40, zoom: 1 })

  // renamePage updates the page name cleanly and ignores blank or unchanged names
  assert.equal(store.renamePage(createdPage.id, '   '), false)
  assert.equal(store.renamePage(createdPage.id, createdPage.name), false)
  assert.equal(store.renamePage(createdPage.id, 'v2 重构'), true)
  assert.equal(store.state.doc.pages[prevPageCount].name, 'v2 重构')
  assert.equal(store.state.scene?.page?.name, 'v2 重构')

  // insertTemplate with explicit drop point centers on that world point and keeps the user's viewport
  const keptViewport = { x: -300, y: -150, zoom: 0.8 }
  store.setViewport(keptViewport)
  store.insertTemplate('ios-nav-bar', { x: 600, y: 400 })
  const dropped = store.state.doc.pages[prevPageCount].children.at(-1)
  assert.ok(dropped)
  assert.equal(dropped.x, Math.round(600 - dropped.width / 2))
  assert.equal(dropped.y, Math.round(400 - dropped.height / 2))
  assert.deepEqual(store.state.viewport, keptViewport)

  // insertInstance with explicit drop point centers on that world point and keeps the user's viewport
  store.insertInstance('comp-1', { x: 820, y: 510 })
  const droppedInst = store.state.doc.pages[prevPageCount].children.at(-1)
  assert.ok(droppedInst)
  assert.equal(droppedInst.type, 'instance')
  assert.equal(droppedInst.componentId, 'comp-1')
  assert.equal(droppedInst.x, Math.round(820 - 120 / 2))
  assert.equal(droppedInst.y, Math.round(510 - 44 / 2))
  assert.deepEqual(store.state.viewport, keptViewport)

  off()
  store.unmount()
})

test('component mode supports add, delete (protecting root), duplicate, copy/paste, align, group, reorder, styles and crop without polluting pages', async () => {
  const doc = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    id: 'comp-mode-doc',
    title: 'Component Mode',
    pages: [
      {
        id: 'page-1',
        name: '画布 1',
        children: [{ id: 'p-rect', type: 'rect', name: 'Page Rect', x: 10, y: 10, width: 100, height: 100 }],
      },
    ],
    components: [
      {
        id: 'cmp-card',
        name: 'Card',
        root: {
          id: 'cmp-root',
          type: 'frame',
          name: 'Card Root',
          x: 0,
          y: 0,
          width: 240,
          height: 160,
          fills: [{ type: 'solid', color: '#FFFFFF' }],
          children: [
            {
              id: 'cmp-bg',
              type: 'rect',
              name: 'Bg',
              x: 10,
              y: 20,
              width: 80,
              height: 40,
              fills: [{ type: 'image', asset: 'assets/bg.png', fit: 'cover' }],
            },
          ],
        },
      },
    ],
  })

  const { store, toasts } = createStore()
  store.applyState({ doc, name: 'comp-mode', revision: 'rev-1', docs: [] }, { resetHistory: true })
  store.state.ready = true
  store.canvasSize = { width: 900, height: 600 }
  store.setViewport({ x: -500, y: -500, zoom: 0.25 })

  const pageChildrenBefore = store.state.doc.pages[0].children.length

  // editComponent auto-fits the component root into view
  store.editComponent('cmp-card')
  assert.equal(store.state.componentMode?.componentId, 'cmp-card')
  assert.notDeepEqual(store.state.viewport, { x: -500, y: -500, zoom: 0.25 })

  // addNode inserts into component.root.children, not doc.pages[0]
  const added = store.addNode({
    type: 'rect',
    name: 'Badge',
    x: 60,
    y: 50,
    width: 40,
    height: 20,
    fills: [{ type: 'solid', color: '#2563EB' }],
  })
  assert.ok(added)
  assert.equal(store.state.doc.pages[0].children.length, pageChildrenBefore)
  const compRoot = store.state.doc.components[0].root
  assert.equal(compRoot.children.some((c) => c.id === added.id), true)

  // copySelection + paste inserts into component.root.children
  store.setSelection([added.id])
  store.copySelection()
  store.paste()
  const pastedId = store.state.selection[0]
  assert.ok(pastedId && pastedId !== added.id)
  assert.equal(compRoot.children.some((c) => c.id === pastedId), true)
  assert.equal(store.state.doc.pages[0].children.length, pageChildrenBefore)

  // duplicateSelection inside componentMode
  store.setSelection([pastedId])
  store.duplicateSelection()
  const dupId = store.state.selection[0]
  assert.ok(dupId && dupId !== pastedId)
  assert.equal(compRoot.children.some((c) => c.id === dupId), true)

  // align inside componentMode
  store.setSelection([added.id, dupId])
  store.align('left')
  const addedDoc = compRoot.children.find((c) => c.id === added.id)
  const dupDoc = compRoot.children.find((c) => c.id === dupId)
  assert.equal(addedDoc.x, dupDoc.x)

  // reorder inside componentMode
  store.setSelection([added.id])
  store.reorder('front')
  assert.equal(compRoot.children[compRoot.children.length - 1].id, added.id)

  // groupSelection & ungroupSelection inside componentMode
  store.setSelection([pastedId, dupId])
  store.groupSelection()
  const groupId = store.state.selection[0]
  const groupNode = compRoot.children.find((c) => c.id === groupId)
  assert.equal(groupNode?.type, 'group')
  assert.equal(groupNode.children.length, 2)
  store.ungroupSelection()
  assert.equal(compRoot.children.some((c) => c.id === groupId), false)

  // createStyle & applyStyle inside componentMode
  store.setSelection([added.id])
  store.createStyle('fill', 'Comp/Accent')
  const createdStyle = store.state.doc.styles.find((s) => s.name === 'Comp/Accent')
  assert.ok(createdStyle)
  assert.equal(addedDoc.fillStyleId, createdStyle.id)
  store.setSelection([pastedId])
  assert.equal(store.applyStyle(createdStyle.id), true)
  assert.equal(compRoot.children.find((c) => c.id === pastedId).fillStyleId, createdStyle.id)

  // commitCrop inside componentMode
  store.beginCrop('cmp-bg', 0)
  store.updateCrop({ x: 0.2, y: 0.1, width: 0.6, height: 0.6 })
  store.commitCrop()
  assert.equal(compRoot.children.find((c) => c.id === 'cmp-bg').fills[0].crop.width, 0.6)

  // deleteSelection protects component.root itself
  store.setSelection(['cmp-root'])
  store.deleteSelection()
  assert.equal(store.state.doc.components[0].root.id, 'cmp-root')
  assert.ok(toasts.some((t) => t.text.includes('主组件根节点')))

  // deleteSelection removes child from component.root.children
  store.setSelection([dupId])
  store.deleteSelection()
  assert.equal(compRoot.children.some((c) => c.id === dupId), false)
  assert.equal(store.state.doc.pages[0].children.length, pageChildrenBefore)

  store.unmount()
})

test('instance roots support duplicateSelection (preserving override keys), align, distribute, and groupSelection', async () => {
  const doc = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    id: 'inst-ops-doc',
    title: 'Instance Ops',
    pages: [
      {
        id: 'page-1',
        name: '画布 1',
        children: [
          {
            id: 'inst-1',
            type: 'instance',
            name: 'Btn 1',
            x: 100,
            y: 40,
            width: 120,
            height: 44,
            componentId: 'cmp-btn',
            variantProps: { State: 'Primary' },
            overrides: { 'btn-label': { text: 'Confirm' } },
          },
          {
            id: 'rect-1',
            type: 'rect',
            name: 'Anchor',
            x: 20,
            y: 120,
            width: 80,
            height: 40,
          },
        ],
      },
    ],
    components: [
      {
        id: 'cmp-btn',
        name: 'Button',
        root: {
          id: 'btn-root',
          type: 'frame',
          name: 'Btn',
          x: 0,
          y: 0,
          width: 120,
          height: 44,
          children: [{ id: 'btn-label', type: 'text', name: 'Label', x: 8, y: 10, width: 100, height: 24, text: 'Click' }],
        },
      },
    ],
  })

  const { store } = createStore()
  store.applyState({ doc, name: 'inst-ops', revision: 'rev-1', docs: [] }, { resetHistory: true })
  store.state.ready = true

  // Duplicate instance preserves componentId, variantProps, and override keys pointing to component source IDs
  store.setSelection(['inst-1'])
  store.duplicateSelection()
  const dupId = store.state.selection[0]
  assert.ok(dupId && dupId !== 'inst-1')
  const dupDoc = store.state.doc.pages[0].children.find((n) => n.id === dupId)
  assert.equal(dupDoc.type, 'instance')
  assert.equal(dupDoc.componentId, 'cmp-btn')
  assert.deepEqual(dupDoc.variantProps, { State: 'Primary' })
  assert.deepEqual(dupDoc.overrides, { 'btn-label': { text: 'Confirm' } })
  const dupScene = store.findSceneNode(dupId)
  assert.equal(dupScene.children[0].text, 'Confirm')

  // Align works on instances
  store.setSelection(['inst-1', 'rect-1'])
  store.align('left')
  assert.equal(store.state.doc.pages[0].children.find((n) => n.id === 'inst-1').x, 20)

  // GroupSelection works with instances
  store.setSelection(['inst-1', dupId])
  store.groupSelection()
  const group = store.state.doc.pages[0].children.find((n) => n.type === 'group')
  assert.ok(group)
  assert.equal(group.children.length, 2)
  assert.equal(store.state.scene.issues.length, 0)

  store.unmount()
})

test('zoomToFit always frames the whole scene while zoomToSelection frames selected bounds or falls back to scene', async () => {
  const doc = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    id: 'zoom-distinction',
    title: 'Zoom Distinction',
    pages: [
      {
        id: 'page-1',
        name: '画布 1',
        children: [
          {
            id: 'board',
            type: 'frame',
            name: 'Board',
            x: 1000,
            y: 500,
            width: 4000,
            height: 2000,
            children: [
              { id: 'small', type: 'rect', name: 'Small', x: 100, y: 200, width: 100, height: 200 },
            ],
          },
        ],
      },
    ],
  })

  const { store } = createStore()
  store.applyState({ doc, name: 'zoom', revision: 'rev-1', docs: [] }, { resetHistory: true })
  store.canvasSize = { width: 900, height: 600 }
  store.queueSelectionPost = () => {}

  // With selection active, zoomToSelection frames the selection (1100..1200, 700..900 -> center 1150, 800, zoom 3)
  store.setSelection(['small'])
  store.zoomToSelection(0)
  assert.deepEqual(store.getViewport(), { zoom: 3, x: 450 - 1150 * 3, y: 300 - 800 * 3 })

  // With the same selection still active, zoomToFit ignores selection and frames the full scene (1000..5000, 500..2500 -> center 3000, 1500, zoom 0.225)
  store.zoomToFit(0)
  assert.deepEqual(store.getViewport(), { zoom: 0.225, x: 450 - 3000 * 0.225, y: 300 - 1500 * 0.225 })

  // Without selection, zoomToSelection falls back to sceneBounds
  store.clearSelection()
  store.setViewport({ x: 0, y: 0, zoom: 1 })
  store.zoomToSelection(0)
  assert.deepEqual(store.getViewport(), { zoom: 0.225, x: 450 - 3000 * 0.225, y: 300 - 1500 * 0.225 })

  store.unmount()
})

test('deletePage (with last-page guard and comment cleanup), duplicatePage and setPageBackground manage page lifecycle', async () => {
  const doc = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    id: 'page-life',
    title: 'Page Lifecycle',
    pages: [
      {
        id: 'page-1',
        name: '首页',
        background: '#F5F5F5',
        children: [{ id: 'hero', type: 'rect', name: 'Hero', x: 0, y: 0, width: 200, height: 100 }],
      },
    ],
    comments: [
      { id: 'c-1', pageId: 'page-1', x: 0.5, y: 0.5, body: 'Note on p1', author: 'user', resolved: false, createdAt: '2026-01-01T00:00:00.000Z', replies: [] },
    ],
  })

  const { store, toasts } = createStore()
  store.applyState({ doc, name: 'pages', revision: 'rev-1', docs: [] }, { resetHistory: true })
  store.state.ready = true

  // Last-page guard
  assert.equal(store.deletePage('page-1'), false)
  assert.equal(store.state.doc.pages.length, 1)
  assert.ok(toasts.some((t) => t.text === '至少保留一个画布'))

  // setPageBackground updates current page background
  store.setPageBackground('#1E293B')
  assert.equal(store.state.doc.pages[0].background, '#1E293B')
  assert.equal(store.state.scene.background, '#1E293B')

  // duplicatePage deep-clones with fresh child IDs, inserts after source, and switches to it
  const dupPageId = store.duplicatePage('page-1')
  assert.ok(dupPageId)
  assert.equal(store.state.doc.pages.length, 2)
  assert.equal(store.state.doc.pages[1].id, dupPageId)
  assert.equal(store.state.doc.pages[1].name, '首页 副本')
  assert.equal(store.state.pageId, dupPageId)
  assert.equal(store.state.doc.pages[1].children.length, 1)
  assert.notEqual(store.state.doc.pages[1].children[0].id, 'hero')

  // deletePage removes page-1 and its comments; deleting current switches to adjacent
  store.setPage('page-1')
  assert.equal(store.deletePage('page-1'), true)
  assert.equal(store.state.doc.pages.length, 1)
  assert.equal(store.state.pageId, dupPageId)
  assert.equal(store.state.doc.comments.length, 0)
  assert.equal(store.state.scene.issues.length, 0)

  store.unmount()
})

test('moveLayer handles sibling reorder, cross-parent reparent with absX/absY preservation, and rejects invalid/cyclic targets', async () => {
  const doc = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    id: 'move-layer',
    title: 'Move Layer',
    pages: [
      {
        id: 'page-1',
        name: '画布 1',
        children: [
          {
            id: 'frame-a',
            type: 'frame',
            name: 'Frame A',
            x: 100,
            y: 50,
            width: 200,
            height: 200,
            children: [
              { id: 'child-1', type: 'rect', name: 'C1', x: 20, y: 30, width: 40, height: 40 },
              {
                id: 'nested-frame',
                type: 'frame',
                name: 'Nested',
                x: 10,
                y: 10,
                width: 80,
                height: 80,
                children: [],
              },
            ],
          },
          {
            id: 'frame-b',
            type: 'frame',
            name: 'Frame B',
            x: 300,
            y: 10,
            width: 200,
            height: 200,
            children: [],
          },
          {
            id: 'leaf-rect',
            type: 'rect',
            name: 'Leaf',
            x: 0,
            y: 0,
            width: 50,
            height: 50,
          },
        ],
      },
    ],
  })

  const { store } = createStore()
  store.applyState({ doc, name: 'move', revision: 'rev-1', docs: [] }, { resetHistory: true })
  store.state.ready = true

  // Reject dragging into self, into descendant, or into non-container
  assert.equal(store.moveLayer('frame-a', 'frame-a', 0), false)
  assert.equal(store.moveLayer('frame-a', 'nested-frame', 0), false)
  assert.equal(store.moveLayer('child-1', 'leaf-rect', 0), false)

  // Sibling reorder inside page root: move leaf-rect (index 2) to index 0
  assert.equal(store.moveLayer('leaf-rect', null, 0), true)
  assert.deepEqual(
    store.state.doc.pages[0].children.map((n) => n.id),
    ['leaf-rect', 'frame-a', 'frame-b'],
  )

  // Cross-parent reparent: child-1 starts at abs (120, 80) inside frame-a (100, 50)
  // Moving into frame-b (300, 10) must set relative x = -180, y = 70 so abs stays (120, 80)
  assert.equal(store.moveLayer('child-1', 'frame-b', 0), true)
  const frameB = store.state.doc.pages[0].children.find((n) => n.id === 'frame-b')
  const movedDoc = frameB.children[0]
  assert.equal(movedDoc.id, 'child-1')
  assert.equal(movedDoc.x, -180)
  assert.equal(movedDoc.y, 70)
  const movedScene = store.findSceneNode('child-1')
  assert.equal(movedScene.absX, 120)
  assert.equal(movedScene.absY, 80)

  // Reparent back to root (null): relative x/y becomes (120, 80)
  assert.equal(store.moveLayer('child-1', null, 3), true)
  const rootChild = store.state.doc.pages[0].children.find((n) => n.id === 'child-1')
  assert.equal(rootChild.x, 120)
  assert.equal(rootChild.y, 80)

  store.unmount()
})

test('applyStyleToNode, renameStyle, createVariantSet(name), importSvg(at), focusComment and STYLE_DRAG_MIME work as expected', async () => {
  const doc = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    id: 'direct-manip',
    title: 'Direct Manip',
    pages: [
      {
        id: 'page-1',
        name: '画布 1',
        children: [
          { id: 'box-1', type: 'rect', name: 'Box', x: 100, y: 100, width: 400, height: 200, fills: [{ type: 'solid', color: '#E5E7EB' }] },
          { id: 'txt-1', type: 'text', name: 'Heading', x: 120, y: 120, width: 160, height: 30, text: 'Hello' },
        ],
      },
      {
        id: 'page-2',
        name: '画布 2',
        children: [
          { id: 'p2-frame', type: 'frame', name: 'Screen', x: 400, y: 200, width: 600, height: 400, children: [] },
        ],
      },
    ],
    styles: [
      { id: 'st-fill', type: 'fill', name: 'Primary', value: { type: 'solid', color: '#2563EB' } },
      { id: 'st-text', type: 'text', name: 'Title', value: { font: { family: 'system-ui', weight: 700, style: 'normal', size: 24, lineHeight: 1.2, letterSpacing: 0 }, fills: [{ type: 'solid', color: '#111111' }] } },
    ],
    components: [
      { id: 'c1', name: 'Btn/Default', root: { id: 'c1-r', type: 'frame', x: 0, y: 0, width: 80, height: 36, children: [] } },
      { id: 'c2', name: 'Btn/Hover', root: { id: 'c2-r', type: 'frame', x: 0, y: 0, width: 80, height: 36, children: [] } },
    ],
  })

  const { store, toasts } = createStore()
  store.applyState({ doc, name: 'direct', revision: 'rev-1', docs: [] }, { resetHistory: true })
  store.state.ready = true
  store.canvasSize = { width: 900, height: 600 }

  // Empty selection gives clear Chinese toast on applyStyle / createStyle
  store.clearSelection()
  assert.equal(store.applyStyle('st-fill'), false)
  assert.ok(toasts.some((t) => t.text.includes('请先选中')))
  store.createStyle('fill', 'Empty')
  assert.ok(toasts.some((t) => t.text === '请先选中一个图层'))

  // applyStyleToNode rejects mismatched type (text style on rect) and succeeds on compatible type
  assert.equal(store.applyStyleToNode('st-text', 'box-1'), false)
  assert.ok(toasts.some((t) => t.text.includes('文本样式')))
  assert.equal(store.applyStyleToNode('st-text', 'txt-1'), true)
  assert.equal(store.state.doc.pages[0].children.find((n) => n.id === 'txt-1').textStyleId, 'st-text')
  assert.equal(store.applyStyleToNode('st-fill', 'box-1'), true)
  assert.equal(store.state.doc.pages[0].children.find((n) => n.id === 'box-1').fillStyleId, 'st-fill')

  // renameStyle trims and updates
  assert.equal(store.renameStyle('st-fill', '   '), false)
  assert.equal(store.renameStyle('st-fill', '  Brand/Primary  '), true)
  assert.equal(store.state.doc.styles.find((s) => s.id === 'st-fill').name, 'Brand/Primary')

  // createVariantSet honors custom name
  store.createVariantSet(['c1', 'c2'], 'Button States')
  assert.equal(store.state.doc.variantSets[0].name, 'Button States')

  // importSvg(source, at) places path centered at `at`
  const imported = store.importSvg('<svg viewBox="0 0 40 20"><path d="M0 0h40v20H0z" fill="#111111"/></svg>', { x: 500, y: 300 })
  assert.equal(imported, 1)
  const importedNode = store.selectedNodes()[0]
  assert.equal(importedNode.sourceNode.x, 500 - 20)
  assert.equal(importedNode.sourceNode.y, 300 - 10)

  // focusComment with pure coordinates switches page and centers the pin in viewport while preserving zoom
  store.setViewport({ x: 0, y: 0, zoom: 1.5 })
  assert.equal(store.focusComment({ pageId: 'page-2', x: 0.25, y: 0.75 }), true)
  assert.equal(store.state.pageId, 'page-2')
  // page-2 bounds: x=400, y=200, width=600, height=400 -> pin world = (550, 500)
  const pinScreen = store.commentPosition({ pageId: 'page-2', x: 0.25, y: 0.75 })
  assert.ok(Math.abs(pinScreen.x - 450) < 0.01)
  assert.ok(Math.abs(pinScreen.y - 300) < 0.01)

  // STYLE_DRAG_MIME & ActiveCanvasDrag bridge for style drag
  assert.equal(STYLE_DRAG_MIME, 'application/x-dshc-style')
  setActiveCanvasDrag({ kind: 'style', id: 'st-fill', name: 'Brand/Primary', styleType: 'fill' })
  const active = getActiveCanvasDrag()
  assert.equal(active?.kind, 'style')
  assert.equal(active?.id, 'st-fill')
  if (active?.kind === 'style') assert.equal(active.styleType, 'fill')
  clearActiveCanvasDrag()
  assert.equal(getActiveCanvasDrag(), null)

  store.unmount()
})

function normalized() {
  return normalizeDoc(structuredClone(example))
}

function fakeMeasure(request) {
  const lines = String(request.text ?? '').split('\n')
  const lineHeight = (request.font?.size ?? 14) * (request.font?.lineHeight ?? 1.4)
  return {
    lines: lines.map((text) => ({ text, width: text.length * (request.font?.size ?? 14) * 0.55 })),
    width: Math.max(...lines.map((text) => text.length), 0) * (request.font?.size ?? 14) * 0.55,
    height: lines.length * lineHeight,
  }
}
