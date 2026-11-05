import assert from 'node:assert/strict'
import { test } from 'node:test'

import { normalizeDoc } from '../lib/format.js'
import { buildScene } from '../src/client/editor/resolve.js'
import { layoutScene } from '../src/client/editor/layout.js'

function fixture() {
  return normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    title: 'Instance radius',
    pages: [
      {
        id: 'p1',
        children: [
          { id: 'inherited', type: 'instance', name: 'Inherited', componentId: 'c1', x: 0, y: 0, width: 100, height: 40 },
          { id: 'overridden', type: 'instance', name: 'Overridden', componentId: 'c1', x: 0, y: 80, width: 100, height: 40, cornerRadius: 18 },
        ],
      },
    ],
    components: [
      {
        id: 'c1',
        name: 'Card',
        root: {
          id: 'c1-root',
          type: 'frame',
          name: 'Card',
          width: 100,
          height: 40,
          cornerRadius: 10,
          fills: [{ type: 'solid', color: '#FFFFFF' }],
          children: [],
        },
      },
    ],
  })
}

test('instance cornerRadius is preserved as an optional override', () => {
  const doc = fixture()
  const inherited = doc.pages[0].children.find((node) => node.id === 'inherited')
  const overridden = doc.pages[0].children.find((node) => node.id === 'overridden')
  assert.equal(inherited.cornerRadius, undefined)
  assert.equal(overridden.cornerRadius, 18)
})

test('instances inherit the component radius and honor an instance override', () => {
  const scene = buildScene(fixture(), { pageId: 'p1' })
  layoutScene(scene)
  assert.equal(scene.issues.length, 0)
  const inherited = scene.roots.find((node) => node.key === 'inherited')
  const overridden = scene.roots.find((node) => node.key === 'overridden')
  assert.equal(inherited.cornerRadius, 10)
  assert.equal(overridden.cornerRadius, 18)
})
