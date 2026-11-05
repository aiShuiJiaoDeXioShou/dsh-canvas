// @ts-nocheck
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { normalizeDoc } from '../src/shared/format.js'
import { buildScene } from '../src/client/editor/resolve.js'
import { layoutScene } from '../src/client/editor/layout.js'
import { buildSvg } from '../src/client/editor/export-svg.js'

const doc = normalizeDoc({
  format: 'dsh.canvas',
  version: 1,
  title: 'Path render',
  pages: [{
    id: 'p1',
    children: [{
      id: 'icon',
      type: 'path',
      name: 'Icon',
      x: 10,
      y: 20,
      width: 24,
      height: 24,
      d: 'M0 0h24v24H0z',
      fills: [{ type: 'solid', color: '#123456' }],
      strokes: [{ color: '#FFFFFF', width: 1, align: 'center' }],
    }],
  }],
})

test('path nodes resolve, lay out and export as SVG paths', async () => {
  const scene = buildScene(doc, { pageId: 'p1' })
  layoutScene(scene)
  assert.equal(scene.issues.length, 0)
  const node = scene.roots[0]
  assert.equal(node.type, 'path')
  assert.equal(node.cornerRadius, 0)
  assert.equal(node.d, 'M0 0h24v24H0z')
  const svg = await buildSvg(scene, { nodeKeys: ['icon'] })
  assert.match(svg, /<path d="M0 0h24v24H0z"/)
  assert.match(svg, /fill="#123456"/)
  assert.match(svg, /stroke="#FFFFFF"/)
})
