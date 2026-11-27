/**
 * Host HTTP routes (`/dsh-canvas/bridge/v1/*` and `/dsh-canvas/api/figma/*`)
 * plus the `canvas_figma` agent tool definition.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { normalizeDoc } from '../../shared/format.js'
import { applyPullPlan, planPullDiff } from '../../shared/figma/reconcile.js'
import type { ConflictResolution, FigmaIrDocument, FigmaPushAck, PushApplyMode } from '../../shared/figma/sync-types.js'
import { applyBridgeCors, type FigmaPluginBridge } from './bridge.js'
import { BUNDLE_SUFFIX } from './bundle.js'
import { maxTransportBytes } from './fig-reader.js'
import { persistFigmaImages } from './fig-adapter.js'
import {
  applyPluginPushAck,
  buildCanvasFromIr,
  clearFigmaToken,
  decodeFigmaClipboard,
  exportCanvasAsDshFig,
  getFigmaAuthStatus,
  getFigmaSetupStatus,
  importFigmaFromFigBytes,
  importFigmaFromUrl,
  planOrQueueFigmaPush,
  readSidecar,
  replyToFigmaComment,
  restoreCanvasFromDshFig,
  saveFigmaToken,
  syncFigmaComments,
  writeSidecar,
  type FigmaScopeMode,
} from './service.js'

export const BRIDGE_PREFIX = '/dsh-canvas/bridge/v1/'

export interface FigmaHostDeps {
  bridge: FigmaPluginBridge
  canvasRoot: (cwd: string) => string
  sessionCwd: (sessionId: string) => { cwd: string }
  resolveName: (sessionId: string, name?: string) => string
  ensureScaffold: (cwd: string) => Promise<void>
  rememberDoc: (sessionId: string, name: string) => void
  readDoc: (cwd: string, name: string) => Promise<{ doc: Record<string, unknown>; revision: string; file: string; name: string }>
  writeDoc: (cwd: string, name: string, doc: Record<string, unknown>, options: { baseRevision?: string | null; source: string }) => Promise<{ revision: string; file: string; doc: Record<string, unknown> }>
  sendJson: (response: ServerResponse, status: number, value: unknown) => void
  readBody: (request: IncomingMessage, limit?: number) => Promise<Record<string, unknown>>
  isLoopbackRequest: (request: IncomingMessage) => boolean
  workspace: (exec: unknown) => Promise<{ cwd: string; sessionId: string }>
  renderJson: (value: unknown) => unknown
}

async function readBinaryBody(request: IncomingMessage, limit = maxTransportBytes): Promise<Buffer> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buf.byteLength
    if (size > limit) throw new Error(`Request body exceeds ${limit} bytes`)
    chunks.push(buf)
  }
  return Buffer.concat(chunks)
}

function assertInsideWorkspace(cwd: string, relPath: string): string {
  const base = resolve(cwd)
  const full = resolve(cwd, relPath)
  if (full !== base && !full.startsWith(base + sep)) {
    throw new Error('path escapes workspace directory')
  }
  return full
}

/**
 * Handle `/dsh-canvas/bridge/v1/*` requests from the Figma Companion Plugin.
 * Runs BEFORE standard same-origin `admit`, enforcing strict loopback + Bearer token + scoped CORS.
 */
