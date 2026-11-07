import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)

test('the locate chip aligns with the composer card', async () => {
  const client = await readFile(new URL('src/client/index.tsx', root), 'utf8')
  const start = client.indexOf('function CanvasSelectionDock')
  const end = client.indexOf('export const name', start)
  assert.ok(start > -1 && end > start, 'CanvasSelectionDock should remain in index.tsx')
  const dock = client.slice(start, end)

  assert.doesNotMatch(dock, /marginLeft/, 'a hard left offset cannot follow the composer card')
  assert.match(dock, /--dsh-composer-side-clearance/)
  assert.match(dock, /--dsh-composer-dock-inset/)
  assert.match(dock, /--dsh-composer-card-max-width/)
  assert.match(dock, /margin: '0 auto'/)
  assert.match(dock, /boxSizing: 'border-box'/)
})

test('the composer stays a plain-text surface', async () => {
  const store = await readFile(new URL('src/client/store.ts', root), 'utf8')
  assert.equal(store.includes('actions.insertText(text, span)'), true)
  assert.equal(store.includes('captureInsertion()'), true)
  assert.equal(store.includes('画布选区：'), true)
})
