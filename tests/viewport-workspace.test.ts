import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer, type RequestListener } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { apply } from '../src/host/main.js'

test('canvas state exposes a stable workspace identity across sessions', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'dsh-viewport-'))
  t.after(() => rm(temp, {recursive: true, force: true}))
  let route: RequestListener
  const dispose = apply({
    webServer: { register: ({ handler }) => { route = handler } },
    sessions: { get: id => ({ cwd: join(temp, id === 'other' ? 'other' : 'same') }) },
    workingDirectory: { get: session => session.cwd },
    tools: { register: () => () => {} },
    get: () => undefined,
  })
  t.after(dispose)
  const server = createServer((req, res) => route(req, res))
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const get = async (id: string) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/dsh-canvas/api/state?sessionId=${id}`)
    assert.equal(response.status, 200)
    return (await response.json()).workspaceId
  }
  const first = await get('first')
  assert.equal(typeof first, 'string')
  assert.equal(await get('second'), first)
  assert.notEqual(await get('other'), first)
})
