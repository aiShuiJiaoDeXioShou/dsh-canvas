// @ts-nocheck
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { findInDoc, migrateDoc, normalizeDoc, outlineDoc } from '../src/shared/format.js'

const example = normalizeDoc(JSON.parse(await readFile(new URL('../examples/login.canvas.json', import.meta.url), 'utf8')))

test('findInDoc locates nodes with an ancestor path', () => {
  const found = findInDoc(example, 'Email')
  assert.ok(found.matches.length > 0)
  const field = found.matches.find((match) => match.id === 'email-field')
  assert.ok(field, 'expected the email field match')
  assert.equal(field.path[0], 'login-frame')
  assert.ok(Array.isArray(field.path))
})

test('findInDoc stops at the limit and reports truncation', () => {
  const found = findInDoc(example, 't', { limit: 1 })
  assert.equal(found.matches.length, 1)
  assert.equal(found.truncated, true)
})

test('outlineDoc honours depth, childrenLimit and fields', () => {
  const shallow = outlineDoc(example, { depth: 0 })
  assert.equal(shallow.nodes[0].children, undefined)
  const limited = outlineDoc(example, { childrenLimit: 1 })
  assert.equal(limited.nodes[0].children.length, 1)
  const nodesOnly = outlineDoc(example, { fields: ['nodes'] })
  assert.ok(nodesOnly.nodes)
  assert.equal(nodesOnly.styles, undefined)
  assert.equal(nodesOnly.comments, undefined)
  assert.equal(nodesOnly.format, 'dsh.canvas')
})

test('compact serialisation is far smaller than the pretty form', () => {
  const outline = outlineDoc(example)
  const compact = JSON.stringify(outline)
  const pretty = JSON.stringify(outline, null, 2)
  assert.ok(compact.length < pretty.length * 0.6, 'compact JSON should at least halve the payload')
})

test('migrateDoc upgrades a legacy document and reports changes', () => {
  const legacy = {
    title: 'Legacy',
    pages: [{ id: 'page-1', name: 'Page 1', children: [] }],
  }
  const migrated = migrateDoc(legacy)
  assert.equal(migrated.from, 0)
  assert.equal(migrated.to, 1)
  assert.ok(migrated.changes.some((change) => change.startsWith('version:')))
  assert.equal(migrated.doc.version, 1)
  assert.equal(migrated.doc.format, 'dsh.canvas')
})

test('migrateDoc is a no-op for a current document', () => {
  const migrated = migrateDoc(example)
  assert.equal(migrated.from, migrated.to)
  assert.deepEqual(migrated.changes, [])
})
