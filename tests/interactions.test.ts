import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildInteractionIndex, interactionPresentation, interactionScope } from '../src/shared/interactions.js'
import { computeConnectionGeometry, computeLiveConnectionSvgPath } from '../src/shared/interaction-geometry.js'
import { parsePathData } from '../src/shared/path/parse.js'
import { normalizeDoc } from '../src/shared/format.js'
import { CanvasStore } from '../src/client/store.js'
import { revealInteractionNode } from '../src/client/editor/interaction-navigation.js'
import { hitTestScene, interactionWireIntersectsRect, isInteractionWire, pointNearInteractionWire } from '../src/client/editor/hit-test.js'

const edge = (id: string, from: string, to: string, event: string, labelId?: string) => ({
  id, type: 'path', name: event, interaction: { from, to, event, ...(labelId ? { labelId } : {}) },
})
const shot = (id: string, screenshot = id, children: unknown[] = []) => ({
  id, name: id, type: 'frame', screenshot: { id: screenshot }, children,
})
const doc = {
  pages: [
    { id: 'page-1', children: [
      { id: 'container', type: 'frame', children: [
        shot('source', 'main', [{ id: 'source-image', type: 'rect', fills: [{ type: 'image', asset: 'assets/source.jpg' }] }]),
        shot('child'),
        edge('wire-arrow', 'source', 'child', '打开'),
        { id: 'wire-event', type: 'text', text: '打开' },
      ] },
      shot('copy', 'main'),
      shot('target'),
      edge('same-edge', 'source', 'target', '确认', 'explicit-label'),
      edge('via-copy', 'copy', 'target', '保存'),
      { id: 'explicit-label', type: 'text', text: '确认' },
      edge('unrelated-arrow', 'other', 'target', '取消'),
      { id: 'unrelated-event', type: 'text', name: '触发事件', text: '取消' },
      { id: 'other', type: 'rect' },
      edge('orphan', 'other', 'deleted', '丢失的页面'),
      { id: 'ordinary-path', type: 'path' },
    ] },
    { id: 'page-2', children: [
      shot('incoming'),
      edge('cross-page', 'incoming', 'source', '返回'),
    ] },
  ],
}

test('reads explicit and legacy event labels while ignoring orphan and decorative paths', () => {
  const index = buildInteractionIndex(doc)
  assert.equal(index.edges.length, 5)
  assert.equal(index.edges.find(edge => edge.id === 'wire-arrow')?.labelId, 'wire-event')
  assert.equal(index.edges.find(edge => edge.id === 'same-edge')?.labelId, 'explicit-label')
  assert.equal(index.wireIds.has('ordinary-path'), false)
})

test('selecting a screenshot child shows incoming and outgoing transitions, deduplicates target previews, and hides unrelated events', () => {
  const index = buildInteractionIndex(doc)
  const scope = interactionScope(index, ['source-image'])
  assert.deepEqual([...scope.ids], ['source'])
  assert.equal(scope.name, 'source')
  assert.equal(scope.anchorId, 'source')
  assert.deepEqual(scope.targets.find(target => target.id === 'target')?.events.map(event => event.text), ['确认'])
  assert.equal(scope.targets.find(target => target.id === 'incoming')?.events[0].direction, 'incoming')
  assert.deepEqual([...interactionPresentation(index, scope).hidden], ['via-copy', 'unrelated-arrow', 'unrelated-event'])
  assert.ok(interactionPresentation(index, scope).emphasized.has('wire-event'))
})

test('copies sharing screenshot metadata keep independent incoming edges and preview destinations', () => {
  const index = buildInteractionIndex(doc)
  assert.deepEqual(interactionScope(index, ['copy']).edges.map(e => e.id), ['via-copy'])
  const siblings = interactionScope(index, ['target']).targets
  assert.deepEqual(siblings.map(t => t.key), ['source', 'copy', 'other'])
  assert.equal(siblings[0].events[0].text, '确认')
  assert.equal(siblings[1].events[0].text, '保存')
  const local = buildInteractionIndex({ pages: [{ id: 'p', children: [
    shot('one', 'same'), shot('two', 'same'), shot('unconnected', 'same'),
    edge('between', 'one', 'two', '继续'),
  ] }] })
  assert.deepEqual(interactionScope(local, ['one']).targets.map(t => t.id), ['two'])
  assert.deepEqual(interactionScope(local, ['unconnected']).edges, [])
})

test('container scope keeps its internal and crossing transitions without sweeping in separate copies', () => {
  const original = structuredClone(doc)
  const index = buildInteractionIndex(doc)
  const scope = interactionScope(index, ['container'])
  assert.deepEqual(scope.edges.map(edge => edge.id), ['wire-arrow', 'same-edge', 'cross-page'])
  assert.equal(scope.targets.find(target => target.id === 'source')?.previewAsset, 'assets/source.jpg')
  assert.equal(interactionScope(index, ['ordinary-path']).edges.length, 0)
  assert.deepEqual(doc, original)
})

