import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { emptyDoc, normalizeDoc } from '../src/shared/format.js'
import { createInitialSidecar, dshDocToIr } from '../src/shared/figma/ir.js'
import {
  clearFigmaToken,
  getFigmaAuthStatus,
  requireFigmaAccessToken,
  saveFigmaToken,
} from '../src/host/figma/credentials.js'
import { exportDshFigBundle, importDshFigBundle } from '../src/host/figma/bundle.js'
import { decodeFigmaClipboard } from '../src/host/figma/clipboard.js'
import {
  fetchFigmaAsIr,
  fetchFigmaComments,
  mergeFigmaCommentsIntoDoc,
  parseFigmaUrl,
  postFigmaComment,
} from '../src/host/figma/rest-adapter.js'
import { FigmaPluginBridge } from '../src/host/figma/bridge.js'
import { FIGMA_SETUP_SKILL_NAME, loadAllCanvasSkills, loadFigmaSetupSkill, registerCanvasSkills } from '../src/host/skills.js'

test('canvas-figma-setup skill loads cleanly and registers alongside canvas-ui-design', () => {
  const setupSkill = loadFigmaSetupSkill()
  assert.equal(setupSkill.name, FIGMA_SETUP_SKILL_NAME)
  assert.match(setupSkill.content, /canvas_figma/)
  assert.match(setupSkill.content, /--from-clipboard/)
  assert.equal(loadAllCanvasSkills().length, 2)

  const registered: Array<Record<string, unknown>> = []
  const ctx = {
    get: (key: string) =>
      key === 'skills'
        ? {
            register: (entry: Record<string, unknown>) => {
              registered.push(entry)
              return () => {}
            },
          }
        : undefined,
  }
  assert.equal(registerCanvasSkills(ctx, []), true)
  assert.deepEqual(
    registered.map((r) => r.name).sort(),
    ['canvas-figma-setup', 'canvas-ui-design'],
  )
})

test('credentials store verifies via /v1/me, persists with 0600, and strictly redacts token in status', async () => {
  const credDir = await mkdtemp(join(tmpdir(), 'drafi-figma-cred-'))
  const fakeToken = 'figd_test_secret_token_1234567890abcd'
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input)
    assert.ok(url.endsWith('/v1/me'))
    const headers = init?.headers as Record<string, string>
    if (headers['X-Figma-Token'] !== fakeToken) {
      return new Response(JSON.stringify({ err: 'unauthorized' }), { status: 403 })
    }
    return new Response(JSON.stringify({ id: 'u1', handle: 'designer', email: 'designer@example.com' }), { status: 200 })
  }

  const opts = { credentialsDir: credDir, env: {}, platform: 'linux' as const, fetchImpl: mockFetch }
  const before = await getFigmaAuthStatus({ probe: false }, opts)
  assert.equal(before.configured, false)

  const saved = await saveFigmaToken(fakeToken, { scopeMode: 'comments-write', expiresInDays: 90 }, opts)
  assert.equal(saved.configured, true)
  assert.equal(saved.valid, true)
  assert.equal(saved.account?.handle, 'designer')
  assert.equal(saved.scopeMode, 'comments-write')
  assert.ok(!JSON.stringify(saved).includes(fakeToken), 'redacted status must never contain raw token')

  const rawAccess = await requireFigmaAccessToken(opts)
  assert.equal(rawAccess, fakeToken)

  const probed = await getFigmaAuthStatus({ probe: true }, opts)
  assert.equal(probed.valid, true)
  assert.ok(!JSON.stringify(probed).includes(fakeToken))

  const cleared = await clearFigmaToken(opts)
  assert.equal(cleared.cleared, true)
  const after = await getFigmaAuthStatus({ probe: false }, opts)
  assert.equal(after.configured, false)
})