export async function handleBridgeRoute(
  pathname: string,
  request: IncomingMessage,
  response: ServerResponse,
  deps: FigmaHostDeps,
): Promise<boolean> {
  if (!pathname.startsWith(BRIDGE_PREFIX)) return false
  if (!deps.isLoopbackRequest(request)) {
    deps.sendJson(response, 403, { ok: false, error: 'loopback-only', message: 'Bridge accepts loopback connections only' })
    return true
  }
  if (!applyBridgeCors(request, response)) {
    deps.sendJson(response, 403, { ok: false, error: 'origin-denied', message: 'Bridge origin not allowed' })
    return true
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return true
  }

  const route = pathname.slice(BRIDGE_PREFIX.length)
  try {
    if (route === 'pair' && request.method === 'POST') {
      const body = await deps.readBody(request, 64 * 1024)
      const session = deps.bridge.exchangeCode(String(body.pairingCode ?? ''), String(body.client ?? 'drafi-figma-plugin'))
      if (!session) {
        deps.sendJson(response, 401, { ok: false, error: 'invalid-pairing-code', message: '配对码无效或已过期' })
        return true
      }
      deps.sendJson(response, 200, {
        ok: true,
        token: session.token,
        canvasName: session.canvasName,
        expiresAt: new Date(session.expiresAt).toISOString(),
      })
      return true
    }

    const session = deps.bridge.authenticateBearer(request)
    if (!session) {
      deps.sendJson(response, 401, { ok: false, error: 'unauthorized', message: '无效或已过期的配对令牌' })
      return true
    }

    const canvasDir = deps.canvasRoot(session.cwd)

    if (route === 'status' && request.method === 'GET') {
      deps.sendJson(response, 200, {
        ok: true,
        canvasName: session.canvasName,
        hasPendingPatch: Boolean(session.pendingPatch),
      })
      return true
    }

    if (route === 'pull' && request.method === 'POST') {
      const body = await deps.readBody(request, 64 * 1024 * 1024)
      const ir = body.ir as FigmaIrDocument | undefined
      if (!ir || ir.format !== 'dsh.figma.ir') {
        deps.sendJson(response, 400, { ok: false, error: 'invalid-ir', message: 'Expected a dsh.figma.ir@1 payload' })
        return true
      }
      const imagesMap = new Map<string, Uint8Array>()
      if (body.images && typeof body.images === 'object') {
        for (const [hash, b64] of Object.entries(body.images as Record<string, string>)) {
          if (typeof b64 === 'string' && b64.length > 0) {
            imagesMap.set(hash, Buffer.from(b64, 'base64'))
          }
        }
      }
      const imageHashes = await persistFigmaImages(canvasDir, imagesMap)
      // Fill in persisted asset paths on IR image fills
      const attachAssets = (nodes: FigmaIrDocument['pages'][number]['children']) => {
        for (const n of nodes) {
          for (const f of n.fills ?? []) {
            if (f.type === 'image' && f.imageHash && imageHashes[f.imageHash.toLowerCase()]) {
              f.asset = imageHashes[f.imageHash.toLowerCase()]
            }
          }
          if (n.children?.length) attachAssets(n.children)
        }
      }
      for (const page of ir.pages) attachAssets(page.children)

      await deps.ensureScaffold(session.cwd)
      const existingSidecar = await readSidecar(canvasDir, session.canvasName).catch(() => null)
      if (!existingSidecar) {
        const built = buildCanvasFromIr({
          ir,
          imageHashes,
          canvasName: session.canvasName,
          fileKey: ir.fileKey ?? 'plugin-local',
          fileName: ir.fileName,
          transport: 'plugin',
        })
        const written = await deps.writeDoc(session.cwd, session.canvasName, built.doc, { source: 'figma-plugin' })
        built.sidecar.binding.lastCanvasRevision = written.revision
        await writeSidecar(canvasDir, session.canvasName, built.sidecar)
        deps.sendJson(response, 200, {
          ok: true,
          mode: 'import',
          written: true,
          revision: written.revision,
          nodes: Object.keys(built.sidecar.binding.nodes).length,
        })
        return true
      }

      const current = await deps.readDoc(session.cwd, session.canvasName)
      const plan = planPullDiff(current.doc, existingSidecar, ir, {
        canvasName: session.canvasName,
        baseCanvasRevision: current.revision,
      })
      session.lastPullPlan = plan
      session.lastPullIr = ir

      // Auto-apply clean non-conflicting pull if requested, otherwise hold plan for UI Diff review
      if (body.autoApply === true && plan.conflicts.length === 0) {
        const applied = applyPullPlan(current.doc, existingSidecar, ir, plan)
        applied.sidecar.binding.imageHashes = { ...applied.sidecar.binding.imageHashes, ...imageHashes }
        const written = await deps.writeDoc(session.cwd, session.canvasName, normalizeDoc(applied.doc, { touch: true }), {
          baseRevision: current.revision,
          source: 'figma-plugin',
        })
        applied.sidecar.binding.lastCanvasRevision = written.revision
        await writeSidecar(canvasDir, session.canvasName, applied.sidecar)
        deps.sendJson(response, 200, { ok: true, mode: 'pull', written: true, plan, appliedCount: applied.appliedCount })
        return true
      }

      deps.sendJson(response, 200, { ok: true, mode: 'pull', written: false, plan })
      return true
    }

    if (route === 'patch' && request.method === 'GET') {
      const patch = deps.bridge.consumePatch(session)
      deps.sendJson(response, 200, { ok: true, patch })
      return true
    }

    if (route === 'ack' && request.method === 'POST') {
      const body = await deps.readBody(request, 8 * 1024 * 1024)
      const ack = body.ack as FigmaPushAck | undefined
      if (!ack || !Array.isArray(ack.appliedDshIds)) {
        deps.sendJson(response, 400, { ok: false, error: 'invalid-ack', message: 'Expected ack.appliedDshIds' })
        return true
      }
      const current = await deps.readDoc(session.cwd, session.canvasName)
      await applyPluginPushAck({
        doc: current.doc,
        canvasDir,
        canvasName: session.canvasName,
        canvasRevision: current.revision,
        ack,
      })
      session.lastPushAck = ack
      deps.sendJson(response, 200, { ok: true, applied: ack.appliedDshIds.length })
      return true
    }

    deps.sendJson(response, 404, { ok: false, error: 'not-found' })
    return true
  } catch (error) {
    deps.sendJson(response, 400, { ok: false, error: 'bridge-error', message: error instanceof Error ? error.message : String(error) })
    return true
  }
}