test('hidden connectors cannot intercept canvas selection', () => {
  const shape = { key: 'shape', type: 'rect', absX: 0, absY: 0, width: 30, height: 30 }
  const wire = { ...shape, key: 'wire', type: 'path' }
  const scene = { roots: [shape, wire] }
  assert.equal(hitTestScene(scene, { x: 10, y: 10 }).key, 'wire')
  assert.equal(hitTestScene(scene, { x: 10, y: 10 }, { ignoredKeys: new Set(['wire']) }).key, 'shape')
})

test('preview navigation centers each target without selecting it or modifying the focus anchor', () => {
  const positions = [
    { key: 'source', absX: 8, absY: 9, width: 15, height: 20, rotation: 0 },
    { key: 'incoming', absX: 200, absY: 500, width: 15, height: 20, rotation: 0 },
  ]
  const state = { pageId: 'page-1', selection: ['source'], focus: { id: 'source', pageId: 'page-1' } }
  const centerings: number[] = []
  const publishedPages: string[] = []
  const store = {
    state,
    set(patch: { pageId: string }) { Object.assign(state, patch) },
    rebuild() {},
    emit() { publishedPages.push(state.pageId) },
    findSceneNode(id: string) {
      const entry = positions[state.pageId === 'page-1' ? 0 : 1]
      return entry.key === id ? entry : null
    },
    zoomToRect(rect: { x: number }) { centerings.push(rect.x) },
  }
  assert.equal(revealInteractionNode(store, { id: 'incoming', pageId: 'page-2' }), true)
  assert.equal(state.pageId, 'page-2')
  assert.deepEqual(state.selection, ['source'])
  assert.deepEqual(state.focus, { id: 'source', pageId: 'page-1' })
  assert.equal(revealInteractionNode(store, { id: 'missing', pageId: 'page-1' }), false)
  assert.equal(state.pageId, 'page-2')
  assert.equal(revealInteractionNode(store, state.focus), true)
  assert.deepEqual(centerings, [200, 8])
  assert.deepEqual(publishedPages, ['page-2', 'page-2', 'page-1'])
})

test('computeConnectionGeometry builds a valid SVG Bezier path with arrowhead and midpoint label', () => {
  const geom = computeConnectionGeometry(
    { x: 0, y: 100, width: 300, height: 600 },
    { x: 420, y: 100, width: 300, height: 600 },
  )
  assert.ok(geom.width > 120 && geom.height >= 24)
  assert.equal(geom.start.x, 300)
  assert.equal(geom.end.x, 420)
  const parsed = parsePathData(geom.d)
  assert.ok(parsed.commands >= 5)
  const live = computeLiveConnectionSvgPath({ x: 10, y: 20 }, { x: 180, y: 90 })
  assert.match(live, /^M 10 20 C /)
})

test('CanvasStore creates, edits, re-routes on move, and deletes interactive flow connectors', () => {
  const store = new CanvasStore({ sessionId: 'ix-crud', inputActions: null, onToast: undefined })
  store.applyState({
    doc: {
      pages: [{
        id: 'p1',
        name: '画布 1',
        children: [
          {
            id: 'screen-a',
            type: 'frame',
            name: '登录页',
            x: 0,
            y: 0,
            width: 390,
            height: 844,
            children: [
              { id: 'btn-login', type: 'rect', name: '登录按钮', x: 40, y: 400, width: 310, height: 48 },
            ],
          },
          {
            id: 'screen-b',
            type: 'frame',
            name: '首页',
            x: 520,
            y: 0,
            width: 390,
            height: 844,
            children: [],
          },
        ],
      }],
    },
  })
  store.queueSelectionPost = () => {}
  store.scheduleSave = () => {}

  const created = store.createInteraction('btn-login', 'screen-b', '点击登录')
  assert.ok(created?.wireId && created?.labelId)
  // Document with created wire + label must pass full Host schema normalization
  assert.doesNotThrow(() => normalizeDoc(store.state.doc))

  const index1 = buildInteractionIndex(store.state.doc)
  assert.equal(index1.edges.length, 1)
  assert.equal(index1.edges[0].from, 'btn-login')
  assert.equal(index1.edges[0].to, 'screen-b')
  assert.equal(index1.edges[0].event, '点击登录')
  assert.equal(index1.edges[0].labelId, created.labelId)

  // Update event text updates both wire metadata and canvas text label
  assert.equal(store.updateInteractionEvent(created.wireId, '验证通过跳转'), true)
  const index2 = buildInteractionIndex(store.state.doc)
  assert.equal(index2.edges[0].event, '验证通过跳转')
  const labelNode = store.state.doc.pages[0].children.find((n: any) => n.id === created.labelId)
  assert.equal(labelNode?.text, '验证通过跳转')

  // Moving screen-b and syncing wires updates wire geometry
  const wireBefore = store.state.doc.pages[0].children.find((n: any) => n.id === created.wireId)
  const oldWidth = wireBefore.width
  store.updateNode('screen-b', { x: 800 })
  store.syncConnectedWires(['screen-b'])
  const wireAfter = store.state.doc.pages[0].children.find((n: any) => n.id === created.wireId)
  assert.ok(wireAfter.width > oldWidth, 'wire should stretch when destination screen moves right')

  // Deleting removes both wire and paired label
  assert.equal(store.deleteInteraction(created.wireId), true)
  const index3 = buildInteractionIndex(store.state.doc)
  assert.equal(index3.edges.length, 0)
  assert.equal(store.state.doc.pages[0].children.some((n: any) => n.id === created.labelId), false)
})