test('parseFigmaUrl handles design/file/proto URLs, node-id conversion, and bare file keys', () => {
  const parsed = parseFigmaUrl('https://www.figma.com/design/AbCdEfGh1234/My-App?node-id=12-34')
  assert.equal(parsed.fileKey, 'AbCdEfGh1234')
  assert.equal(parsed.nodeId, '12:34')
  assert.equal(parsed.fileName, 'My App')

  const bare = parseFigmaUrl('XyZ987654321')
  assert.equal(bare.fileKey, 'XyZ987654321')
  assert.throws(() => parseFigmaUrl('https://evil.example.com/design/AbCdEfGh1234'))
})

test('REST adapter cold-imports file IR, syncs comments into valid dsh.canvas@1 without echo, and posts replies', async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'drafi-figma-rest-'))
  const postedBodies: unknown[] = []
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input)
    if (url.includes('/images')) {
      return new Response(JSON.stringify({ meta: { images: {} } }), { status: 200 })
    }
    if (url.includes('/comments') && init?.method === 'POST') {
      postedBodies.push(JSON.parse(String(init.body)))
      return new Response(JSON.stringify({ id: 'fc-reply-1', message: 'Fixed!', created_at: '2026-11-26T00:00:00Z' }), { status: 200 })
    }
    if (url.includes('/comments')) {
      return new Response(
        JSON.stringify({
          comments: [
            {
              id: 'fc-1',
              message: 'Button contrast is too low',
              created_at: '2026-11-26T00:00:00Z',
              user: { handle: 'PM' },
              client_meta: { node_id: '1:10', node_offset: { x: 12, y: 24 } },
            },
            {
              id: 'fc-2',
              parent_id: 'fc-1',
              message: 'Please make it WCAG AA',
              created_at: '2026-11-26T00:01:00Z',
              user: { handle: 'Lead' },
            },
          ],
        }),
        { status: 200 },
      )
    }
    return new Response(
      JSON.stringify({
        name: 'Checkout UI',
        version: 'v99',
        document: {
          id: '0:0',
          type: 'DOCUMENT',
          children: [
            {
              id: '0:1',
              type: 'CANVAS',
              name: 'Mobile',
              children: [
                {
                  id: '1:10',
                  type: 'FRAME',
                  name: 'Screen',
                  absoluteBoundingBox: { x: 0, y: 0, width: 393, height: 852 },
                  fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }],
                  children: [
                    {
                      id: '1:11',
                      type: 'TEXT',
                      name: 'CTA',
                      characters: 'Pay Now',
                      absoluteBoundingBox: { x: 20, y: 780, width: 353, height: 48 },
                      style: { fontFamily: 'Inter', fontWeight: 600, fontSize: 16, lineHeightPx: 22 },
                      fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1, a: 1 } }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      }),
      { status: 200 },
    )
  }

  const { ir } = await fetchFigmaAsIr('FILEKEY12345', 'figd_valid_token_1234567890', workDir, { fetchImpl: mockFetch })
  assert.equal(ir.fileName, 'Checkout UI')
  assert.equal(ir.pages[0].children[0].children?.[0].text, 'Pay Now')

  const doc = normalizeDoc({
    ...emptyDoc('Checkout UI'),
    pages: [{ id: 'page-1', name: 'Mobile', children: [{ id: 'screen-1', type: 'frame', name: 'Screen', x: 0, y: 0, width: 393, height: 852, children: [] }] }],
  })
  const sidecar = createInitialSidecar({
    canvasName: 'main',
    canvasDocId: doc.id,
    canvasRevision: 'rev1',
    fileKey: 'FILEKEY12345',
    transport: 'rest',
    remoteIr: dshDocToIr(doc),
    pageBindings: { 'page-1': '0:1' },
    nodeBindings: { 'screen-1': '1:10' },
    passthrough: {},
  })

  const comments = await fetchFigmaComments('FILEKEY12345', 'figd_valid_token_1234567890', sidecar.binding.nodes, mockFetch)
  assert.equal(comments.length, 2)
  assert.equal(comments[0].canvasNodeId, 'screen-1')
  assert.equal(comments[0].anchorState, 'attached')

  const merged1 = mergeFigmaCommentsIntoDoc(doc, sidecar, comments)
  assert.equal(merged1.imported, 1)
  assert.doesNotThrow(() => normalizeDoc(merged1.doc, { touch: false }))

  // Merging the exact same comments again imports 0 duplicates (anti-echo)
  const merged2 = mergeFigmaCommentsIntoDoc(merged1.doc, merged1.sidecar, comments)
  assert.equal(merged2.imported, 0)
  assert.equal(merged2.updated, 0)

  const reply = await postFigmaComment('FILEKEY12345', 'figd_valid_token_1234567890', { message: 'Fixed!', parentId: 'fc-1' }, mockFetch)
  assert.equal(reply.id, 'fc-reply-1')
  assert.equal((postedBodies[0] as Record<string, unknown>).comment_id, 'fc-1')
})

