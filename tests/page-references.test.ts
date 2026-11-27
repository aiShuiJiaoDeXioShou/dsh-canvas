import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeDoc } from '../src/shared/format.js'
import { buildInteractionIndex, interactionScope } from '../src/shared/interactions.js'
import { describeInteractions } from '../src/host/interaction-tools.js'
import { CanvasStore } from '../src/client/store.js'

const picture = (id: string, pageRef?: string) => ({ id, type: 'rect', screenshot: { id: 'same' }, pageRef })
const wire = (id: string, from: string, to: string) => ({
  id, type: 'line', interaction: { id: 'event-' + id, from, to, event: id },
})
function documentWith(nodes: unknown[]) {
  return normalizeDoc({ id: 'doc', pages: [{ id: 'p', children: nodes }] })
}

test('focus expands explicit placements, keeps exact wire endpoints and excludes unrelated reuse', () => {
  const doc = documentWith([
    picture('original'), picture('second', 'original'), picture('unused', 'original'), picture('unrelated'),
    picture('a'), picture('b'), wire('first', 'original', 'a'), wire('next', 'second', 'b'),
    wire('back', 'a', 'second'), wire('other', 'unrelated', 'b'),
  ])
  const index = buildInteractionIndex(doc)
  for (const id of ['original', 'second', 'unused']) {
    const scope = interactionScope(index, [id])
    assert.equal(scope.anchorId, id)
    assert.deepEqual(scope.edges.map(edge => edge.id), ['first', 'next', 'back'])
    assert.equal(scope.targets.find(t => t.id === 'a')?.events.length, 2)
  }
  const output = describeInteractions(doc, { ids: ['unused'] })
  assert.equal(output.anchor?.sourceNodeId, 'original')
  assert.equal(output.connections[1].interactionId, 'event-next')
  assert.equal(output.connections[1].from.nodeId, 'second')
  assert.equal(output.connections[1].to.nodeId, 'b')
})

test('invalid references and source deletion have deterministic results on save', () => {
  assert.throws(() => documentWith([picture('x', 'x')]))
  assert.throws(() => documentWith([picture('x', 'y'), picture('y', 'x')]))
  assert.throws(() => documentWith([picture('x', 'y'), picture('y', 'z'), picture('z')]))
  const doc = documentWith([picture('a', 'missing')])
  assert.equal(doc.pages[0].children[0].pageRef, undefined)
})

test('creating from a reference points directly to its source and undo removes only the new placement', () => {
  const doc = documentWith([picture('original'), picture('second', 'original')])
  const store = new CanvasStore({ sessionId: 'refs', inputActions: null, onToast: undefined })
  store.applyState({ doc }, { resetHistory: true })
  store.scheduleSave = () => {}
  store.queueSelectionPost = () => {}
  store.setSelection(['second'])
  const copy = store.createPageReference()
  assert.ok(copy)
  assert.equal(copy.pageRef, 'original')
  assert.notEqual(copy.id, 'second')
  assert.ok(copy.x > 0)
  assert.equal(store.state.primaryKey, copy.id)
  store.undo()
  assert.equal(store.findSceneNode(copy.id), null)
  assert.ok(store.findSceneNode('second'))
})

test('a frame reference includes source child interactions and leaves external reuse independent', () => {
  const doc = documentWith([
    { id: 'frame', type: 'frame', children: [picture('child')] },
    { id: 'placement', type: 'frame', pageRef: 'frame', children: [] },
    picture('screen'), wire('open', 'child', 'screen'),
  ])
  const scope = interactionScope(buildInteractionIndex(doc), ['placement'])
  assert.equal(scope.anchorId, 'placement')
  assert.deepEqual(scope.edges.map(edge => edge.id), ['open'])
  assert.deepEqual(scope.placements, ['frame', 'placement'])
})

test('registered tools expose physical and logical IDs and report when a live view is unavailable', async () => {
  const { mkdtemp, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { apply } = await import('../src/host/main.js')
  const cwd = await mkdtemp(join(tmpdir(), 'dsh-reference-'))
  const tools = new Map()
  const dispose = apply({
    tools: { register(tool) { tools.set(tool.name, tool); return () => tools.delete(tool.name) } },
    webServer: { register: () => () => {} }, get: () => undefined,
    workingDirectory: { ensure: async () => cwd },
  })
  const exec = { agent: { id: 'reference-test' } }
  try {
    const doc = documentWith([picture('main'), picture('copy', 'main'), picture('target'), wire('go', 'copy', 'target')])
    await tools.get('canvas_write').execute({ name: 'refs', doc }, exec)
    const detail = await tools.get('canvas_read').execute({ name: 'refs', detail: 'interactions', nodeId: 'main' }, exec)
    assert.deepEqual(detail.placementIds, ['main', 'copy'])
    assert.equal(detail.connections[0].from.nodeId, 'copy')
    assert.equal(detail.connections[0].from.sourceNodeId, 'main')
    const live = await tools.get('canvas_interaction_view').execute({ name: 'refs', action: 'focus', nodeId: 'copy' }, exec)
    assert.equal(live.error, 'no-live-canvas')
  } finally {
    dispose()
    await rm(cwd, { recursive: true, force: true })
  }
})
