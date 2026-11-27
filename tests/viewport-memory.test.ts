import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ViewportMemory } from '../src/client/editor/viewport-memory.js'

const pages = [{ id: 'first' }, { id: 'second' }]
const home = { pageId: 'first', x: 40, y: 40, zoom: 1 }
const distant = { x: -24300, y: -37200, zoom: 2.5 }
const identity = ['workspace', 'review', 'document-id']

test('switching files flushes pending navigation and restores only the matching document', () => {
  const values = new Map<string, string>()
  const storage = () => ({
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
  const memory = new ViewportMemory(storage)
  assert.deepEqual(memory.open(identity, pages), home)
  memory.observe('second', distant)
  assert.equal(values.size, 0)
  assert.deepEqual(memory.open(['different-workspace', ...identity.slice(1)], pages), home)
  assert.equal(values.size, 1)
  const reopened = new ViewportMemory(storage)
  assert.deepEqual(reopened.open(identity, pages), { pageId: 'second', ...distant })
  assert.deepEqual(reopened.open(identity, pages.slice(0, 1)), home)
})

test('invalid data, missing pages and unavailable storage fall back to the first page', () => {
  for (const value of ['{', '42', '{"pageId":"second","x":1,"y":2,"zoom":0}', JSON.stringify({pageId:'removed', ...distant})]) {
    const memory = new ViewportMemory(() => ({ getItem: () => value, setItem() {} }))
    assert.deepEqual(memory.open(identity, pages), home)
  }
  const memory = new ViewportMemory(() => { throw Error('storage disabled') })
  assert.deepEqual(memory.open(identity, pages), home)
  memory.observe('second', distant)
  memory.flush()
  assert.deepEqual(memory.open(identity, pages), {pageId: 'second', ...distant})
})
