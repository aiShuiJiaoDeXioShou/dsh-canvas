// @ts-nocheck
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { normalizeDoc } from '../src/shared/format.js'
import { parsePathData } from '../src/shared/path/index.js'

function pathDoc(node) {
  return {
    format: 'dsh.canvas',
    version: 1,
    title: 'Path test',
    pages: [{ id: 'p1', children: [{ id: 'p', type: 'path', name: 'P', width: 24, height: 24, ...node }] }],
  }
}

test('path parser handles absolute, relative, curves and close', () => {
  const parsed = parsePathData('M2 2h20v20H2z')
  assert.equal(parsed.commands > 0, true)
  assert.deepEqual(parsed.bounds, { minX: 0, minY: 0, maxX: 22, maxY: 22 })
  const relative = parsePathData('m 1 1 l 2 3 c 1 2 3 4 5 6 z')
  assert.equal(relative.bounds.maxX, 8)
})

test('path parser rejects invalid data', () => {
  assert.throws(() => parsePathData(''), /non-empty/)
  assert.throws(() => parsePathData('M 1'), /missing parameters/)
  assert.throws(() => parsePathData('X 1 2'), /unsupported characters/)
  assert.throws(() => parsePathData('M 1 2 L 3'), /missing parameters/)
})

test('normalizeDoc keeps path d/viewBox and rejects image fills', () => {
  const doc = normalizeDoc(pathDoc({ d: 'M0 0h24v24H0z', fills: [{ type: 'solid', color: '#FFFFFF' }] }))
  const node = doc.pages[0].children[0]
  assert.equal(node.type, 'path')
  assert.equal(node.d, 'M0 0h24v24H0z')
  assert.deepEqual(node.viewBox, { x: 0, y: 0, width: 24, height: 24 })
  assert.equal(node.fillRule, 'nonzero')
  assert.throws(() => normalizeDoc(pathDoc({ d: 'M0 0h24v24H0z', fills: [{ type: 'image', asset: 'assets/x.png' }] })), /image fills/)
})