test('cross-row interaction wire hit-testing uses actual path segments and yields to design nodes', () => {
  // Large L/U-shaped orthogonal wire spanning from (900, 100) down to y=900 and left to x=100,
  // whose giant bounding box (100..900, 100..900) covers an unrelated middle screen.
  const screenMid = {
    key: 'screen-mid',
    type: 'frame',
    absX: 300,
    absY: 200,
    width: 390,
    height: 600,
    children: [
      { key: 'btn-mid', type: 'rect', absX: 340, absY: 400, width: 120, height: 48, children: [] },
    ],
  }
  const crossRowWire = {
    key: 'wire-cross-row',
    type: 'path',
    absX: 100,
    absY: 100,
    width: 800,
    height: 800,
    viewBox: { x: 0, y: 0, width: 800, height: 800 },
    d: 'M 800 0 L 800 800 L 0 800',
    strokes: [{ color: '#4D6BFE', width: 2 }],
    sourceNode: { interaction: { from: 'screen-a', to: 'screen-b', event: '跨行跳转' } },
  }
  // Place wire AFTER screenMid in z-order (just like top-level connectors on top of screens)
  const scene = { roots: [screenMid, crossRowWire] }

  assert.equal(isInteractionWire(crossRowWire), true)
  // Empty interior of the huge bounding box must NOT hit the wire
  assert.equal(hitTestScene(scene, { x: 200, y: 300 }), null)
  assert.equal(pointNearInteractionWire(crossRowWire, { x: 200, y: 300 }), false)
  // Design nodes inside the wire's huge bounding box must win cleanly
  assert.equal(hitTestScene(scene, { x: 380, y: 420 })?.key, 'btn-mid')
  assert.equal(hitTestScene(scene, { x: 320, y: 240 })?.key, 'screen-mid')
  // Clicking directly on the wire's actual stroke in open space hits the wire
  assert.equal(hitTestScene(scene, { x: 900, y: 500 })?.key, 'wire-cross-row')
  assert.equal(hitTestScene(scene, { x: 500, y: 900 })?.key, 'wire-cross-row')
  // Even if a screen sits directly under the wire segment, the design node takes priority
  const overlapScreen = { key: 'screen-overlap', type: 'frame', absX: 450, absY: 860, width: 100, height: 80, children: [] }
  assert.equal(hitTestScene({ roots: [overlapScreen, crossRowWire] }, { x: 500, y: 900 })?.key, 'screen-overlap')
  // Marquee over the empty interior must NOT select the wire; marquee crossing the stroke DOES
  assert.equal(interactionWireIntersectsRect(crossRowWire, { x: 200, y: 200, width: 300, height: 300 }), false)
  assert.equal(interactionWireIntersectsRect(crossRowWire, { x: 450, y: 880, width: 100, height: 40 }), true)
})

test('curved Bezier interaction wire hits along the curve without capturing bounding-box corners', () => {
  const geom = computeConnectionGeometry(
    { x: 0, y: 100, width: 300, height: 400 },
    { x: 500, y: 600, width: 300, height: 400 },
  )
  const wire = {
    key: 'bezier-wire',
    type: 'path',
    absX: geom.x,
    absY: geom.y,
    width: geom.width,
    height: geom.height,
    viewBox: geom.viewBox,
    d: geom.d,
    strokes: [{ color: '#4D6BFE', width: 2 }],
    sourceNode: { interaction: { from: 'a', to: 'b', event: '跳转' } },
  }
  // Midpoint of cubic S-curve lies directly on the curve
  assert.equal(pointNearInteractionWire(wire, { x: (geom.start.x + geom.end.x) / 2, y: (geom.start.y + geom.end.y) / 2 }), true)
  // Far off-diagonal corner of the bounding box is empty space and must not hit
  assert.equal(pointNearInteractionWire(wire, { x: geom.x + 8, y: geom.y + geom.height - 8 }), false)
})