/**
 * Handle `/dsh-canvas/api/figma/*` routes (protected by standard loopback + same-origin `admit`).
 */
export async function handleFigmaApiRoute(
  action: string,
  query: Record<string, string>,
  request: IncomingMessage,
  response: ServerResponse,
  deps: FigmaHostDeps,
): Promise<boolean> {
  if (!action.startsWith('figma/')) return false
  const sub = action.slice('figma/'.length)

  if (sub === 'auth/status' && request.method === 'GET') {
    const status = await getFigmaAuthStatus({ probe: query.probe !== 'false' })
    deps.sendJson(response, 200, { ok: true, ...status })
    return true
  }

  if (sub === 'auth/token' && request.method === 'POST') {
    const body = await deps.readBody(request, 16 * 1024)
    const token = typeof body.token === 'string' ? body.token : ''
    const scopeMode: FigmaScopeMode = body.scopeMode === 'comments-write' ? 'comments-write' : 'readonly'
    const expiresInDays = typeof body.expiresInDays === 'number' ? body.expiresInDays : 90
    const status = await saveFigmaToken(token, { scopeMode, expiresInDays })
    deps.sendJson(response, 200, { ok: true, ...status })
    return true
  }

  if (sub === 'auth/token' && request.method === 'DELETE') {
    const res = await clearFigmaToken()
    deps.sendJson(response, 200, { ok: true, ...res })
    return true
  }

  if (sub === 'status' && request.method === 'GET') {
    const { cwd } = deps.sessionCwd(query.sessionId)
    const name = deps.resolveName(query.sessionId, query.name)
    await deps.ensureScaffold(cwd)
    const status = await getFigmaSetupStatus({
      canvasDir: deps.canvasRoot(cwd),
      sessionId: query.sessionId,
      canvasName: name,
      bridge: deps.bridge,
      probe: query.probe !== 'false',
    })
    deps.sendJson(response, 200, status)
    return true
  }

  if (sub === 'pair' && request.method === 'POST') {
    const body = await deps.readBody(request, 16 * 1024)
    const sessionId = String(body.sessionId ?? '')
    const { cwd } = deps.sessionCwd(sessionId)
    const name = deps.resolveName(sessionId, typeof body.name === 'string' ? body.name : undefined)
    const pairing = deps.bridge.createPairing({ sessionId, cwd, canvasName: name })
    deps.sendJson(response, 200, {
      ok: true,
      pairingCode: pairing.pairingCode,
      canvasName: name,
      expiresAt: new Date(pairing.expiresAt).toISOString(),
    })
    return true
  }

  if (sub === 'paste' && request.method === 'POST') {
    const body = await deps.readBody(request, 32 * 1024 * 1024)
    const sessionId = String(body.sessionId ?? '')
    const { cwd } = deps.sessionCwd(sessionId)
    await deps.ensureScaffold(cwd)
    const existingIds = Array.isArray(body.existingIds) ? new Set(body.existingIds.map(String)) : undefined
    const decoded = await decodeFigmaClipboard(
      {
        html: typeof body.html === 'string' ? body.html : undefined,
        svg: typeof body.svg === 'string' ? body.svg : undefined,
        text: typeof body.text === 'string' ? body.text : undefined,
        existingIds,
      },
      deps.canvasRoot(cwd),
    )
    deps.sendJson(response, 200, { ok: true, ...decoded })
    return true
  }

  if (sub === 'import-url' && request.method === 'POST') {
    const body = await deps.readBody(request, 256 * 1024)
    const sessionId = String(body.sessionId ?? '')
    const { cwd } = deps.sessionCwd(sessionId)
    const name = deps.resolveName(sessionId, typeof body.name === 'string' ? body.name : undefined)
    await deps.ensureScaffold(cwd)
    const current = await deps.readDoc(cwd, name).catch(() => null)
    const result = await importFigmaFromUrl({
      url: String(body.url ?? ''),
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      currentDoc: current?.doc,
      currentRevision: typeof body.baseRevision === 'string' ? body.baseRevision : current?.revision,
      mode: body.mode === 'pull' ? 'pull' : 'import',
      dryRun: body.dryRun !== false,
      selectedIds: Array.isArray(body.selectedIds) ? body.selectedIds.map(String) : undefined,
      resolutions: body.resolutions && typeof body.resolutions === 'object' ? (body.resolutions as Record<string, ConflictResolution>) : undefined,
    })
    if (result.written && 'doc' in result && result.doc && result.sidecar) {
      const written = await deps.writeDoc(cwd, name, result.doc, {
        baseRevision: typeof body.baseRevision === 'string' ? body.baseRevision : current?.revision,
        source: 'figma-rest',
      })
      result.sidecar.binding.lastCanvasRevision = written.revision
      await writeSidecar(deps.canvasRoot(cwd), name, result.sidecar)
      deps.rememberDoc(sessionId, name)
      deps.sendJson(response, 200, { ...result, revision: written.revision, doc: undefined, sidecar: undefined })
      return true
    }
    deps.sendJson(response, 200, { ...result, doc: undefined, sidecar: undefined })
    return true
  }

  if (sub === 'import-fig' && request.method === 'POST') {
    const sessionId = query.sessionId
    const { cwd } = deps.sessionCwd(sessionId)
    const name = deps.resolveName(sessionId, query.name)
    await deps.ensureScaffold(cwd)
    const bytes = await readBinaryBody(request, maxTransportBytes)
    const current = await deps.readDoc(cwd, name).catch(() => null)
    const result = await importFigmaFromFigBytes({
      bytes,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      fileKey: query.fileKey || undefined,
      fileName: query.fileName || undefined,
      currentDoc: current?.doc,
      currentRevision: query.baseRevision || current?.revision,
      mode: query.mode === 'pull' ? 'pull' : 'import',
      dryRun: query.dryRun !== 'false',
    })
    if (result.written && result.doc && result.sidecar) {
      const written = await deps.writeDoc(cwd, name, result.doc, {
        baseRevision: query.baseRevision || current?.revision,
        source: 'figma-file',
      })
      result.sidecar.binding.lastCanvasRevision = written.revision
      await writeSidecar(deps.canvasRoot(cwd), name, result.sidecar)
      deps.rememberDoc(sessionId, name)
      deps.sendJson(response, 200, { ...result, revision: written.revision, doc: undefined, sidecar: undefined })
      return true
    }
    deps.sendJson(response, 200, { ...result, doc: undefined, sidecar: undefined })
    return true
  }

  if (sub === 'push' && request.method === 'POST') {
    const body = await deps.readBody(request, 256 * 1024)
    const sessionId = String(body.sessionId ?? '')
    const { cwd } = deps.sessionCwd(sessionId)
    const name = deps.resolveName(sessionId, typeof body.name === 'string' ? body.name : undefined)
    await deps.ensureScaffold(cwd)
    const current = await deps.readDoc(cwd, name)
    const result = await planOrQueueFigmaPush({
      doc: current.doc,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      baseCanvasRevision: current.revision,
      mode: body.mode === 'proposal-frame' ? 'proposal-frame' : 'in-place',
      selectedIds: Array.isArray(body.selectedIds) ? body.selectedIds.map(String) : undefined,
      dryRun: body.dryRun !== false,
      bridge: deps.bridge,
      sessionId,
    })
    deps.sendJson(response, 200, result)
    return true
  }

  if (sub === 'comments/sync' && request.method === 'POST') {
    const body = await deps.readBody(request, 64 * 1024)
    const sessionId = String(body.sessionId ?? '')
    const { cwd } = deps.sessionCwd(sessionId)
    const name = deps.resolveName(sessionId, typeof body.name === 'string' ? body.name : undefined)
    await deps.ensureScaffold(cwd)
    const current = await deps.readDoc(cwd, name)
    const result = await syncFigmaComments({
      doc: current.doc,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      fileKey: typeof body.fileKey === 'string' ? body.fileKey : undefined,
    })
    if (result.written && 'doc' in result && result.doc && result.sidecar) {
      const written = await deps.writeDoc(cwd, name, result.doc, {
        baseRevision: current.revision,
        source: 'figma-comments',
      })
      result.sidecar.binding.lastCanvasRevision = written.revision
      await writeSidecar(deps.canvasRoot(cwd), name, result.sidecar)
      deps.sendJson(response, 200, { ...result, revision: written.revision, doc: undefined, sidecar: undefined })
      return true
    }
    deps.sendJson(response, 200, result)
    return true
  }

  if (sub === 'comments/reply' && request.method === 'POST') {
    const body = await deps.readBody(request, 64 * 1024)
    const sessionId = String(body.sessionId ?? '')
    const { cwd } = deps.sessionCwd(sessionId)
    const name = deps.resolveName(sessionId, typeof body.name === 'string' ? body.name : undefined)
    const result = await replyToFigmaComment({
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
      fileKey: typeof body.fileKey === 'string' ? body.fileKey : undefined,
      message: String(body.message ?? ''),
      parentId: typeof body.parentId === 'string' ? body.parentId : undefined,
      nodeId: typeof body.nodeId === 'string' ? body.nodeId : undefined,
    })
    deps.sendJson(response, 200, result)
    return true
  }

  if (sub === 'bundle' && request.method === 'GET') {
    const { cwd } = deps.sessionCwd(query.sessionId)
    const name = deps.resolveName(query.sessionId, query.name)
    await deps.ensureScaffold(cwd)
    const current = await deps.readDoc(cwd, name)
    const exported = await exportCanvasAsDshFig({
      doc: current.doc,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
    })
    response.writeHead(200, {
      'content-type': 'application/octet-stream',
      'content-disposition': `attachment; filename="${name}${BUNDLE_SUFFIX}"`,
      'content-length': exported.bytes.byteLength,
      'x-dsh-objects': String(exported.objects),
    })
    response.end(Buffer.from(exported.bytes))
    return true
  }

  if (sub === 'bundle/import' && request.method === 'POST') {
    const sessionId = query.sessionId
    const { cwd } = deps.sessionCwd(sessionId)
    const name = deps.resolveName(sessionId, query.name)
    await deps.ensureScaffold(cwd)
    const bytes = await readBinaryBody(request, maxTransportBytes)
    const restored = await restoreCanvasFromDshFig({
      bytes,
      canvasDir: deps.canvasRoot(cwd),
      canvasName: name,
    })
    const written = await deps.writeDoc(cwd, name, restored.doc, { source: 'figma-bundle' })
    deps.rememberDoc(sessionId, name)
    deps.sendJson(response, 200, {
      ok: true,
      name,
      revision: written.revision,
      hasSidecar: restored.hasSidecar,
      assetsRestored: restored.assetsRestored,
    })
    return true
  }

  return false
}

