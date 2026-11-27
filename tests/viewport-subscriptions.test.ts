import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CanvasStore } from '../src/client/store.js'

test('camera movement updates viewport subscribers independently of editor panels', () => {
  const store = new CanvasStore({ sessionId: 'viewport', inputActions: null, onToast: undefined })
  let cameraUpdates = 0
  let editorUpdates = 0
  const offCamera = store.subscribeViewport(() => { cameraUpdates++ })
  const offEditor = store.subscribe(() => { editorUpdates++ })

  store.setViewport({ x: -100, y: 250, zoom: 0.04 })
  store.setViewport({ ...store.getViewport() })
  assert.equal(store.getZoomPercentage(), 4)
  store.zoomAt({ x: 0, y: 0 }, 2)
  assert.deepEqual(store.getViewport(), { x: -200, y: 500, zoom: 0.08 })
  store.zoomToRect({ x: 500, y: 600, width: 300, height: 200 })
  assert.equal(cameraUpdates, 3)
  assert.equal(editorUpdates, 0)

  store.setPanel('fonts')
  assert.equal(editorUpdates, 1)
  assert.equal(cameraUpdates, 3)
  store.set({ viewport: { x: 40, y: 40, zoom: 1 } })
  assert.equal(store.getZoomPercentage(), 100)
  assert.equal(cameraUpdates, 4)
  offCamera()
  offEditor()
  store.zoomAt({ x: 50, y: 60 }, 2)
  assert.equal(cameraUpdates, 4)
})

test('fit frames the exact nested selection, all selected bounds, or the page when cleared', () => {
  const store = new CanvasStore({ sessionId: 'fit', inputActions: null, onToast: undefined })
  store.applyState({ doc: { pages: [{ id: 'review', children: [{
    id: 'board', type: 'frame', x: 1000, y: 500, width: 4000, height: 2000,
    children: [
      { id: 'source', type: 'rect', x: 100, y: 200, width: 100, height: 200 },
      { id: 'ref', type: 'rect', pageRef: 'source', x: 500, y: 200, width: 100, height: 200 },
    ],
  }] }] } })
  store.canvasSize = { width: 900, height: 600 }
  store.queueSelectionPost = () => {}
  function checkSelection(ids: string[], zoom: number, centerX: number, centerY: number) {
    store.setSelection(ids)
    store.zoomToSelection(0)
    assert.deepEqual(store.getViewport(), { zoom, x: 450 - centerX * zoom, y: 300 - centerY * zoom })
    assert.deepEqual(store.state.selection, ids)
  }
  checkSelection(['ref'], 3, 1550, 800)
  checkSelection(['source', 'ref'], 1.8, 1350, 800)
  // zoomToFit always fits the entire canvas page even when nodes are selected.
  store.setSelection(['ref'])
  store.zoomToFit(0)
  assert.deepEqual(store.getViewport(), { zoom: 0.225, x: 450 - 3000 * 0.225, y: 300 - 1500 * 0.225 })
  assert.deepEqual(store.state.selection, ['ref'])
  checkSelection([], 0.225, 3000, 1500)
})
