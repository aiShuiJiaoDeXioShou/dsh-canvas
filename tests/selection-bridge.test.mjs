import assert from 'node:assert/strict'
import { test } from 'node:test'

import { announceCanvasSelection, dismissCanvasSelection, readCanvasSelection } from '../src/client/selection-bridge.js'

test('the selection bridge stores one selection per session and dismisses it', () => {
  assert.equal(readCanvasSelection('s1'), null)
  announceCanvasSelection({ sessionId: 's1', doc: 'main', node: 'title', label: 'Title' })
  announceCanvasSelection({ sessionId: 's2', doc: 'other', node: 'btn', label: 'Button' })
  assert.equal(readCanvasSelection('s1').node, 'title')
  assert.equal(readCanvasSelection('s2').doc, 'other')
  announceCanvasSelection({ sessionId: 's1', doc: 'main', node: 'subtitle', label: 'Subtitle' })
  assert.equal(readCanvasSelection('s1').node, 'subtitle')
  dismissCanvasSelection('s1')
  assert.equal(readCanvasSelection('s1'), null)
  assert.equal(readCanvasSelection('s2').node, 'btn')
  dismissCanvasSelection('s2')
})