/**
 * Create the `canvas_figma` DSH Agent Tool.
 */
export function createFigmaTool(deps: FigmaHostDeps) {
  return {
    name: 'canvas_figma',
    description:
      'Figma ecosystem bridge: check setup_status (token/plugin/binding), generate a loopback Companion Plugin pairing code, ' +
      'import or 3-way pull from Figma URL or .fig file (preview with dryRun), plan/queue in-place or proposal-frame push patches, ' +
      'sync/reply to Figma review comments, and export/import lossless .dshfig bundles. Never asks for or echoes raw tokens.',
    parameters: {
      type: 'object',
      required: ['action'],
      additionalProperties: false,
      properties: {
        action: {
          type: 'string',
          enum: [
            'setup_status',
            'pair_start',
            'import_url',
            'import_fig',
            'pull_diff',
            'push_diff',
            'sync_comments',
            'reply_comment',
            'export_bundle',
            'import_bundle',
          ],
        },
        name: { type: 'string', description: 'canvas document name; defaults to the active canvas' },
        url: { type: 'string', description: 'Figma file or node URL (or fileKey) for import_url / pull_diff / comments' },
        path: { type: 'string', description: 'workspace-relative path to a .fig or .dshfig file' },
        mode: { type: 'string', enum: ['in-place', 'proposal-frame'], description: 'push delivery mode (default in-place)' },
        dryRun: { type: 'boolean', description: 'preview diff plan without writing (default true for pull/push)' },
        selectedIds: { type: 'array', items: { type: 'string' }, description: 'optional node IDs for selective staging' },
        resolutions: {
          type: 'object',
          additionalProperties: { type: 'string', enum: ['keep-drafi', 'take-figma', 'skip'] },
          description: 'explicit conflict resolutions keyed by conflictKey',
        },
        message: { type: 'string', description: 'comment text for reply_comment' },
        parentId: { type: 'string', description: 'Figma root comment ID when replying to an existing thread' },
        nodeId: { type: 'string', description: 'optional Drafi or Figma node ID to anchor a comment' },
        baseRevision: { type: 'string', description: 'revision guard returned by canvas_read or dryRun' },
        probe: { type: 'boolean', description: 'whether setup_status should probe GET /v1/me (default true)' },
      },
    },
    output: { schema: { type: 'object', additionalProperties: true }, render: (_args: unknown, value: unknown) => deps.renderJson(value) },
    async execute(args: Record<string, unknown>, exec: unknown) {
      const { cwd, sessionId } = await deps.workspace(exec)
      const name = deps.resolveName(sessionId, typeof args.name === 'string' ? args.name : undefined)
      await deps.ensureScaffold(cwd)
      const canvasDir = deps.canvasRoot(cwd)
      const action = String(args.action)

      if (action === 'setup_status') {
        return getFigmaSetupStatus({
          canvasDir,
          sessionId,
          canvasName: name,
          bridge: deps.bridge,
          probe: args.probe !== false,
        })
      }

      if (action === 'pair_start') {
        const pairing = deps.bridge.createPairing({ sessionId, cwd, canvasName: name })
        return {
          ok: true,
          canvasName: name,
          pairingCode: pairing.pairingCode,
          expiresAt: new Date(pairing.expiresAt).toISOString(),
          hint: 'Open Figma Desktop -> Plugins -> Development -> Drafi Companion and enter this pairingCode.',
        }
      }

      if (action === 'import_url' || action === 'pull_diff') {
        const current = await deps.readDoc(cwd, name).catch(() => null)
        const sidecar = await readSidecar(canvasDir, name).catch(() => null)
        const targetUrl = typeof args.url === 'string' && args.url ? args.url : sidecar?.binding.fileUrl ?? sidecar?.binding.fileKey
        if (!targetUrl) throw new Error('url is required (or bind the canvas to a Figma file first)')
        const result = await importFigmaFromUrl({
          url: targetUrl,
          canvasDir,
          canvasName: name,
          currentDoc: current?.doc,
          currentRevision: typeof args.baseRevision === 'string' ? args.baseRevision : current?.revision,
          mode: action === 'pull_diff' ? 'pull' : 'import',
          dryRun: action === 'pull_diff' ? args.dryRun !== false : Boolean(args.dryRun),
          selectedIds: Array.isArray(args.selectedIds) ? args.selectedIds.map(String) : undefined,
          resolutions: args.resolutions && typeof args.resolutions === 'object' ? (args.resolutions as Record<string, ConflictResolution>) : undefined,
        })
        if (result.written && 'doc' in result && result.doc && result.sidecar) {
          const written = await deps.writeDoc(cwd, name, result.doc, {
            baseRevision: typeof args.baseRevision === 'string' ? args.baseRevision : current?.revision,
            source: 'tool',
          })
          result.sidecar.binding.lastCanvasRevision = written.revision
          await writeSidecar(canvasDir, name, result.sidecar)
          deps.rememberDoc(sessionId, name)
          return { ...result, revision: written.revision, path: relative(cwd, written.file), doc: undefined, sidecar: undefined }
        }
        return { ...result, doc: undefined, sidecar: undefined }
      }

      if (action === 'import_fig') {
        if (typeof args.path !== 'string' || !args.path.trim()) throw new Error('path to .fig file is required')
        const full = assertInsideWorkspace(cwd, args.path)
        const bytes = new Uint8Array(await readFile(full))
        const current = await deps.readDoc(cwd, name).catch(() => null)
        const result = await importFigmaFromFigBytes({
          bytes,
          canvasDir,
          canvasName: name,
          fileKey: typeof args.url === 'string' ? args.url : undefined,
          currentDoc: current?.doc,
          currentRevision: typeof args.baseRevision === 'string' ? args.baseRevision : current?.revision,
          mode: current && (await readSidecar(canvasDir, name).catch(() => null)) ? 'pull' : 'import',
          dryRun: args.dryRun !== false,
          selectedIds: Array.isArray(args.selectedIds) ? args.selectedIds.map(String) : undefined,
          resolutions: args.resolutions && typeof args.resolutions === 'object' ? (args.resolutions as Record<string, ConflictResolution>) : undefined,
        })
        if (result.written && result.doc && result.sidecar) {
          const written = await deps.writeDoc(cwd, name, result.doc, {
            baseRevision: typeof args.baseRevision === 'string' ? args.baseRevision : current?.revision,
            source: 'tool',
          })
          result.sidecar.binding.lastCanvasRevision = written.revision
          await writeSidecar(canvasDir, name, result.sidecar)
          deps.rememberDoc(sessionId, name)
          return { ...result, revision: written.revision, path: relative(cwd, written.file), doc: undefined, sidecar: undefined }
        }
        return { ...result, doc: undefined, sidecar: undefined }
      }

      if (action === 'push_diff') {
        const current = await deps.readDoc(cwd, name)
        return planOrQueueFigmaPush({
          doc: current.doc,
          canvasDir,
          canvasName: name,
          baseCanvasRevision: current.revision,
          mode: (args.mode === 'proposal-frame' ? 'proposal-frame' : 'in-place') as PushApplyMode,
          selectedIds: Array.isArray(args.selectedIds) ? args.selectedIds.map(String) : undefined,
          dryRun: args.dryRun !== false,
          bridge: deps.bridge,
          sessionId,
        })
      }

      if (action === 'sync_comments') {
        const current = await deps.readDoc(cwd, name)
        const result = await syncFigmaComments({
          doc: current.doc,
          canvasDir,
          canvasName: name,
          fileKey: typeof args.url === 'string' ? args.url : undefined,
        })
        if (result.written && 'doc' in result && result.doc && result.sidecar) {
          const written = await deps.writeDoc(cwd, name, result.doc, { baseRevision: current.revision, source: 'tool' })
          result.sidecar.binding.lastCanvasRevision = written.revision
          await writeSidecar(canvasDir, name, result.sidecar)
          return { ...result, revision: written.revision, doc: undefined, sidecar: undefined }
        }
        return result
      }

      if (action === 'reply_comment') {
        return replyToFigmaComment({
          canvasDir,
          canvasName: name,
          fileKey: typeof args.url === 'string' ? args.url : undefined,
          message: String(args.message ?? ''),
          parentId: typeof args.parentId === 'string' ? args.parentId : undefined,
          nodeId: typeof args.nodeId === 'string' ? args.nodeId : undefined,
        })
      }

      if (action === 'export_bundle') {
        const current = await deps.readDoc(cwd, name)
        const exported = await exportCanvasAsDshFig({ doc: current.doc, canvasDir, canvasName: name })
        const outDir = join(canvasDir, 'exports')
        await mkdir(outDir, { recursive: true })
        const outFile = join(outDir, `${name}${BUNDLE_SUFFIX}`)
        await writeFile(outFile, exported.bytes)
        return {
          ok: true,
          format: 'dsh.fig.bundle',
          name,
          path: relative(cwd, outFile),
          bytes: exported.bytes.byteLength,
          objects: exported.objects,
          assetCount: exported.assetCount,
        }
      }

      if (action === 'import_bundle') {
        if (typeof args.path !== 'string' || !args.path.trim()) throw new Error('path to .dshfig bundle is required')
        const full = assertInsideWorkspace(cwd, args.path)
        const bytes = new Uint8Array(await readFile(full))
        const restored = await restoreCanvasFromDshFig({ bytes, canvasDir, canvasName: name })
        const written = await deps.writeDoc(cwd, name, restored.doc, { source: 'tool' })
        deps.rememberDoc(sessionId, name)
        return {
          ok: true,
          name,
          revision: written.revision,
          path: relative(cwd, written.file),
          hasSidecar: restored.hasSidecar,
          assetsRestored: restored.assetsRestored,
        }
      }

      throw new Error(`Unknown canvas_figma action "${action}"`)
    },
  }
}
