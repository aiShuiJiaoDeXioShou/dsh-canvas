// @ts-nocheck
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { Readable } from 'node:stream'
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { apply } from '../src/host/main.js'
import { emptyDoc } from '../src/shared/format.js'

function fakeHost(cwd) {
  const tools = new Map()
  let handler = null
  const ctx = {
    webServer: {
      register: (spec) => {
        handler = spec.handler
        return () => {}
      },
    },
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
  const call = (url, body, method = 'POST', extraHeaders = {}) =>
    new Promise((resolve) => {
      const request = Readable.from([Buffer.from(JSON.stringify(body ?? {}))])
      request.url = url
      request.method = method
      request.headers = { host: '127.0.0.1', 'content-type': 'application/json', ...extraHeaders }
      const chunks = []
      const response = {
        headers: {},
        writeHead(status, headers) {
          this.statusCode = status
          if (headers) Object.assign(this.headers, headers)
        },
        setHeader(k, v) {
          this.headers[k.toLowerCase()] = v
        },
        write(chunk) {
          chunks.push(chunk)
        },
        end(chunk) {
          if (chunk) chunks.push(chunk)
          resolve({
            status: this.statusCode,
            headers: this.headers,
            body: Buffer.concat(chunks.map((entry) => Buffer.from(entry))).toString(),
          })
        },
      }
      handler(request, response)
    })
  return { tools, call, exec: { sessionId: 'sess-test', agent: { id: 'sess-test' } } }
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
  await mkdir(join(cwd, '.dsh-canvas'), { recursive: true })
  await writeFile(
    join(cwd, '.dsh-canvas', 'legacy.canvas.json'),
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
  const saved = JSON.parse(await readFile(join(cwd, '.dsh-canvas', 'legacy.canvas.json'), 'utf8'))
  assert.equal(saved.version, 1)
})

test('legacy canvas/ directory is migrated to .dsh-canvas on first access', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-legacy-'))
  await mkdir(join(cwd, 'canvas'), { recursive: true })
  await writeFile(
    join(cwd, 'canvas', 'legacy.canvas.json'),
    JSON.stringify(emptyDoc('Legacy storage')),
    'utf8',
  )
  const { tools, exec } = fakeHost(cwd)
  const read = await tools.get('canvas_read').execute({ name: 'legacy' }, exec)
  assert.equal(read.name, 'legacy')
  assert.equal(read.path, join('.dsh-canvas', 'legacy.canvas.json'))
  assert.ok(existsSync(join(cwd, '.dsh-canvas', 'legacy.canvas.json')))
  assert.equal(existsSync(join(cwd, 'canvas')), false)
})

test('canvas_export writes a pack and canvas_import restores it', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-pack-'))
  const { tools, exec } = fakeHost(cwd)
  const exported = await tools.get('canvas_export').execute({}, exec)
  assert.equal(exported.format, 'dsh.canvas.pack')
  assert.ok(existsSync(join(cwd, exported.path)))
  const imported = await tools.get('canvas_import').execute({ path: exported.path, name: 'copy' }, exec)
  assert.equal(imported.name, 'copy')
  assert.ok(existsSync(join(cwd, '.dsh-canvas', 'copy.canvas.json')))
})

test('canvas_snapshot explains that a live canvas is required', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-snapshot-'))
  const { tools, exec } = fakeHost(cwd)
  await assert.rejects(
    () => tools.get('canvas_snapshot').execute({}, exec),
    /open the canvas tab first/,
  )
})

test('the pack routes serve the toolbar export and import', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-routes-'))
  const { tools, call, exec } = fakeHost(cwd)
  await tools.get('canvas_read').execute({}, exec)
  const exported = await call('/dsh-canvas/api/pack/export', { sessionId: 'sess-test', name: 'main' })
  assert.equal(exported.status, 200)
  const summary = JSON.parse(exported.body)
  assert.ok(summary.path.endsWith('main.drafi.json'))

  const pack = JSON.parse(await readFile(join(cwd, summary.path), 'utf8'))
  const imported = await call('/dsh-canvas/api/pack/import', { sessionId: 'sess-test', name: 'from-ui', pack })
  assert.equal(imported.status, 200)
  assert.ok(existsSync(join(cwd, '.dsh-canvas', 'from-ui.canvas.json')))
})

test('an unknown snapshot request is rejected', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-snap-route-'))
  const { call } = fakeHost(cwd)
  const result = await call('/dsh-canvas/api/snapshot', { sessionId: 'sess-test', requestId: 'missing', data: 'AAAA' })
  assert.equal(result.status, 404)
})

test('the read-only pack route returns the pack without writing files', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-pack-get-'))
  const { tools, call, exec } = fakeHost(cwd)
  await tools.get('canvas_read').execute({}, exec)
  const response = await call('/dsh-canvas/api/pack?sessionId=sess-test&name=main', undefined, 'GET')
  assert.equal(response.status, 200)
  const payload = JSON.parse(response.body)
  assert.equal(payload.pack.format, 'dsh.canvas.pack')
  assert.ok(payload.pack.document)
  const exported = existsSync(join(cwd, '.dsh-canvas', 'exports'))
    ? await (await import('node:fs/promises')).readdir(join(cwd, '.dsh-canvas', 'exports'))
    : []
  assert.equal(exported.some((entry) => entry.endsWith('.drafi.json')), false)
})

