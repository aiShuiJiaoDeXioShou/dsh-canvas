import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import {
  CanvasError,
  emptyDoc,
  findNodeInDoc,
  normalizeDoc,
  outlineDoc,
  LIMITS,
} from '../lib/format.js'
import { applyOps, addComment, replyComment, resolveComment } from '../lib/ops.js'

const example = JSON.parse(await readFile(new URL('../examples/login.canvas.json', import.meta.url), 'utf8'))

test('example document normalizes and keeps references', () => {
  const doc = normalizeDoc(example)
  assert.equal(doc.format, 'dsh.canvas')
  assert.equal(doc.version, 1)
  assert.equal(doc.pages.length, 1)
  assert.equal(doc.components.length, 1)
  assert.equal(doc.styles.length, 2)
  assert.equal(doc.comments.length, 1)
  const instance = findNodeInDoc(doc, 'btn-instance')
  assert.ok(instance)
  assert.equal(instance.node.type, 'instance')
  assert.equal(instance.node.overrides['btn-label'].text, 'Sign in')
  const outline = outlineDoc(doc, { selection: ['btn-instance'] })
  assert.equal(outline.stats.nodes, 11)
  assert.equal(outline.stats.unresolvedComments, 1)
  assert.deepEqual(outline.selection, ['btn-instance'])
  assert.equal(outline.components[0].id, 'cmp-button')
  assert.equal(outline.styles[0].name, 'Brand/Primary')
})

test('normalization fills defaults and preserves unknown fields', () => {
  const doc = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    title: 'T',
    pages: [{ id: 'p1', children: [{ id: 'n1', type: 'rect', futureFlag: { a: 1 } }] }],
    extraTop: 7,
  })
  assert.equal(doc.extraTop, 7)
  const node = doc.pages[0].children[0]
  assert.equal(node.width, 120)
  assert.equal(node.height, 120)
  assert.equal(node.rotation, 0)
  assert.equal(node.opacity, 1)
  assert.equal(node.visible, true)
  assert.deepEqual(node.futureFlag, { a: 1 })
  assert.deepEqual(node.fills, [{ type: 'solid', color: '#D9D9D9' }])
})

test('text gets a readable default fill and auto height', () => {
  const doc = normalizeDoc({
    pages: [{ id: 'p1', children: [{ id: 't1', type: 'text', text: 'Hi' }] }],
  })
  const node = doc.pages[0].children[0]
  assert.deepEqual(node.fills, [{ type: 'solid', color: '#111111' }])
  assert.equal(node.autoHeight, true)
  assert.equal(node.font.size, 14)
})

test('duplicate ids are rejected', () => {
  assert.throws(
    () =>
      normalizeDoc({
        pages: [
          {
            id: 'p1',
            children: [
              { id: 'x', type: 'rect' },
              { id: 'x', type: 'rect' },
            ],
          },
        ],
      }),
    (error) => error instanceof CanvasError && /duplicate id/.test(error.message),
  )
})

test('invalid geometry, color and enum are rejected', () => {
  const cases = [
    { id: 'a', type: 'rect', width: -1 },
    { id: 'a', type: 'rect', x: Number.POSITIVE_INFINITY },
    { id: 'a', type: 'rect', fills: [{ type: 'solid', color: 'red' }] },
    { id: 'a', type: 'text', align: 'middle' },
    { id: 'a', type: 'instance', componentId: 'nope' },
    { id: 'a', type: 'wat' },
  ]
  for (const node of cases) {
    assert.throws(
      () => normalizeDoc({ pages: [{ id: 'p1', children: [node] }] }),
      (error) => error instanceof CanvasError,
      JSON.stringify(node),
    )
  }
})

test('image fills validate assets and crop bounds', () => {
  const ok = normalizeDoc({
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'img',
            type: 'rect',
            fills: [{ type: 'image', asset: 'assets/photo.png', fit: 'cover', crop: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 } }],
          },
        ],
      },
    ],
  })
  assert.equal(ok.pages[0].children[0].fills[0].crop.width, 0.5)
  for (const asset of ['../etc/passwd', 'assets/../x.png', 'assets/x.png?q=1']) {
    assert.throws(
      () =>
        normalizeDoc({
          pages: [{ id: 'p1', children: [{ id: 'img', type: 'rect', fills: [{ type: 'image', asset }] }] }],
        }),
      CanvasError,
      asset,
    )
  }
  assert.throws(
    () =>
      normalizeDoc({
        pages: [
          { id: 'p1', children: [{ id: 'img', type: 'rect', fills: [{ type: 'image', asset: 'assets/x.png', crop: { x: 0.8, width: 0.5, height: 1 } }] }] },
        ],
      }),
    /crop must stay inside/,
  )
})

test('component references, variant properties and overrides are checked', () => {
  assert.throws(
    () =>
      normalizeDoc({
        pages: [{ id: 'p1', children: [{ id: 'i1', type: 'instance', componentId: 'missing' }] }],
      }),
    /unknown component/,
  )
  const base = {
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'i1',
            type: 'instance',
            componentId: 'c1',
            overrides: { nope: { text: 'x' } },
          },
        ],
      },
    ],
    components: [{ id: 'c1', name: 'C', root: { id: 'r1', type: 'frame', children: [{ id: 'c-label', type: 'text', text: 'A' }] } }],
  }
  assert.throws(() => normalizeDoc(base), /override targets an unknown node/)
})

