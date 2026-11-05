import assert from 'node:assert/strict'
import { test } from 'node:test'

import { normalizeDoc } from '../lib/format.js'
import { buildScene } from '../src/client/editor/resolve.js'
import { layoutScene } from '../src/client/editor/layout.js'
import { DEFAULT_DESIGN_SYSTEM, DESIGN_SYSTEMS, DESIGN_SYSTEM_PROMPT, designSystemStyles, getDesignSystem } from '../lib/design-system.js'
import { TEMPLATE_LIST, instantiateTemplate, listTemplates } from '../lib/templates.js'

function normalizeTemplate(id) {
  const { node } = instantiateTemplate(id)
  return normalizeDoc({ format: 'dsh.canvas', version: 1, title: 'Template test', pages: [{ id: 'page-1', children: [node] }] })
}

function collect(node) {
  const out = []
  const visit = (current) => {
    out.push(current)
    for (const child of current.children ?? []) visit(child)
  }
  visit(node)
  return out
}

for (const template of TEMPLATE_LIST) {
  test(`template ${template.id} normalizes and lays out`, () => {
    const doc = normalizeTemplate(template.id)
    const root = doc.pages[0].children[0]
    assert.equal(root.type, 'frame')
    assert.equal(root.name, template.name)
    assert.equal(root.width, template.width)
    assert.equal(root.height, template.height)
    const ids = new Set()
    for (const node of collect(root)) {
      assert.equal(ids.has(node.id), false, `duplicate id ${node.id}`)
      ids.add(node.id)
    }
    const scene = buildScene(doc, { pageId: 'page-1' })
    layoutScene(scene)
    assert.equal(scene.issues.length, 0, scene.issues.join('\n'))
    assert.equal(scene.roots.length, 1)
  })
}

test('the iOS screen includes a status bar, tab bar and home indicator', () => {
  const doc = normalizeTemplate('ios-screen')
  const root = doc.pages[0].children[0]
  const nodes = collect(root)
  assert.ok(nodes.some((node) => node.type === 'text' && node.text === '9:41'))
  assert.ok(nodes.some((node) => node.name === 'Dynamic Island'))
  assert.ok(nodes.some((node) => node.name === 'Home Indicator'))
  assert.ok(nodes.some((node) => node.type === 'text' && node.text === 'Settings'))
  assert.ok(nodes.some((node) => node.type === 'text' && node.text === 'Search settings'))
  assert.equal(nodes.filter((node) => node.type === 'text' && node.text === '9:41').length, 1)
})

test('each instantiation regenerates unique ids', () => {
  const first = instantiateTemplate('ios-status-bar').node
  const second = instantiateTemplate('ios-status-bar').node
  assert.notEqual(first.id, second.id)
  const firstIds = collect(first).map((node) => node.id)
  const secondIds = collect(second).map((node) => node.id)
  assert.equal(firstIds.some((id) => secondIds.includes(id)), false)
})

test('unknown templates are rejected and list metadata is stable', () => {
  assert.throws(() => instantiateTemplate('nope'), /unknown canvas template/)
  const list = listTemplates()
  assert.equal(list.length, TEMPLATE_LIST.length)
  assert.deepEqual(list.map((entry) => entry.id), TEMPLATE_LIST.map((entry) => entry.id))
})

test('design-system style libraries normalize into a document', () => {
  for (const id of ['material3', 'ios']) {
    const styles = designSystemStyles(id)
    assert.ok(styles.length >= 10)
    const doc = normalizeDoc({
      format: 'dsh.canvas',
      version: 1,
      title: 'Styles',
      pages: [{ id: 'p1', children: [] }],
      styles,
    })
    assert.equal(doc.styles.length, styles.length)
    assert.equal(new Set(doc.styles.map((style) => style.id)).size, styles.length)
    assert.ok(doc.styles.some((style) => style.type === 'fill'))
    assert.ok(doc.styles.some((style) => style.type === 'text'))
    assert.ok(doc.styles.some((style) => style.type === 'effect'))
  }
  assert.ok(designSystemStyles('material3').some((style) => style.name.includes('M3/Type')))
  assert.ok(designSystemStyles('ios').some((style) => style.name === 'iOS/Color/Blue'))
})

test('the built-in design systems expose the expected defaults', () => {
  assert.equal(DEFAULT_DESIGN_SYSTEM, 'material3')
  assert.equal(getDesignSystem().name, 'Material Design 3')
  assert.equal(getDesignSystem('ios').name, 'Apple Human Interface Guidelines')
  assert.equal(DESIGN_SYSTEMS.material3.colors.primary, '#6750A4')
  assert.equal(DESIGN_SYSTEMS.ios.metrics.statusBarHeight, 54)
  assert.equal(DESIGN_SYSTEMS.ios.metrics.tabBarHeight, 49)
  assert.match(DESIGN_SYSTEM_PROMPT, /Material Design 3/)
  assert.match(DESIGN_SYSTEM_PROMPT, /Human Interface Guidelines/)
})