test('canvas_figma tool and Companion Plugin bridge complete pairing, pull, push, ack, paste, and .dshfig round-trip', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'drafi-figma-e2e-'))
  const { tools, call, exec } = fakeHost(cwd)
  const figmaTool = tools.get('canvas_figma')
  assert.ok(figmaTool, 'canvas_figma tool should be registered')

  // 1. Setup status never leaks secrets and exposes paths
  const status = await figmaTool.execute({ action: 'setup_status', probe: false }, exec)
  assert.equal(status.ok, true)
  assert.equal(status.channels.clipboard.ready, true)
  assert.ok(status.setupScriptPath.endsWith('figma-setup.mjs'))
  assert.ok(status.channels.companionPlugin.manifestPath.endsWith('manifest.json'))

  // 2. Start pairing and exchange code via /dsh-canvas/bridge/v1/pair with Figma iframe Origin: null
  const pairStart = await figmaTool.execute({ action: 'pair_start', name: 'bridge-doc' }, exec)
  assert.match(pairStart.pairingCode, /^[0-9A-F]{4}-[0-9A-F]{4}$/)

  const pairRes = await call('/dsh-canvas/bridge/v1/pair', { pairingCode: pairStart.pairingCode }, 'POST', { origin: 'null' })
  assert.equal(pairRes.status, 200)
  const { token } = JSON.parse(pairRes.body)
  assert.ok(token.startsWith('dshb_'))

  // 3. Plugin pushes initial IR into Drafi (cold import -> creates clean dsh.canvas@1 + sidecar)
  const pullRes = await call(
    '/dsh-canvas/bridge/v1/pull',
    {
      ir: {
        format: 'dsh.figma.ir',
        version: 1,
        fileKey: 'PLUGINTEST01',
        fileName: 'Plugin Screen',
        readCompleteness: 'complete',
        pages: [
          {
            figmaId: '0:1',
            name: 'Home',
            children: [
              {
                figmaId: '1:10',
                dshId: 'hero_card',
                type: 'frame',
                name: 'Hero Card',
                x: 16,
                y: 24,
                width: 360,
                height: 200,
                fills: [{ type: 'solid', color: '#ffffff' }],
                passthrough: { blendMode: 'MULTIPLY' },
                children: [],
              },
            ],
          },
        ],
      },
    },
    'POST',
    { origin: 'null', authorization: `Bearer ${token}` },
  )
  assert.equal(pullRes.status, 200)
  assert.equal(JSON.parse(pullRes.body).written, true)
  assert.ok(existsSync(join(cwd, '.dsh-canvas', 'bridge-doc.canvas.json')))
  assert.ok(existsSync(join(cwd, '.dsh-canvas', 'figma', 'bridge-doc.sync.json')))

  // 4. Edit locally via canvas_edit, then plan & queue Push Patch
  await tools.get('canvas_edit').execute(
    { name: 'bridge-doc', ops: [{ op: 'update', id: 'hero_card', patch: { width: 393 } }] },
    exec,
  )
  const pushQueued = await figmaTool.execute({ action: 'push_diff', name: 'bridge-doc', dryRun: false, mode: 'in-place' }, exec)
  assert.equal(pushQueued.queuedForPlugin, true)
  assert.equal(pushQueued.patch.operations.length, 1)

  // 5. Plugin fetches patch and posts ack
  const patchRes = await call('/dsh-canvas/bridge/v1/patch', undefined, 'GET', { origin: 'null', authorization: `Bearer ${token}` })
  assert.equal(patchRes.status, 200)
  const fetchedPatch = JSON.parse(patchRes.body).patch
  assert.equal(fetchedPatch.operations[0].fields.width, 393)

  const ackRes = await call(
    '/dsh-canvas/bridge/v1/ack',
    { ack: { planId: fetchedPatch.planId, appliedDshIds: ['hero_card'], createdNodeIds: {} } },
    'POST',
    { origin: 'null', authorization: `Bearer ${token}` },
  )
  assert.equal(ackRes.status, 200)

  // 6. Subsequent push diff is strictly 0 changes
  const pushAfter = await figmaTool.execute({ action: 'push_diff', name: 'bridge-doc', dryRun: true }, exec)
  assert.equal(pushAfter.plan.entries.length, 0)

  // 7. Export & import lossless .dshfig bundle
  const exported = await figmaTool.execute({ action: 'export_bundle', name: 'bridge-doc' }, exec)
  assert.ok(exported.path.endsWith('bridge-doc.dshfig'))
  const restored = await figmaTool.execute({ action: 'import_bundle', name: 'restored-doc', path: exported.path }, exec)
  assert.equal(restored.hasSidecar, true)
  assert.ok(existsSync(join(cwd, '.dsh-canvas', 'figma', 'restored-doc.sync.json')))

  // 8. Clipboard paste endpoint decodes SVG cleanly
  const pasteRes = await call('/dsh-canvas/api/figma/paste', {
    sessionId: 'sess-test',
    text: '<svg viewBox="0 0 16 16"><path d="M2 8 L14 8" stroke="#111111"/></svg>',
  })
  assert.equal(pasteRes.status, 200)
  assert.equal(JSON.parse(pasteRes.body).nodes[0].type, 'path')
})
