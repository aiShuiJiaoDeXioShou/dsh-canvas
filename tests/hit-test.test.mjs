import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { normalizeDoc } from '../lib/format.js'
import { buildScene } from '../src/client/editor/resolve.js'
import { layoutScene } from '../src/client/editor/layout.js'
import { hitTestScene } from '../src/client/editor/hit-test.js'

const example = JSON.parse(await readFile(new URL('../examples/login.canvas.json', import.meta.url), 'utf8'))

function scene() {
  const doc = normalizeDoc(structuredClone(example))
  const value = buildScene(doc, { pageId: 'page-1' })
  layoutScene(value)
  return value
}

test('hit testing returns the instance root, frame and text nodes', () => {
  const value = scene()
  assert.equal(hitTestScene(value, { x: 195, y: 527 })?.key, 'btn-instance')
  assert.equal(hitTestScene(value, { x: 100, y: 140 })?.key, 'login-title')
  assert.equal(hitTestScene(value, { x: 60, y: 300 })?.key, 'login-card')
  assert.equal(hitTestScene(value, { x: -20, y: -20 }), null)
})

test('entering an instance selects its inner nodes; deep hit remains raw', () => {
  const value = scene()
  const entered = hitTestScene(value, { x: 195, y: 527 }, { enteredInstance: 'btn-instance' })
  assert.equal(entered.key, 'btn-instance::btn-label')
  assert.equal(entered.instanceId, 'btn-instance')
  const deep = hitTestScene(value, { x: 195, y: 527 }, { deep: true })
  assert.equal(deep.key, 'btn-instance::btn-label')
})

test('group children select the group unless entered', () => {
  const value = scene()
  const frame = value.byKey.get('login-card')
  const group = {
    key: 'group-test',
    id: 'group-test',
    sourceId: 'group-test',
    type: 'group',
    name: 'Group',
    absX: 10,
    absY: 10,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    children: [
      {
        key: 'child-test',
        id: 'child-test',
        sourceId: 'child-test',
        type: 'rect',
        name: 'Child',
        absX: 20,
        absY: 20,
        width: 40,
        height: 40,
        rotation: 0,
        opacity: 1,
        visible: true,
        children: [],
        parent: null,
      },
    ],
    parent: null,
  }
  group.children[0].parent = group
  value.roots.push(group)
  assert.equal(hitTestScene(value, { x: 30, y: 30 })?.key, 'group-test')
})

test('locked and hidden nodes are not hit', () => {
  const value = scene()
  const title = value.byKey.get('login-title')
  title.locked = true
  assert.notEqual(hitTestScene(value, { x: 100, y: 140 })?.key, 'login-title')
  title.locked = false
  title.visible = false
  assert.notEqual(hitTestScene(value, { x: 100, y: 140 })?.key, 'login-title')
})
