// @ts-nocheck
/**
 * @local/dsh-canvas — Host half.
 *
 * Runs inside the existing DSH process. It is not a separate service: the
 * browser half talks to it over a loopback-only route, and the agent talks to
 * it through four tools. It only reads/writes workspace files, validates JSON,
 * serves uploaded assets/fonts, and streams change notices. No rendering,
 * thumbnails, font conversion or image processing happens here.
 */

import { createHash, randomUUID } from 'node:crypto'
import { watchFile, unwatchFile } from 'node:fs'
import { appendFile, mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CanvasError,
  FORMAT,
  LIMITS,
  emptyDoc,
  findInDoc,
  findNodeInDoc,
  migrateDoc,
  isSlug,
  normalizeDoc,
  outlineDoc,
} from '../shared/format.js'
import { addComment, applyOps, replyComment, resolveComment } from '../shared/ops.js'
import { DESIGN_SYSTEMS, DESIGN_SYSTEM_PROMPT, designSystemStyles, getDesignSystem } from '../shared/design-system.js'
import { instantiateTemplate, listTemplates } from '../shared/templates.js'
import { DEFAULT_DEVICE, DEVICE_IDS, FOUNDATION_PROMPT, PRESET_IDS, listDevices, listPresets, resolveFoundation } from '../shared/foundation.js'
import { auditDoc } from '../shared/audit.js'
import { detectImageCapabilities, generateWithCodex, importImage } from './image.js'
import { registerCanvasSkills } from './skills.js'

const HEALTH_PATH = '/dsh-canvas/health'
const API_PREFIX = '/dsh-canvas/api/'
const DOC_SUFFIX = '.canvas.json'
const PACK_FORMAT = 'dsh.canvas.pack'
const PACK_VERSION = 1
const PACK_SUFFIX = '.drafi.json'
const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.svg': 'image/svg+xml',
}
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const FONT_EXT = new Set(['.woff2', '.woff', '.ttf', '.otf'])
const EXAMPLE_URL = new URL('../../examples/login.canvas.json', import.meta.url)
const FORMAT_URL = new URL('../../FORMAT.md', import.meta.url)
const DESIGN_URL = new URL('../../DESIGN.md', import.meta.url)

const TOOL_PROMPT = [
  'Canvas: the workspace may contain canvas/*.canvas.json (format dsh.canvas@1).',
  'Use canvas_read before editing; use canvas_edit for small changes and canvas_write for a new document.',
  'The canvas file format, node fields, auto-layout, components, styles, fills, effects and comments are documented in canvas/FORMAT.md.',
  'The design system and built-in templates are documented in canvas/DESIGN.md.',
  'Load the canvas-ui-design skill when the user asks for UI design, page/component generation, design review or design handoff.',
  FOUNDATION_PROMPT,
  'canvas_audit runs deterministic design checks; canvas_image probe/generate/import handles image generation (GPT native or local Codex CLI) and imports.',
  DESIGN_SYSTEM_PROMPT,
  'The user\'s current canvas selection is returned by canvas_read (selection) and can be used as context.',
].join('\n')

class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

function sha(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

function nowIso() {
  return new Date().toISOString()
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  response.end(body)
}

/** Compact tool output keeps the model payload small; set the env flag for readable logs. */
function renderJson(value) {
  const pretty = process.env.DSH_CANVAS_PRETTY_JSON === '1'
  return [{ type: 'text', text: JSON.stringify(value, null, pretty ? 2 : 0) }]
}

function sendError(response, error) {
  if (error instanceof HttpError) {
    sendJson(response, error.status, { ok: false, error: error.code, message: error.message, details: error.details })
    return
  }
  if (error instanceof CanvasError) {
    sendJson(response, 422, {
      ok: false,
      error: 'invalid-document',
      message: error.message,
      path: error.path,
      details: error.details,
    })
    return
  }
  sendJson(response, 500, { ok: false, error: 'internal', message: String(error?.message ?? error) })
}

async function readBody(request, limit = LIMITS.docBytes * 2) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > limit) throw new HttpError(413, 'body-too-large', `request body exceeds ${limit} bytes`)
    chunks.push(buffer)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new HttpError(400, 'invalid-json', `invalid JSON body: ${String(error.message)}`)
  }
}

function isLoopbackHost(host) {
  if (typeof host !== 'string') return false
  const lower = host.toLowerCase()
  const name = lower.startsWith('[') ? lower.slice(0, lower.indexOf(']') + 1) : lower.split(':')[0]
  return name === '127.0.0.1' || name === 'localhost' || name === '[::1]'
}