test('style references must exist and match their type', () => {
  const doc = {
    pages: [{ id: 'p1', children: [{ id: 'r1', type: 'rect', fillStyleId: 's1' }] }],
    styles: [{ id: 's1', type: 'text', name: 'T', value: { font: {}, fills: [] } }],
  }
  assert.throws(() => normalizeDoc(doc), /expected fill/)
})

test('comments reference real pages and nodes', () => {
  assert.throws(
    () =>
      normalizeDoc({
        pages: [{ id: 'p1', children: [] }],
        comments: [{ id: 'c1', pageId: 'nope', body: 'x' }],
      }),
    /unknown page/,
  )
  assert.throws(
    () =>
      normalizeDoc({
        pages: [{ id: 'p1', children: [] }],
        comments: [{ id: 'c1', pageId: 'p1', nodeId: 'nope', body: 'x' }],
      }),
    /unknown node/,
  )
})

test('document limits fail closed', () => {
  const deep = { id: 'leaf', type: 'rect' }
  let root = deep
  for (let index = 0; index < LIMITS.depth + 2; index += 1) {
    root = { id: `d${index}`, type: 'frame', children: [root] }
  }
  assert.throws(() => normalizeDoc({ pages: [{ id: 'p1', children: [root] }] }), /nesting exceeds/)
})

test('empty document is valid and has one page', () => {
  const doc = normalizeDoc(emptyDoc('Untitled'))
  assert.equal(doc.pages.length, 1)
  assert.equal(doc.pages[0].children.length, 0)
  assert.equal(doc.format, 'dsh.canvas')
})

test('applyOps adds, updates, moves and removes nodes', () => {
  const doc = normalizeDoc(emptyDoc('Ops'))
  applyOps(doc, [
    { op: 'add', node: { id: 'f1', type: 'frame', width: 300, height: 300 } },
    { op: 'add', parent: 'f1', node: { id: 'r1', type: 'rect', x: 10, y: 10 } },
    { op: 'update', id: 'r1', patch: { x: 24, fills: [{ type: 'solid', color: '#FF0000' }] } },
    { op: 'add', pageId: doc.pages[0].id, node: { id: 'r2', type: 'ellipse' } },
    { op: 'move', id: 'r2', parent: 'f1', index: 0 },
  ])
  assert.equal(doc.pages[0].children[0].id, 'f1')
  assert.deepEqual(doc.pages[0].children[0].children.map((n) => n.id), ['r2', 'r1'])
  assert.equal(doc.pages[0].children[0].children[1].x, 24)
  applyOps(doc, [{ op: 'remove', id: 'r2' }])
  assert.equal(doc.pages[0].children[0].children.length, 1)
  assert.equal(normalizeDoc(doc).pages[0].children[0].children.length, 1)
})

test('applyOps generates ids for AI-supplied trees without ids', () => {
  const doc = normalizeDoc(emptyDoc('Ids'))
  applyOps(doc, [
    {
      op: 'add',
      node: { type: 'frame', children: [{ type: 'rect' }] },
    },
  ])
  const frame = doc.pages[0].children[0]
  assert.match(frame.id, /^n_/)
  assert.match(frame.children[0].id, /^n_/)
  assert.doesNotThrow(() => normalizeDoc(doc))
})

test('applyOps rejects unknown parents and operations with an op index', () => {
  const doc = normalizeDoc(emptyDoc('Bad'))
  assert.throws(() => applyOps(doc, [{ op: 'add', parent: 'nope', node: { id: 'x', type: 'rect' } }]), /\$\.ops\[0\]/)
  assert.throws(() => applyOps(doc, [{ op: 'wat' }]), /\$\.ops\[0\]/)
})

test('comment operations work and outline reports them', () => {
  const doc = normalizeDoc(emptyDoc('Comments'))
  const comment = addComment(doc, { body: 'First' })
  replyComment(doc, comment.id, 'Reply', 'ai')
  const normalized = normalizeDoc(doc)
  const outline = outlineDoc(normalized)
  assert.equal(outline.stats.unresolvedComments, 1)
  assert.equal(outline.comments[0].replyCount, 1)
  resolveComment(doc, comment.id, true)
  assert.equal(outlineDoc(normalizeDoc(doc)).stats.unresolvedComments, 0)
})

test('set op replaces style collections and validates them', () => {
  const doc = normalizeDoc(emptyDoc('Styles'))
  applyOps(doc, [
    { op: 'set', key: 'styles', value: [{ id: 's1', type: 'fill', name: 'A', value: { type: 'solid', color: '#112233' } }] },
  ])
  const normalized = normalizeDoc(doc)
  assert.equal(normalized.styles.length, 1)
  assert.throws(
    () => applyOps(doc, [{ op: 'set', key: 'styles', value: [{ id: 's1', type: 'wat' }] }]) && normalizeDoc(doc),
    CanvasError,
  )
})