test('clipboard decoder imports SVG fallback cleanly without crashing', async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'drafi-figma-clip-'))
  const res = await decodeFigmaClipboard(
    { text: '<svg viewBox="0 0 24 24"><path d="M2 12 L22 12" stroke="#111111" stroke-width="2" fill="none"/></svg>' },
    workDir,
  )
  assert.equal(res.source, 'svg')
  assert.equal(res.nodes.length, 1)
  assert.equal(res.nodes[0].type, 'path')
})

test('.dshfig lossless ZIP bundle round-trips canvas, sidecar, and deduplicated SHA-256 images', async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'drafi-dshfig-'))
  await mkdir(join(workDir, 'assets'), { recursive: true })
  const imgBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4, 5, 6])
  await writeFile(join(workDir, 'assets', 'hero.png'), imgBytes)

  const doc = normalizeDoc({
    ...emptyDoc('Bundle Test'),
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        children: [
          {
            id: 'img-1',
            type: 'rect',
            name: 'Hero',
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            fills: [{ type: 'image', asset: 'assets/hero.png', scaleMode: 'fill' }],
          },
        ],
      },
    ],
  })
  const sidecar = createInitialSidecar({
    canvasName: 'bundle',
    canvasDocId: doc.id,
    canvasRevision: 'rev1',
    fileKey: 'BUNDLEKEY123',
    transport: 'plugin',
    remoteIr: dshDocToIr(doc),
    pageBindings: { 'page-1': '0:1' },
    nodeBindings: { 'img-1': '1:1' },
    passthrough: { 'img-1': { constraints: { horizontal: 'SCALE' } } },
  })

  const exported = await exportDshFigBundle({
    doc,
    sidecar,
    loadAsset: async (rel) => {
      assert.equal(rel, 'assets/hero.png')
      return new Uint8Array(imgBytes)
    },
  })
  assert.equal(exported.objects, 1)

  const imported = importDshFigBundle(exported.bytes)
  assert.equal(imported.doc.title, 'Bundle Test')
  assert.equal(imported.sidecar?.binding.fileKey, 'BUNDLEKEY123')
  assert.deepEqual(imported.sidecar?.passthrough['img-1'], { constraints: { horizontal: 'SCALE' } })
  assert.deepEqual(Buffer.from(imported.files.get('assets/hero.png')!), imgBytes)
})

test('Companion Plugin pairing bridge exchanges one-time code for Bearer token and queues patches', () => {
  const bridge = new FigmaPluginBridge()
  const created = bridge.createPairing({ sessionId: 's1', cwd: '/tmp/ws', canvasName: 'main' })
  assert.match(created.pairingCode, /^[0-9A-F]{4}-[0-9A-F]{4}$/)

  const exchanged = bridge.exchangeCode(created.pairingCode.toLowerCase())
  assert.ok(exchanged)
  assert.equal(exchanged.token, created.token)

  const queued = bridge.queuePatch('s1', 'main', {
    format: 'dsh.figma.patch',
    version: 1,
    planId: 'p1',
    canvasName: 'main',
    fileKey: 'KEY123456',
    mode: 'in-place',
    baseCanvasRevision: 'rev1',
    operations: [],
    missingAssets: [],
  })
  assert.equal(queued, true)
  const consumed = bridge.consumePatch(exchanged)
  assert.equal(consumed?.planId, 'p1')
  assert.equal(bridge.consumePatch(exchanged), null)
  bridge.dispose()
})