function sameOriginLocal(request) {
  const host = request.headers.host
  if (host !== undefined && !isLoopbackHost(host)) return false
  if (request.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = request.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function admit(ctx, request, response) {
  let rejection
  try {
    const connection = ctx.get('connection')
    if (connection && typeof connection.requestRejection === 'function') {
      rejection = connection.requestRejection(request)
    }
  } catch (error) {
    rejection = 403
  }
  if (rejection != null) {
    const status =
      typeof rejection === 'number' ? rejection : typeof rejection.status === 'number' ? rejection.status : 403
    sendJson(response, status, { ok: false, error: status === 401 ? 'login-required' : 'untrusted-origin' })
    return false
  }
  if (!sameOriginLocal(request)) {
    sendJson(response, 403, { ok: false, error: 'untrusted-origin' })
    return false
  }
  return true
}

function canvasRoot(cwd) {
  return join(cwd, 'canvas')
}

function assertInside(root, target) {
  const rel = relative(root, target)
  if (rel === '' || rel.startsWith('..') || rel.startsWith(`..${sep}`) || resolve(root, rel) !== target) {
    throw new HttpError(400, 'outside-canvas', 'path escapes the canvas directory')
  }
  return target
}

function docFile(cwd, name) {
  if (!isSlug(name)) throw new HttpError(400, 'invalid-name', 'document name must match ^[a-z0-9][a-z0-9-_]{0,63}$')
  return assertInside(canvasRoot(cwd), join(canvasRoot(cwd), `${name}${DOC_SUFFIX}`))
}

function assetFile(cwd, asset, kind) {
  const allowed = kind === 'font' ? /^fonts\/[A-Za-z0-9._-]{1,120}$/ : /^assets\/[A-Za-z0-9._-]{1,120}$/
  if (typeof asset !== 'string' || !allowed.test(asset) || asset.includes('..')) {
    throw new HttpError(400, 'invalid-asset', 'asset path is not allowed')
  }
  return assertInside(canvasRoot(cwd), join(canvasRoot(cwd), asset))
}

async function exists(file) {
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

let exampleDoc = null
async function loadExample() {
  if (exampleDoc) return exampleDoc
  try {
    exampleDoc = normalizeDoc(JSON.parse(await readFile(EXAMPLE_URL, 'utf8')))
  } catch {
    exampleDoc = normalizeDoc(emptyDoc('主画布'))
  }
  return exampleDoc
}

async function readFormatDoc() {
  try {
    return await readFile(FORMAT_URL, 'utf8')
  } catch {
    return '# dsh.canvas@1\n\nCanvas document format. See the plugin README.\n'
  }
}

async function readDesignDoc() {
  try {
    return await readFile(DESIGN_URL, 'utf8')
  } catch {
    return '# Canvas design system\n\nUse Material Design 3 by default; Apple HIG for iOS.\n'
  }
}

const state = () => ({
  selections: new Map(),
  lastDoc: new Map(),
  sse: new Set(),
  watchers: new Map(),
  revisions: new Map(),
  snapshots: new Map(),
})

/** @param {string} cwd */
async function ensureScaffold(cwd, store) {
  const root = canvasRoot(cwd)
  await mkdir(root, { recursive: true })
  await mkdir(join(root, 'assets'), { recursive: true })
  await mkdir(join(root, 'fonts'), { recursive: true })
  await mkdir(join(root, 'exports'), { recursive: true })
  const formatPath = join(root, 'FORMAT.md')
  if (!(await exists(formatPath))) {
    await writeFile(formatPath, await readFormatDoc(), 'utf8')
  }
  const designPath = join(root, 'DESIGN.md')
  if (!(await exists(designPath))) {
    await writeFile(designPath, await readDesignDoc(), 'utf8')
  }
  const names = await listDocNames(cwd)
  if (names.length === 0) {
    const example = await loadExample()
    const doc = structuredClone(example)
    doc.title = '主画布'
    doc.meta = { createdAt: nowIso(), updatedAt: nowIso() }
    const file = docFile(cwd, 'main')
    const json = JSON.stringify(doc, null, 2) + '\n'
    await writeFile(file, json, 'utf8')
    store.revisions.set(file, sha(json))
  }
}

/** @param {string} cwd */
async function listDocNames(cwd) {
  const root = canvasRoot(cwd)
  try {
    const entries = await readdir(root, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(DOC_SUFFIX))
      .map((entry) => entry.name.slice(0, -DOC_SUFFIX.length))
      .filter((name) => isSlug(name))
      .sort()
  } catch {
    return []
  }
}

/** @param {string} cwd */
async function listDocs(cwd) {
  const names = await listDocNames(cwd)
  const docs = []
  for (const name of names) {
    const file = docFile(cwd, name)
    try {
      const info = await stat(file)
      const raw = await readFile(file, 'utf8')
      let title = name
      try {
        title = JSON.parse(raw)?.title ?? name
      } catch {
        // keep the name
      }
      docs.push({ name, title, updatedAt: info.mtime.toISOString(), bytes: info.size })
    } catch {
      // ignore an unreadable document; reads surface the real error
    }
  }
  return docs
}

/** @param {string} cwd @param {string} name */
async function readDoc(cwd, name) {
  const file = docFile(cwd, name)
  let raw
  try {
    raw = await readFile(file, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') throw new HttpError(404, 'document-not-found', `canvas document "${name}" does not exist`)
    throw error
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new HttpError(422, 'invalid-json', `canvas file ${name}${DOC_SUFFIX} is not valid JSON: ${String(error.message)}`, {
      name,
    })
  }
  let doc
  try {
    doc = normalizeDoc(parsed, { touch: false })
  } catch (error) {
    if (error instanceof CanvasError) {
      throw new HttpError(422, 'invalid-document', error.message, { name, path: error.path })
    }
    throw error
  }
  return { doc, raw, revision: sha(raw), file, name }
}

/** @param {string} cwd @param {string} name @param {any} doc @param {{baseRevision?: string|null, source: string}} options */
async function writeDoc(ctx, store, cwd, name, doc, options) {
  const file = docFile(cwd, name)
  await mkdir(dirname(file), { recursive: true })
  let currentRaw = null
  try {
    currentRaw = await readFile(file, 'utf8')
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  const currentRevision = currentRaw == null ? null : sha(currentRaw)
  if (options.baseRevision != null && currentRevision != null && options.baseRevision !== currentRevision) {
    let currentDoc = null
    try {
      currentDoc = normalizeDoc(JSON.parse(currentRaw), { touch: false })
    } catch {
      currentDoc = null
    }
    throw new HttpError(409, 'revision-conflict', 'canvas was changed elsewhere', {
      revision: currentRevision,
      doc: currentDoc,
      name,
    })
  }
  const normalized = normalizeDoc(doc)
  const json = JSON.stringify(normalized, null, 2) + '\n'
  if (Buffer.byteLength(json) > LIMITS.docBytes) {
    throw new HttpError(413, 'document-too-large', `canvas document exceeds ${LIMITS.docBytes} bytes`)
  }
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temp, json, 'utf8')
  await rename(temp, file)
  const revision = sha(json)
  store.revisions.set(file, revision)
  broadcast(store, file, { type: 'doc-changed', name, revision, source: options.source })
  return { doc: normalized, revision, file, path: relative(cwd, file) }
}

/** Build a portable pack: one JSON file with the document and its assets inlined. */
async function buildPack(cwd, name) {
  const read = await readDoc(cwd, name)
  const root = canvasRoot(cwd)
  const assets = {}
  let assetCount = 0
  try {
    const entries = await readdir(join(root, 'assets'), { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const file = join(root, 'assets', entry.name)
      const info = await stat(file)
      if (info.size > 8 * 1024 * 1024) continue
      const buffer = await readFile(file)
      assets[`assets/${entry.name}`] = `data:${MIME[extname(entry.name)] ?? 'application/octet-stream'};base64,${buffer.toString('base64')}`
      assetCount += 1
    }
  } catch {
    // an empty or missing assets folder still exports
  }
  return {
    format: PACK_FORMAT,
    version: PACK_VERSION,
    name,
    exportedAt: nowIso(),
    document: read.doc,
    assets,
    assetCount,
  }
}

async function writePack(cwd, name) {
  const pack = await buildPack(cwd, name)
  const file = assertInside(canvasRoot(cwd), join(canvasRoot(cwd), 'exports', `${name}${PACK_SUFFIX}`))
  await mkdir(dirname(file), { recursive: true })
  const json = JSON.stringify(pack)
  if (Buffer.byteLength(json) > LIMITS.docBytes) throw new HttpError(413, 'pack-too-large', 'packed document exceeds the size limit')
  await writeFile(file, json, 'utf8')
  return { pack, file, bytes: Buffer.byteLength(json) }
}

/** Validate a pack file and return its document plus assets. */
async function readPack(cwd, packPath) {
  const file = assertInside(cwd, resolve(cwd, packPath))
  let raw
  try {
    raw = await readFile(file, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') throw new HttpError(404, 'pack-not-found', `pack "${packPath}" does not exist`)
    throw error
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new HttpError(422, 'invalid-pack', `pack is not valid JSON: ${String(error.message)}`)
  }
  if (!parsed || parsed.format !== PACK_FORMAT || !parsed.document) {
    throw new HttpError(422, 'invalid-pack', `expected a ${PACK_FORMAT} file`)
  }
  if (Number(parsed.version) > PACK_VERSION) {
    throw new HttpError(422, 'pack-version', `pack version ${parsed.version} is newer than supported ${PACK_VERSION}`)
  }
  return parsed
}

/** Write a pack's document and inline assets into the workspace. */
async function importPack(ctx, store, cwd, pack, options = {}) {
  const name = options.name ?? (isSlug(pack.name) ? pack.name : 'imported')
  const doc = normalizeDoc(pack.document)
  const root = canvasRoot(cwd)
  let assets = 0
  for (const [relativePathValue, dataUrl] of Object.entries(pack.assets ?? {})) {
    const match = /^assets\/[A-Za-z0-9._-]{1,120}$/.exec(relativePathValue)
    if (!match) continue
    const base64 = String(dataUrl).split(',')[1]
    if (!base64) continue
    const buffer = Buffer.from(base64, 'base64')
    if (buffer.byteLength > LIMITS.imageBytes) continue
    await mkdir(join(root, 'assets'), { recursive: true })
    await writeFile(join(root, relativePathValue), buffer)
    assets += 1
  }
  const result = await writeDoc(ctx, store, cwd, name, doc, {
    source: 'import',
    ...(typeof options.baseRevision === 'string' ? { baseRevision: options.baseRevision } : {}),
  })
  return { name, assets, revision: result.revision, path: relativePath(cwd, result.file) }
}

/** Ask the open canvas tab to rasterise a node or the whole page. */
async function requestSnapshot(store, cwd, name, options = {}) {
  const file = docFile(cwd, name)
  const clients = [...store.sse].filter((client) => client.file === file)
  if (clients.length === 0) {
    throw new HttpError(409, 'no-live-canvas', 'open the canvas tab first: snapshot needs a live renderer')
  }
  const requestId = randomUUID()
  const scale = Math.min(Math.max(Number(options.scale) || 2, 0.5), 4)
  const nodeId = typeof options.nodeId === 'string' ? options.nodeId : null
  const settled = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      store.snapshots.delete(requestId)
      reject(new HttpError(504, 'snapshot-timeout', 'the canvas tab did not answer the snapshot request'))
    }, 20_000)
    store.snapshots.set(requestId, {
      resolve: (value) => {
        clearTimeout(timer)
        store.snapshots.delete(requestId)
        resolve(value)
      },
    })
  })
  for (const client of clients) {
    try {
      client.response.write(`data: ${JSON.stringify({ type: 'snapshot-request', requestId, nodeId, scale })}\n\n`)
    } catch {
      // the close handler removes dead clients
    }
  }
  return { requestId, settled, nodeId, scale }
}

function selectionKey(sessionId, name) {
  return `${sessionId}:${name}`
}

function getSelection(store, sessionId, name) {
  const key = selectionKey(sessionId, name)
  const entry = store.selections.get(key)
  if (!entry) return null
  if (Date.now() - entry.updatedAt > 60 * 60 * 1000) {
    store.selections.delete(key)
    return null
  }
  return entry
}

function setSelection(store, sessionId, name, ids, pageId) {
  store.selections.set(selectionKey(sessionId, name), {
    ids: Array.isArray(ids) ? ids.filter((id) => typeof id === 'string').slice(0, 200) : [],
    pageId: typeof pageId === 'string' ? pageId : undefined,
    updatedAt: Date.now(),
  })
}

function broadcast(store, file, payload) {
  for (const client of store.sse) {
    if (client.file !== file) continue
    try {
      client.response.write(`data: ${JSON.stringify(payload)}\n\n`)
    } catch {
      // the close handler removes it
    }
  }
}

function retainWatcher(store, file, name) {
  const existing = store.watchers.get(file)
  if (existing) {
    existing.refs += 1
    return () => releaseWatcher(store, file)
  }
  const entry = { refs: 1, lastRevision: store.revisions.get(file) ?? null, timer: null }
  watchFile(
    file,
    { interval: 700 },
    () => {
      if (entry.timer) return
      entry.timer = setTimeout(async () => {
        entry.timer = null
        try {
          const raw = await readFile(file, 'utf8')
          const revision = sha(raw)
          if (revision === entry.lastRevision) return
          entry.lastRevision = revision
          store.revisions.set(file, revision)
          broadcast(store, file, { type: 'doc-changed', name, revision, source: 'file' })
        } catch {
          // deleted or unreadable; the next read reports it
        }
      }, 120)
    },
  )
  store.watchers.set(file, entry)
  return () => releaseWatcher(store, file)
}

function releaseWatcher(store, file) {
  const entry = store.watchers.get(file)
  if (!entry) return
  entry.refs -= 1
  if (entry.refs > 0) return
  if (entry.timer) clearTimeout(entry.timer)
  unwatchFile(file)
  store.watchers.delete(file)
}

function sessionCwd(ctx, sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) throw new HttpError(400, 'session-required', 'sessionId is required')
  const session = ctx.sessions.get(sessionId)
  if (!session) throw new HttpError(400, 'unknown-session', `unknown session "${sessionId}"`)
  let cwd
  try {
    cwd = ctx.workingDirectory.get(session)
  } catch {
    cwd = undefined
  }
  if (!cwd) cwd = session.cwd
  if (typeof cwd !== 'string' || !cwd) throw new HttpError(400, 'no-workspace', 'session has no working directory')
  return { session, cwd }
}

function resolveName(store, sessionId, name) {
  if (typeof name === 'string' && name) return name
  return store.lastDoc.get(sessionId) ?? 'main'
}

function rememberDoc(store, sessionId, name) {
  if (sessionId) store.lastDoc.set(sessionId, name)
}

function parseQuery(url) {
  return Object.fromEntries(url.searchParams.entries())
}

function relativePath(cwd, file) {
  return relative(cwd, file)
}

/** Current default model selection, when the host exposes it. */
function currentModelSelection(ctx) {
  try {
    return ctx.get('agentDefaultModel')?.currentSelection?.() ?? null
  } catch {
    return null
  }
}

/** @param {any} doc */
function summary(doc) {
  return outlineDoc(doc).stats
}

/** @param {any} ctx @param {any} store */
function createRoutes(ctx, store) {
  return async function handler(request, response) {
    try {
      if (!admit(ctx, request, response)) return
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')
      const pathname = url.pathname
      if (pathname === HEALTH_PATH) {
        sendJson(response, 200, { ok: true, plugin: '@local/dsh-canvas', version: 2 })
        return
      }
      if (!pathname.startsWith(API_PREFIX)) {
        sendJson(response, 404, { ok: false, error: 'not-found' })
        return
      }
      const action = pathname.slice(API_PREFIX.length)
      const query = parseQuery(url)
      if (action === 'state' && request.method === 'GET') {
        const sessionId = query.sessionId
        const { cwd } = sessionCwd(ctx, sessionId)
        const name = resolveName(store, sessionId, query.name)
        await ensureScaffold(cwd, store)
        rememberDoc(store, sessionId, name)
        const docs = await listDocs(cwd)
        const read = await readDoc(cwd, name)
        sendJson(response, 200, {
          ok: true,
          name,
          path: relativePath(cwd, read.file),
          revision: read.revision,
          doc: read.doc,
          docs,
          selection: getSelection(store, sessionId, name),
        })
        return
      }
      if (action === 'diag' && request.method === 'POST') {
        const body = await readBody(request, 64 * 1024)
        const line = JSON.stringify({ at: nowIso(), ...body }) + '\n'
        await appendFile('/tmp/dsh-canvas-client.log', line).catch(() => {})
        sendJson(response, 200, { ok: true })
        return
      }
      if (action === 'diag' && request.method === 'GET') {
        let text = ''
        try {
          text = await readFile('/tmp/dsh-canvas-client.log', 'utf8')
        } catch {
          text = ''
        }
        sendJson(response, 200, { ok: true, lines: text.split('\n').filter(Boolean).slice(-200) })
        return
      }
      if (action === 'docs' && request.method === 'GET') {
        const { cwd } = sessionCwd(ctx, query.sessionId)
        await ensureScaffold(cwd, store)
        sendJson(response, 200, { ok: true, docs: await listDocs(cwd) })
        return
      }
      if (action === 'doc' && request.method === 'PUT') {
        const body = await readBody(request)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const name = resolveName(store, body.sessionId, body.name)
        if (!body.doc) throw new HttpError(400, 'doc-required', 'doc is required')
        try {
          const result = await writeDoc(ctx, store, cwd, name, body.doc, {
            baseRevision: body.baseRevision,
            source: 'client',
          })
          rememberDoc(store, body.sessionId, name)
          sendJson(response, 200, {
            ok: true,
            name,
            path: relativePath(cwd, result.file),
            revision: result.revision,
            stats: summary(result.doc),
          })
        } catch (error) {
          if (error instanceof HttpError && error.code === 'revision-conflict') {
            sendJson(response, 409, { ok: false, ...error.details, message: error.message })
            return
          }
          throw error
        }
        return
      }
      if (action === 'doc/rename' && request.method === 'POST') {
        const body = await readBody(request, 64 * 1024)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const from = resolveName(store, body.sessionId, body.from)
        const to = typeof body.to === 'string' ? body.to.trim() : ''
        if (!isSlug(to)) throw new HttpError(400, 'invalid-name', 'document name must match ^[a-z0-9][a-z0-9-_]{0,63}$')
        const fromFile = docFile(cwd, from)
        const toFile = docFile(cwd, to)
        if (from !== to) {
          if (!(await exists(fromFile))) throw new HttpError(404, 'document-not-found', `canvas document "${from}" does not exist`)
          if (await exists(toFile)) throw new HttpError(409, 'document-exists', `canvas document "${to}" already exists`)
          await rename(fromFile, toFile)
          const watcher = store.watchers.get(fromFile)
          if (watcher) {
            if (watcher.timer) clearTimeout(watcher.timer)
            unwatchFile(fromFile)
            store.watchers.delete(fromFile)
          }
          store.revisions.delete(fromFile)
        }
        const raw = await readFile(toFile, 'utf8')
        const revision = sha(raw)
        store.revisions.set(toFile, revision)
        rememberDoc(store, body.sessionId, to)
        sendJson(response, 200, {
          ok: true,
          name: to,
          path: relativePath(cwd, toFile),
          revision,
          docs: await listDocs(cwd),
        })
        return
      }
      if (action === 'doc/delete' && request.method === 'POST') {
        const body = await readBody(request, 64 * 1024)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const name = resolveName(store, body.sessionId, body.name)
        const file = docFile(cwd, name)
        if (!(await exists(file))) throw new HttpError(404, 'document-not-found', `canvas document "${name}" does not exist`)
        const names = await listDocNames(cwd)
        if (names.length <= 1) throw new HttpError(409, 'last-document', 'cannot delete the last canvas document')
        await unlink(file)
        const watcher = store.watchers.get(file)
        if (watcher) {
          if (watcher.timer) clearTimeout(watcher.timer)
          unwatchFile(file)
          store.watchers.delete(file)
        }
        store.revisions.delete(file)
        const docs = await listDocs(cwd)
        const fallback = docs[0]?.name ?? 'main'
        rememberDoc(store, body.sessionId, fallback)
        sendJson(response, 200, { ok: true, name: fallback, docs })
        return
      }
      if (action === 'selection' && request.method === 'POST') {
        const body = await readBody(request, 64 * 1024)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const name = resolveName(store, body.sessionId, body.name)
        setSelection(store, body.sessionId, name, body.ids, body.pageId)
        sendJson(response, 200, { ok: true, name })
        return
      }
      if (action === 'export' && request.method === 'POST') {
        const body = await readBody(request, 40 * 1024 * 1024)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const kind = body.kind === 'svg' ? 'svg' : body.kind === 'png' ? 'png' : null
        if (!kind) throw new HttpError(400, 'invalid-export', 'kind must be png or svg')
        if (typeof body.data !== 'string' || !body.data) throw new HttpError(400, 'invalid-export', 'data is required')
        const buffer = Buffer.from(body.data, 'base64')
        if (buffer.byteLength > 30 * 1024 * 1024) throw new HttpError(413, 'export-too-large', 'export exceeds 30 MiB')
        const root = canvasRoot(cwd)
        await mkdir(join(root, 'exports'), { recursive: true })
        const safeName = (isSlug(body.name) ? body.name : 'canvas') + '-' + new Date().toISOString().replace(/[:.]/g, '-')
        const file = assertInside(root, join(root, 'exports', `${safeName}.${kind}`))
        await writeFile(file, buffer)
        sendJson(response, 200, {
          ok: true,
          path: relativePath(cwd, file),
          absolutePath: file,
          bytes: buffer.byteLength,
        })
        return
      }
      if (action === 'pack/export' && request.method === 'POST') {
        const body = await readBody(request, 64 * 1024)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const name = resolveName(store, body.sessionId, body.name)
        await ensureScaffold(cwd, store)
        const packed = await writePack(cwd, name)
        sendJson(response, 200, {
          ok: true,
          name,
          path: relativePath(cwd, packed.file),
          bytes: packed.bytes,
          assets: packed.pack.assetCount,
        })
        return
      }
      if (action === 'pack/import' && request.method === 'POST') {
        const body = await readBody(request, LIMITS.docBytes * 4)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const pack = body.pack
        if (!pack || pack.format !== PACK_FORMAT || !pack.document) {
          throw new HttpError(422, 'invalid-pack', `expected a ${PACK_FORMAT} payload`)
        }
        if (Number(pack.version) > PACK_VERSION) {
          throw new HttpError(422, 'pack-version', `pack version ${pack.version} is newer than supported ${PACK_VERSION}`)
        }
        const result = await importPack(ctx, store, cwd, pack, {
          ...(typeof body.name === 'string' && body.name ? { name: body.name } : {}),
          ...(typeof body.baseRevision === 'string' ? { baseRevision: body.baseRevision } : {}),
        })
        sendJson(response, 200, { ok: true, ...result })
        return
      }
      if (action === 'snapshot' && request.method === 'POST') {
        const body = await readBody(request, 40 * 1024 * 1024)
        const waiter = store.snapshots.get(String(body.requestId ?? ''))
        if (!waiter) throw new HttpError(404, 'unknown-snapshot', 'snapshot request expired or unknown')
        const data = typeof body.data === 'string' ? body.data : ''
        if (!data) throw new HttpError(400, 'invalid-snapshot', 'data is required')
        const buffer = Buffer.from(data, 'base64')
        if (buffer.byteLength > 30 * 1024 * 1024) throw new HttpError(413, 'snapshot-too-large', 'snapshot exceeds 30 MiB')
        waiter.resolve({ buffer, nodeId: typeof body.nodeId === 'string' ? body.nodeId : null })
        sendJson(response, 200, { ok: true })
        return
      }
      if (action === 'asset' && request.method === 'POST') {
        const body = await readBody(request, 40 * 1024 * 1024)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const ext = String(body.ext ?? '').toLowerCase()
        if (!IMAGE_EXT.has(ext)) throw new HttpError(400, 'invalid-image', 'only png/jpeg/webp/gif are supported')
        const buffer = Buffer.from(String(body.data ?? ''), 'base64')
        if (!buffer.byteLength) throw new HttpError(400, 'invalid-image', 'empty image')
        if (buffer.byteLength > LIMITS.imageBytes) throw new HttpError(413, 'image-too-large', 'image exceeds 20 MiB')
        const root = canvasRoot(cwd)
        await mkdir(join(root, 'assets'), { recursive: true })
        const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 24)
        const file = assertInside(root, join(root, 'assets', `${hash}${ext}`))
        if (!(await exists(file))) await writeFile(file, buffer)
        sendJson(response, 200, { ok: true, asset: `assets/${hash}${ext}`, bytes: buffer.byteLength })
        return
      }
      if (action === 'asset' && request.method === 'GET') {
        const { cwd } = sessionCwd(ctx, query.sessionId)
        const file = assetFile(cwd, query.asset, 'asset')
        const buffer = await readFile(file)
        response.writeHead(200, {
          'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
          'cache-control': 'public, max-age=31536000, immutable',
          'content-length': buffer.byteLength,
        })
        response.end(buffer)
        return
      }
      if (action === 'font' && request.method === 'POST') {
        const body = await readBody(request, 40 * 1024 * 1024)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const ext = String(body.ext ?? '').toLowerCase()
        if (!FONT_EXT.has(ext)) throw new HttpError(400, 'invalid-font', 'only woff2/woff/ttf/otf are supported')
        const buffer = Buffer.from(String(body.data ?? ''), 'base64')
        if (!buffer.byteLength) throw new HttpError(400, 'invalid-font', 'empty font')
        if (buffer.byteLength > LIMITS.fontBytes) throw new HttpError(413, 'font-too-large', 'font exceeds 10 MiB')
        const root = canvasRoot(cwd)
        await mkdir(join(root, 'fonts'), { recursive: true })
        const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 24)
        const file = assertInside(root, join(root, 'fonts', `${hash}${ext}`))
        if (!(await exists(file))) await writeFile(file, buffer)
        sendJson(response, 200, {
          ok: true,
          asset: `fonts/${hash}${ext}`,
          bytes: buffer.byteLength,
          family: typeof body.family === 'string' ? body.family : undefined,
          weight: typeof body.weight === 'number' ? body.weight : undefined,
          style: body.style === 'italic' ? 'italic' : 'normal',
        })
        return
      }
      if (action === 'font' && request.method === 'GET') {
        const { cwd } = sessionCwd(ctx, query.sessionId)
        const file = assetFile(cwd, query.asset, 'font')
        const buffer = await readFile(file)
        response.writeHead(200, {
          'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
          'cache-control': 'public, max-age=31536000, immutable',
          'content-length': buffer.byteLength,
        })
        response.end(buffer)
        return
      }
      if (action === 'audit' && request.method === 'POST') {
        const body = await readBody(request, 128 * 1024)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const name = resolveName(store, body.sessionId, body.name)
        const read = await readDoc(cwd, name)
        try {
          const result = auditDoc(read.doc, {
            ...(typeof body.pageId === 'string' ? { pageId: body.pageId } : {}),
            ...(typeof body.nodeId === 'string' ? { nodeId: body.nodeId } : {}),
            system: body.system === 'material3' ? 'material3' : 'ios',
          })
          sendJson(response, 200, { ok: true, name, revision: read.revision, ...result })
        } catch (error) {
          throw new HttpError(422, 'audit-failed', String(error?.message ?? error))
        }
        return
      }
      if (action === 'image/capabilities' && request.method === 'GET') {
        const { cwd } = sessionCwd(ctx, query.sessionId)
        const capabilities = await detectImageCapabilities({ modelSelection: currentModelSelection(ctx) })
        sendJson(response, 200, { ok: true, path: relativePath(cwd, canvasRoot(cwd)), capabilities })
        return
      }
      if (action === 'image/generate' && request.method === 'POST') {
        const body = await readBody(request, 128 * 1024)
        const { cwd } = sessionCwd(ctx, body.sessionId)
        const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
        if (!prompt) throw new HttpError(400, 'prompt-required', 'prompt is required')
        if (prompt.length > 8_000) throw new HttpError(400, 'prompt-too-long', 'prompt exceeds 8000 characters')
        const capabilities = await detectImageCapabilities({ modelSelection: currentModelSelection(ctx) })
        if (capabilities.recommended === 'native') {
          sendJson(response, 409, {
            ok: false,
            code: 'native-image-tool-required',
            message: 'The current model should generate images natively; ask the agent to generate and import the image.',
            capabilities,
          })
          return
        }
        if (capabilities.recommended !== 'codex') {
          sendJson(response, 409, {
            ok: false,
            code: 'image-generation-unavailable',
            message: 'No native image tool or Codex image_generation support is available; import an image instead.',
            capabilities,
          })
          return
        }
        const assetDir = join(canvasRoot(cwd), 'assets')
        await mkdir(assetDir, { recursive: true })
        const generated = await generateWithCodex({
          prompt,
          assetDir,
          ...(capabilities.codex?.bin ? { codexBin: capabilities.codex.bin } : {}),
        })
        sendJson(response, generated.ok ? 200 : 502, { ...generated, capabilities })
        return
      }
      if (action === 'events' && request.method === 'GET') {
        const { cwd } = sessionCwd(ctx, query.sessionId)
        const name = resolveName(store, query.sessionId, query.name)
        await ensureScaffold(cwd, store)
        const file = docFile(cwd, name)
        const read = await readDoc(cwd, name)
        response.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-store',
          connection: 'keep-alive',
          'x-accel-buffering': 'no',
        })
        response.write(`data: ${JSON.stringify({ type: 'ready', name, revision: read.revision })}\n\n`)
        const client = { response, file, name, sessionId: query.sessionId }
        store.sse.add(client)
        const release = retainWatcher(store, file, name)
        const heartbeat = setInterval(() => {
          try {
            response.write(': ping\n\n')
          } catch {
            // closed
          }
        }, 20_000)
        const cleanup = () => {
          clearInterval(heartbeat)
          store.sse.delete(client)
          release()
        }
        request.on('close', cleanup)
        request.on('error', cleanup)
        return
      }
      sendJson(response, 404, { ok: false, error: 'not-found' })
    } catch (error) {
      sendError(response, error)
    }
  }
}

