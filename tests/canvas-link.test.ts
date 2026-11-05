// @ts-nocheck
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { canvasLinkRule, formatCanvasLink, matchCanvasLink } from '../src/client/editor/canvas-link.js'

test('formats and matches a canvas link with node and page parameters', () => {
  const link = formatCanvasLink({ doc: 'main', node: 'login-title', page: 'page-1', label: '在画布中定位：Title' })
  assert.equal(link, '[在画布中定位：Title](dsh-canvas://main?node=login-title&page=page-1)')
  const match = canvasLinkRule.match(link, 0)
  assert.ok(match)
  assert.equal(match.id, 'dsh-canvas')
  assert.equal(match.start, 0)
  assert.equal(match.end, link.length)
  assert.equal(match.data.label, '在画布中定位：Title')
  assert.equal(match.data.doc, 'main')
  assert.equal(match.data.node, 'login-title')
  assert.equal(match.data.page, 'page-1')
})

test('finds a link in surrounding text starting at an offset', () => {
  const link = formatCanvasLink({ doc: 'canvas-2', node: 'btn-1', label: '按钮' })
  const text = `先看这个：${link}，然后继续`
  const match = matchCanvasLink(text, 0)
  assert.ok(match)
  assert.equal(match.start, text.indexOf(link))
  assert.equal(match.end, text.indexOf(link) + link.length)
  assert.equal(match.data.doc, 'canvas-2')
  assert.equal(match.data.node, 'btn-1')
  assert.equal(match.data.page, undefined)
})

test('ignores ordinary text and non-dsh-canvas links', () => {
  assert.equal(matchCanvasLink('这是一段普通文字 canvas/main.canvas.json', 0), undefined)
  assert.equal(matchCanvasLink('[普通链接](https://example.com)', 0), undefined)
  assert.equal(matchCanvasLink('[x](dsh-canvas://BAD?node=n)', 0), undefined)
})

test('sanitizes labels and preserves instance scene keys', () => {
  const link = formatCanvasLink({ doc: 'main', node: 'btn-instance::btn-label', label: 'a[b]\nc' })
  assert.match(link, /^\[a b c\]/)
  const match = matchCanvasLink(link, 0)
  assert.equal(match.data.node, 'btn-instance::btn-label')
})
