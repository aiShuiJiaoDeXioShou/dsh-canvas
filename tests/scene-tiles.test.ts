import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SceneTiles } from '../src/client/editor/scene-tiles.js'
import { buildScene } from '../src/client/editor/resolve.js'
import { emptyDoc, normalizeDoc } from '../src/shared/format.js'

const rect = (key: string, absX: number) => ({ key, absX, absY: 0, width: 10, height: 10, type: 'rect' })
const size = { width: 200, height: 100 }
const view = { x: 0, y: 0, zoom: 1 }

test('viewport tiles retain overflowing children, their ancestors, paint order and crossing paths', () => {
  const children = [rect('first', -10), rect('distant', 5000), rect('last', 20)]
  const parent = { ...rect('parent', 9000), children }
  const crossing = { ...rect('wire', -20000), width: 100000 }
  const path = { ...rect('path', 3000), type: 'path', d: 'M-3100 2H0' }
  const transformed = { ...rect('rotation', 1000), rotation: 90 }
  const tiles = new SceneTiles([parent, crossing, path, transformed])
  const result = tiles.query(view, size)
  assert.deepEqual(result.get(null)?.map(n => n.key), ['parent', 'wire', 'path', 'rotation'])
  assert.deepEqual(result.get('parent')?.map(n => n.key), ['first', 'last'])
  const moved = tiles.query({ ...view, x: -5000 }, size)
  assert.deepEqual(moved.get('parent')?.map(n => n.key), ['distant'])
  assert.equal(moved.get(null)?.some(n => n.key === 'path'), false)
})

test('more than 20,000 authored nodes survive normalization and scene resolution', () => {
  const doc = emptyDoc('Dense page')
  doc.pages[0].children = Array.from({ length: 20001 }, (_, i) => ({ id: 'r'+i, type: 'rect', x: i }))
  const normalized = normalizeDoc(doc)
  const scene = buildScene(normalized)
  assert.equal(scene.roots.length, 20001)
  assert.ok(scene.byKey.has('r20000'))
  assert.deepEqual(scene.issues, [])
})

test('instance expansion budget preserves later authored nodes', () => {
  const children = Array.from({ length: 201 }, (_, i) => ({ id: 'part'+i, type: 'rect' }))
  const instances = Array.from({ length: 100 }, (_, i) => ({ id: 'i'+i, type: 'instance', componentId: 'master' }))
  const doc = { pages: [{ id: 'p', children: [...instances, { id: 'end', type: 'rect' }] }],
    components: [{ id: 'master', root: { id: 'root', type: 'frame', children } }] }
  const scene = buildScene(doc)
  assert.equal(scene.byKey.size, 20101)
  assert.ok(scene.byKey.has('end'))
  assert.equal(scene.issues.length, 1)
})