/** @param {any} ctx @param {any} store */
function createTools(ctx, store) {
  const workspace = async (exec) => {
    if (!exec.agent) throw new Error('canvas tools require an agent session')
    const cwd = await ctx.workingDirectory.ensure(exec.agent)
    if (!cwd) throw new Error('this session has no working directory')
    return { cwd, sessionId: exec.agent.id }
  }

  const defaultName = (sessionId, name) => resolveName(store, sessionId, name)

  const read = {
    name: 'canvas_read',
    description:
      'Read a canvas document and the current selection. Prefer query to locate nodes, node for one subtree, outline for the page tree.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'document name; defaults to the last opened canvas in this session' },
        detail: { type: 'string', enum: ['outline', 'full', 'node'], description: 'how much of the document to return' },
        nodeId: { type: 'string', description: 'node id when detail is "node"' },
        query: { type: 'string', description: 'match id, name or text; returns matches with ancestor path' },
        limit: { type: 'number', description: 'max matches for query (default 20)' },
        fields: { type: 'array', items: { type: 'string' }, description: 'outline sections: nodes, styles, components, comments, fonts, meta, pages' },
        depth: { type: 'number', description: 'outline child depth (default 6)' },
        childrenLimit: { type: 'number', description: 'max children per node in the outline (default 100)' },
      },
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => renderJson(value),
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      const name = defaultName(sessionId, args?.name)
      await ensureScaffold(cwd, store)
      rememberDoc(store, sessionId, name)
      const readDocValue = await readDoc(cwd, name)
      const selection = getSelection(store, sessionId, name)
      const pageId = selection?.pageId
      const base = {
        path: relativePath(cwd, readDocValue.file),
        revision: readDocValue.revision,
        name,
        selection: selection?.ids ?? [],
        format: FORMAT,
      }
      if (pageId) base.pageId = pageId
      if (typeof args?.query === 'string' && args.query.trim()) {
        const found = findInDoc(readDocValue.doc, args.query, { pageId, limit: args.limit })
        return { ...base, detail: 'query', query: args.query, ...found }
      }
      if (args?.detail === 'full') {
        const json = JSON.stringify(readDocValue.doc)
        if (json.length > 120_000) {
          return {
            ...base,
            detail: 'full',
            tooLarge: true,
            bytes: json.length,
            hint: `Document is large; read ${base.path} with the read tool in chunks.`,
            outline: outlineDoc(readDocValue.doc, { selection: selection?.ids, pageId }),
          }
        }
        return { ...base, detail: 'full', doc: readDocValue.doc }
      }
      if (args?.detail === 'node') {
        if (typeof args.nodeId !== 'string') throw new Error('detail "node" requires nodeId')
        const found = findNodeInDoc(readDocValue.doc, args.nodeId)
        if (!found) throw new Error(`unknown node "${args.nodeId}"`)
        return { ...base, detail: 'node', node: found.node }
      }
      return {
        ...base,
        detail: 'outline',
        outline: outlineDoc(readDocValue.doc, {
          selection: selection?.ids,
          pageId,
          ...(Array.isArray(args?.fields) ? { fields: args.fields } : {}),
          ...(Number.isInteger(args?.depth) ? { depth: args.depth } : {}),
          ...(Number.isInteger(args?.childrenLimit) ? { childrenLimit: args.childrenLimit } : {}),
        }),
        hint: 'Use canvas_edit for small changes; read canvas/FORMAT.md only when creating new node structures.',
      }
    },
  }

  const write = {
    name: 'canvas_write',
    description:
      'Create or replace a dsh-canvas document (format dsh.canvas@1). Provide the complete document JSON. ' +
      'Use canvas_edit for small changes and always pass baseRevision when you read an existing document first. ' +
      'Read canvas/FORMAT.md for node, auto-layout, component, style, fill, effect and comment fields.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'document name (lowercase slug); defaults to the current document' },
        doc: { type: 'object', description: 'the complete dsh.canvas document', additionalProperties: true },
        baseRevision: { type: 'string', description: 'revision from canvas_read; rejects the write when it changed' },
      },
      required: ['doc'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => renderJson(value),
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      const name = defaultName(sessionId, args?.name)
      await ensureScaffold(cwd, store)
      const result = await writeDoc(ctx, store, cwd, name, args?.doc, {
        baseRevision: typeof args?.baseRevision === 'string' ? args.baseRevision : undefined,
        source: 'tool',
      })
      rememberDoc(store, sessionId, name)
      return {
        ok: true,
        name,
        path: relativePath(cwd, result.file),
        revision: result.revision,
        stats: summary(result.doc),
      }
    },
  }

  const edit = {
    name: 'canvas_edit',
    description:
      'Apply a list of edits to a dsh-canvas document. Operations: {op:"add", parent?, index?, node}, ' +
      '{op:"update", id, patch}, {op:"remove", id}, {op:"move", id, parent?, index?}, ' +
      '{op:"set", key:"styles"|"components"|"variantSets"|"fonts", value}, and comment ops ' +
      '(comment.add / comment.reply / comment.resolve / comment.remove). The whole document is validated after the batch; ' +
      'pass baseRevision from canvas_read to avoid overwriting newer changes.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'document name; defaults to the current document' },
        ops: { type: 'array', items: { type: 'object', additionalProperties: true }, description: 'edit operations' },
        baseRevision: { type: 'string', description: 'revision from canvas_read' },
      },
      required: ['ops'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => renderJson(value),
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      const name = defaultName(sessionId, args?.name)
      await ensureScaffold(cwd, store)
      const current = await readDoc(cwd, name)
      if (typeof args?.baseRevision === 'string' && args.baseRevision !== current.revision) {
        throw new Error(
          `revision conflict: document is at ${current.revision}; call canvas_read again before editing`,
        )
      }
      const working = structuredClone(current.doc)
      const changed = applyOps(working, args?.ops ?? [], { pageId: getSelection(store, sessionId, name)?.pageId })
      const result = await writeDoc(ctx, store, cwd, name, working, { source: 'tool' })
      rememberDoc(store, sessionId, name)
      return {
        ok: true,
        name,
        path: relativePath(cwd, result.file),
        revision: result.revision,
        changed,
        stats: summary(result.doc),
      }
    },
  }

  const comment = {
    name: 'canvas_comment',
    description:
      'Read or write the single-user comments stored in a dsh-canvas document. Actions: add, reply, resolve, list. ' +
      'Comments are part of the canvas file; use this to answer design feedback left by the user.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['add', 'reply', 'resolve', 'list'] },
        name: { type: 'string', description: 'document name; defaults to the current document' },
        pageId: { type: 'string', description: 'page id for a new comment' },
        nodeId: { type: 'string', description: 'anchor a new comment to a node' },
        x: { type: 'number', description: 'normalized page x (0-1) for an unanchored comment' },
        y: { type: 'number', description: 'normalized page y (0-1) for an unanchored comment' },
        body: { type: 'string', description: 'comment or reply text' },
        commentId: { type: 'string', description: 'target comment id for reply/resolve' },
        resolved: { type: 'boolean', description: 'resolve state; defaults to true' },
        baseRevision: { type: 'string', description: 'optional revision guard' },
      },
      required: ['action'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => renderJson(value),
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      const name = defaultName(sessionId, args?.name)
      await ensureScaffold(cwd, store)
      const current = await readDoc(cwd, name)
      if (typeof args?.baseRevision === 'string' && args.baseRevision !== current.revision) {
        throw new Error(`revision conflict: document is at ${current.revision}`)
      }
      const action = args?.action
      if (action === 'list') {
        return {
          ok: true,
          name,
          path: relativePath(cwd, current.file),
          revision: current.revision,
          comments: current.doc.comments,
        }
      }
      const working = structuredClone(current.doc)
      let result
      if (action === 'add') {
        result = addComment(working, {
          pageId: args?.pageId,
          nodeId: args?.nodeId,
          x: args?.x,
          y: args?.y,
          body: args?.body,
          author: 'ai',
        })
      } else if (action === 'reply') {
        result = replyComment(working, args?.commentId, args?.body, 'ai')
      } else if (action === 'resolve') {
        result = resolveComment(working, args?.commentId, args?.resolved !== false)
      } else {
        throw new Error(`unknown comment action "${String(action)}"`)
      }
      const written = await writeDoc(ctx, store, cwd, name, working, { source: 'tool' })
      rememberDoc(store, sessionId, name)
      return {
        ok: true,
        name,
        path: relativePath(cwd, written.file),
        revision: written.revision,
        action,
        result,
        comments: written.doc.comments,
      }
    },
  }

  const template = {
    name: 'canvas_template',
    description:
      'List, insert or inspect built-in canvas templates. Pages: ios-screen / ios-form-screen / ios-list-screen / ios-detail-screen; ' +
      'system bars: ios-status-bar / ios-status-bar-light / ios-nav-bar / ios-tab-bar. Templates default to iPhone 16 393×852 and accept device "iphone15". ' +
      'The foundation action returns devices, style presets and resolved tokens; styles loads a fill/text/effect style library. ' +
      'If the user does not specify a design system, use canvas/DESIGN.md defaults.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'insert', 'styles', 'foundation'] },
        template: { type: 'string', description: 'template id from action "list", for example ios-form-screen' },
        system: { type: 'string', enum: ['material3', 'ios'], description: 'design system for action "styles" / "foundation"' },
        device: { type: 'string', enum: DEVICE_IDS, description: 'device preset; defaults to iphone16' },
        preset: { type: 'string', enum: PRESET_IDS, description: 'style preset for action "foundation"' },
        name: { type: 'string', description: 'document name; defaults to the current document' },
        x: { type: 'number', description: 'page x for the inserted template root; defaults to 0' },
        y: { type: 'number', description: 'page y for the inserted template root; defaults to 0' },
        baseRevision: { type: 'string', description: 'optional revision guard from canvas_read' },
      },
      required: ['action'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => renderJson(value),
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      if (args?.action === 'list') {
        const device = typeof args?.device === 'string' ? args.device : DEFAULT_DEVICE
        return {
          ok: true,
          templates: listTemplates(device),
          devices: listDevices(),
          presets: listPresets(),
          defaultDevice: DEFAULT_DEVICE,
          defaultPreset: 'neutral',
          designSystems: Object.values(DESIGN_SYSTEMS).map((system) => ({
            id: system.id,
            name: system.name,
            source: system.source,
            platform: system.platform,
          })),
          defaultDesignSystem: 'material3',
          iosDesignSystem: 'ios',
          designDoc: 'canvas/DESIGN.md',
        }
      }
      if (args?.action === 'foundation') {
        return {
          ok: true,
          devices: listDevices(),
          presets: listPresets(),
          defaultDevice: DEFAULT_DEVICE,
          defaultPreset: 'neutral',
          resolved: resolveFoundation({
            system: typeof args?.system === 'string' ? args.system : 'ios',
            device: typeof args?.device === 'string' ? args.device : DEFAULT_DEVICE,
            preset: typeof args?.preset === 'string' ? args.preset : 'neutral',
          }),
        }
      }
      if (args?.action === 'styles') {
        const system = getDesignSystem(typeof args?.system === 'string' ? args.system : 'material3')
        const styles = designSystemStyles(system.id)
        const name = defaultName(sessionId, args?.name)
        await ensureScaffold(cwd, store)
        let current
        try {
          current = await readDoc(cwd, name)
        } catch (error) {
          if (error?.status === 404) current = { doc: normalizeDoc(emptyDoc('设计规范画布')), revision: null, file: null }
          else throw error
        }
        const existing = new Set(current.doc.styles.map((style) => style.name))
        const added = styles.filter((style) => !existing.has(style.name))
        const working = structuredClone(current.doc)
        working.styles = [...working.styles, ...added.map((style) => structuredClone(style))]
        const written = await writeDoc(ctx, store, cwd, name, working, {
          baseRevision: typeof args?.baseRevision === 'string' ? args.baseRevision : undefined,
          source: 'tool',
        })
        rememberDoc(store, sessionId, name)
        return {
          ok: true,
          name,
          path: relativePath(cwd, written.file),
          revision: written.revision,
          system: system.id,
          added: added.length,
          styles: written.doc.styles.length,
        }
      }
      const templateId = typeof args?.template === 'string' ? args.template : ''
      if (!templateId) throw new Error('template id is required when action is "insert"')
      const name = defaultName(sessionId, args?.name)
      await ensureScaffold(cwd, store)
      let current
      try {
        current = await readDoc(cwd, name)
      } catch (error) {
        if (error?.status === 404) {
          current = { doc: normalizeDoc(emptyDoc('模板画布')), revision: null, file: null }
        } else {
          throw error
        }
      }
      const built = instantiateTemplate(templateId, { device: typeof args?.device === 'string' ? args.device : DEFAULT_DEVICE })
      built.node.x = Number.isFinite(args?.x) ? args.x : 0
      built.node.y = Number.isFinite(args?.y) ? args.y : 0
      const working = structuredClone(current.doc)
      applyOps(working, [{ op: 'add', node: built.node }], { pageId: working.pages[0].id })
      const written = await writeDoc(ctx, store, cwd, name, working, {
        baseRevision: typeof args?.baseRevision === 'string' ? args.baseRevision : undefined,
        source: 'tool',
      })
      rememberDoc(store, sessionId, name)
      return {
        ok: true,
        name,
        path: relativePath(cwd, written.file),
        revision: written.revision,
        template: built.template,
        nodeId: built.node.id,
        width: built.node.width,
        height: built.node.height,
        stats: summary(written.doc),
      }
    },
  }

  const audit = {
    name: 'canvas_audit',
    description:
      'Read-only deterministic design audit for a canvas document. Checks screenshot frame boundaries, text contrast, ' +
      'touch-target heuristics, clipped children, zero-size nodes, missing style/component/image references, unresolved ' +
      'comments and empty frames. Returns findings with severity and node ids plus skipped checks; it does not judge ' +
      'aesthetics or real interaction.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'document name; defaults to the current document' },
        pageId: { type: 'string', description: 'page id; defaults to the document page' },
        nodeId: { type: 'string', description: 'audit this node/subtree; defaults to all top-level frames' },
        system: { type: 'string', enum: ['ios', 'material3'], description: 'touch-target system; defaults to material3' },
      },
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => renderJson(value),
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      const name = defaultName(sessionId, args?.name)
      await ensureScaffold(cwd, store)
      const readValue = await readDoc(cwd, name)
      const result = auditDoc(readValue.doc, {
        ...(typeof args?.pageId === 'string' ? { pageId: args.pageId } : {}),
        ...(typeof args?.nodeId === 'string' ? { nodeId: args.nodeId } : {}),
        system: args?.system === 'material3' ? 'material3' : 'ios',
      })
      return { ok: true, name, revision: readValue.revision, ...result }
    },
  }

  const image = {
    name: 'canvas_image',
    description:
      'Probe, generate or import images for a canvas document. probe reports the current model and whether a local Codex CLI ' +
      'supports image_generation; generate uses Codex when that is the recommended route; import copies an existing image ' +
      'file (for example from the model native image tool) into canvas/assets/. Expected failures are returned, not thrown.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['probe', 'generate', 'import'] },
        prompt: { type: 'string', description: 'image prompt for action "generate"' },
        path: { type: 'string', description: 'source image path for action "import"' },
        name: { type: 'string', description: 'canvas document name; defaults to the current document' },
      },
      required: ['action'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => renderJson(value),
    },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      const name = defaultName(sessionId, args?.name)
      if (args?.action === 'probe') {
        const capabilities = await detectImageCapabilities({ modelSelection: currentModelSelection(ctx) })
        return { ok: true, name, capabilities }
      }
      const assetDir = join(canvasRoot(cwd), 'assets')
      await mkdir(assetDir, { recursive: true })
      if (args?.action === 'generate') {
        const prompt = typeof args?.prompt === 'string' ? args.prompt.trim() : ''
        if (!prompt) throw new Error('image generate requires prompt')
        const capabilities = await detectImageCapabilities({ modelSelection: currentModelSelection(ctx) })
        if (capabilities.recommended === 'native') {
          return {
            ok: false,
            code: 'use-native-image-tool',
            message: 'The current model should generate images natively. Generate with the host image tool, then call canvas_image import with the resulting file.',
            capabilities,
          }
        }
        if (capabilities.recommended !== 'codex') {
          return {
            ok: false,
            code: 'image-generation-unavailable',
            message: 'No native image tool or Codex image_generation support is available; import an existing image instead.',
            capabilities,
          }
        }
        const generated = await generateWithCodex({
          prompt,
          assetDir,
          ...(capabilities.codex?.bin ? { codexBin: capabilities.codex.bin } : {}),
        })
        return { name, capabilities, ...generated }
      }
      if (args?.action === 'import') {
        const source = typeof args?.path === 'string' ? args.path : ''
        if (!source) throw new Error('image import requires path')
        const result = await importImage({ sourcePath: resolve(cwd, source), assetDir })
        return { name, ...result }
      }
      throw new Error(`unknown canvas_image action "${String(args?.action)}"`)
    },
  }

  const exportTool = {
    name: 'canvas_export',
    description: 'Pack a canvas document and its assets into one portable file under canvas/exports/.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'document name; defaults to the current document' },
      },
      additionalProperties: false,
    },
    output: { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => renderJson(value) },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      const name = defaultName(sessionId, args?.name)
      await ensureScaffold(cwd, store)
      const packed = await writePack(cwd, name)
      return {
        ok: true,
        name,
        path: relativePath(cwd, packed.file),
        bytes: packed.bytes,
        assets: packed.pack.assetCount,
        format: PACK_FORMAT,
      }
    },
  }

  const importTool = {
    name: 'canvas_import',
    description: 'Import a canvas pack written by canvas_export as a document plus its assets.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'pack path relative to the workspace' },
        name: { type: 'string', description: 'target document name; defaults to the pack name' },
        baseRevision: { type: 'string', description: 'optional revision guard when overwriting' },
      },
      required: ['path'],
      additionalProperties: false,
    },
    output: { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => renderJson(value) },
    async execute(args, exec) {
      const { cwd } = await workspace(exec)
      if (typeof args?.path !== 'string' || !args.path) throw new Error('canvas_import requires path')
      const pack = await readPack(cwd, args.path)
      const result = await importPack(ctx, store, cwd, pack, {
        ...(typeof args?.name === 'string' ? { name: args.name } : {}),
        ...(typeof args?.baseRevision === 'string' ? { baseRevision: args.baseRevision } : {}),
      })
      return { ok: true, ...result }
    },
  }

  const migrateTool = {
    name: 'canvas_migrate',
    description: 'Upgrade a stored canvas document to the current format version and report what changed.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'document name; defaults to the current document' },
        dryRun: { type: 'boolean', description: 'report changes without writing' },
      },
      additionalProperties: false,
    },
    output: { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => renderJson(value) },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      const name = defaultName(sessionId, args?.name)
      await ensureScaffold(cwd, store)
      const current = await readDoc(cwd, name)
      const parsed = JSON.parse(current.raw)
      const migrated = migrateDoc(parsed)
      const changed = migrated.changes.length > 0 || migrated.from !== migrated.to
      if (!changed || args?.dryRun) {
        return { ok: true, name, from: migrated.from, to: migrated.to, changes: migrated.changes, written: false }
      }
      const result = await writeDoc(ctx, store, cwd, name, migrated.doc, { source: 'migrate' })
      return { ok: true, name, from: migrated.from, to: migrated.to, changes: migrated.changes, written: true, revision: result.revision }
    },
  }

  const snapshotTool = {
    name: 'canvas_snapshot',
    description:
      'Render a node or the whole page in the open canvas tab and save a PNG under canvas/exports/. ' +
      'Read the returned path with the image tool to actually see the design.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'document name; defaults to the current document' },
        nodeId: { type: 'string', description: 'node to render; omit for the whole page' },
        scale: { type: 'number', description: 'pixel scale, 0.5 to 4 (default 2)' },
      },
      additionalProperties: false,
    },
    output: { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => renderJson(value) },
    async execute(args, exec) {
      const { cwd, sessionId } = await workspace(exec)
      const name = defaultName(sessionId, args?.name)
      const pending = await requestSnapshot(store, cwd, name, {
        ...(typeof args?.nodeId === 'string' ? { nodeId: args.nodeId } : {}),
        ...(args?.scale !== undefined ? { scale: args.scale } : {}),
      })
      const { buffer, nodeId } = await pending.settled
      const root = canvasRoot(cwd)
      await mkdir(join(root, 'exports'), { recursive: true })
      const suffix = new Date().toISOString().replace(/[:.]/g, '-')
      const target = assertInside(root, join(root, 'exports', `snapshot-${name}-${suffix}.png`))
      await writeFile(target, buffer)
      return {
        ok: true,
        name,
        nodeId: nodeId ?? null,
        path: relativePath(cwd, target),
        bytes: buffer.byteLength,
        hint: 'Read this PNG with the image tool to inspect the rendered design.',
      }
    },
  }

  return [read, write, edit, comment, template, audit, image, exportTool, importTool, migrateTool, snapshotTool]
}

export function apply(ctx) {
  const store = state()
  const disposers = []
  const routes = createRoutes(ctx, store)
  disposers.push(ctx.webServer.register({ kind: 'prefix', path: '/dsh-canvas', handler: routes }))

  for (const tool of createTools(ctx, store)) {
    disposers.push(ctx.tools.register(tool))
  }

  registerCanvasSkills(ctx, disposers)

  const systemPrompt = ctx.get('systemPrompt')
  if (systemPrompt && typeof systemPrompt.section === 'function') {
    try {
      disposers.push(systemPrompt.section({ name: 'dsh-canvas', order: 810, text: TOOL_PROMPT }))
    } catch {
      // An older host without prompt sections keeps the tools only.
    }
  }

  return () => {
    for (const disposer of disposers.splice(0)) {
      try {
        disposer()
      } catch {
        // keep unloading the rest
      }
    }
    for (const client of store.sse) {
      try {
        client.response.end()
      } catch {
        // closed
      }
    }
    store.sse.clear()
    for (const file of [...store.watchers.keys()]) releaseWatcher(store, file)
    store.selections.clear()
    store.lastDoc.clear()
    store.revisions.clear()
  }
}
