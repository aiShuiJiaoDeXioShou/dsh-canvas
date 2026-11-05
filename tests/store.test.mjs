import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test, afterEach } from 'node:test'

import { CanvasStore } from '../src/client/store.js'
import { buildSelectionMenu } from '../src/client/ui/selection-menu.js'
import { normalizeDoc } from '../lib/format.js'
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
      path: `canvas/${activeName}.canvas.json`,
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
    return jsonResponse({ ok: true, name: body.to, path: `canvas/${body.to}.canvas.json`, revision: 'rev-renamed', docs: [] })
  }
  if (text.includes('/dsh-canvas/api/doc') && options.method === 'PUT') {
    savedDoc = JSON.parse(options.body).doc
    return jsonResponse({ ok: true, name: 'main', path: 'canvas/main.canvas.json', revision: 'rev-2', stats: {} })
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
  assert.equal(store.state.path, 'canvas/renamed-canvas.canvas.json')
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
