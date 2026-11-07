import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { apply } from '../src/host/main.js'

function fakeHost(cwd) {
  const tools = new Map()
  const ctx = {
    webServer: { register: () => () => {} },
    tools: {
      register: (tool) => {
        tools.set(tool.name, tool)
        return () => tools.delete(tool.name)
      },
    },
    sessions: { get: (id) => ({ id, cwd }) },
    workingDirectory: { ensure: async () => cwd, get: () => cwd },
    get: () => undefined,
  }
  apply(ctx)
  return { tools, exec: { agent: { id: 'sess-test' } } }
}

test('canvas_read query returns matches instead of the page tree', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-read-'))
  const { tools, exec } = fakeHost(cwd)
  const read = tools.get('canvas_read')
  const result = await read.execute({ query: 'Email' }, exec)
  assert.equal(result.detail, 'query')
  assert.ok(result.matches.length > 0)
  assert.ok(result.matches[0].path)
  const json = JSON.stringify(result)
  assert.ok(json.length < 3000, `query payload should stay small, got ${json.length}`)
})

test('canvas_read fields trims reference tables', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-fields-'))
  const { tools, exec } = fakeHost(cwd)
  const read = tools.get('canvas_read')
  const full = await read.execute({}, exec)
  const trimmed = await read.execute({ fields: ['nodes'] }, exec)
  assert.ok(full.outline.styles !== undefined)
  assert.equal(trimmed.outline.styles, undefined)
  assert.ok(JSON.stringify(trimmed).length < JSON.stringify(full).length)
})

test('canvas_migrate upgrades a legacy document', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-migrate-'))
  await mkdir(join(cwd, 'canvas'), { recursive: true })
  await writeFile(
    join(cwd, 'canvas', 'legacy.canvas.json'),
    JSON.stringify({ title: 'Legacy', pages: [{ id: 'p1', name: 'Page 1', children: [] }] }),
    'utf8',
  )
  const { tools, exec } = fakeHost(cwd)
  const migrate = tools.get('canvas_migrate')
  const dry = await migrate.execute({ name: 'legacy', dryRun: true }, exec)
  assert.equal(dry.from, 0)
  assert.equal(dry.written, false)
  assert.ok(dry.changes.length > 0)
  const wet = await migrate.execute({ name: 'legacy' }, exec)
  assert.equal(wet.written, true)
  const saved = JSON.parse(await readFile(join(cwd, 'canvas', 'legacy.canvas.json'), 'utf8'))
  assert.equal(saved.version, 1)
})

test('canvas_export writes a pack and canvas_import restores it', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-pack-'))
  const { tools, exec } = fakeHost(cwd)
  const exported = await tools.get('canvas_export').execute({}, exec)
  assert.equal(exported.format, 'dsh.canvas.pack')
  assert.ok(existsSync(join(cwd, exported.path)))
  const imported = await tools.get('canvas_import').execute({ path: exported.path, name: 'copy' }, exec)
  assert.equal(imported.name, 'copy')
  assert.ok(existsSync(join(cwd, 'canvas', 'copy.canvas.json')))
})

test('canvas_snapshot explains that a live canvas is required', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-snapshot-'))
  const { tools, exec } = fakeHost(cwd)
  await assert.rejects(
    () => tools.get('canvas_snapshot').execute({}, exec),
    /open the canvas tab first/,
  )
})
