/**
 * High-level Figma ecosystem service orchestrating credentials, sidecars, IR adapters,
 * 3-way diff/patch, comments, `.dshfig` bundles, and the Companion Plugin bridge.
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { emptyDoc, newId, normalizeDoc } from '../../shared/format.js'
import { createInitialSidecar, dshDocToIr, irNodeToDshNode } from '../../shared/figma/ir.js'
import { buildFigmaSyncPatch, commitPushAck, planPushDiff } from '../../shared/figma/patch.js'
import { applyPullPlan, planPullDiff } from '../../shared/figma/reconcile.js'
import type {
  ConflictResolution,
  FigmaDiffPlan,
  FigmaIrDocument,
  FigmaPushAck,
  FigmaSyncPatch,
  FigmaSyncSidecar,
  PushApplyMode,
} from '../../shared/figma/sync-types.js'
import type { FigmaPluginBridge } from './bridge.js'
import { exportDshFigBundle, importDshFigBundle } from './bundle.js'
import { decodeFigmaClipboard } from './clipboard.js'
import {
  clearFigmaToken,
  getFigmaAuthStatus,
  requireFigmaAccessToken,
  saveFigmaToken,
  type CredentialStoreOptions,
  type FigmaScopeMode,
} from './credentials.js'
import { decodeFigBytesToIr } from './fig-adapter.js'
import {
  fetchFigmaAsIr,
  fetchFigmaComments,
  fetchFigmaVersions,
  mergeFigmaCommentsIntoDoc,
  parseFigmaUrl,
  postFigmaComment,
} from './rest-adapter.js'
import { readSidecar, writeSidecar } from './sidecar.js'

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
// When bundled into dist/host/main.js, import.meta.url is dist/host/main.js -> ../../ is package root
function resolvePackagePath(...segments: string[]): string {
  const fromSrc = join(PACKAGE_ROOT, ...segments)
  if (existsSync(fromSrc)) return fromSrc
  const fromDist = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', ...segments)
  return fromDist
}

export async function getFigmaSetupStatus(params: {
  canvasDir: string
  sessionId: string
  canvasName: string
  bridge: FigmaPluginBridge
  probe?: boolean
  credOptions?: CredentialStoreOptions
}) {
  const auth = await getFigmaAuthStatus({ probe: params.probe !== false }, params.credOptions)
  const sidecar = await readSidecar(params.canvasDir, params.canvasName).catch(() => null)
  const pairing = params.bridge.getForCanvas(params.sessionId, params.canvasName)
  const manifestPath = resolvePackagePath('figma-plugin', 'manifest.json')
  const setupScriptPath = resolvePackagePath('scripts', 'figma-setup.mjs')
  const figmaDesktopInstalled =
    process.platform === 'darwin'
      ? existsSync('/Applications/Figma.app') || existsSync(join(process.env.HOME ?? '', 'Applications', 'Figma.app'))
      : false

  return {
    ok: true,
    auth,
    channels: {
      clipboard: { ready: true, requiresToken: false },
      figFile: { ready: true, requiresToken: false },
      companionPlugin: {
        ready: Boolean(pairing?.connectedAt),
        paired: Boolean(pairing),
        pairingCode: pairing?.pairingCode ?? null,
        expiresAt: pairing ? new Date(pairing.expiresAt).toISOString() : null,
        requiresToken: false,
        figmaDesktopInstalled,
        manifestPath,
      },
      restApi: {
        ready: auth.configured && auth.valid,
        requiresToken: true,
        scopeMode: auth.scopeMode,
      },
    },
    binding: sidecar
      ? {
          bindingId: sidecar.binding.bindingId,
          fileKey: sidecar.binding.fileKey,
          fileName: sidecar.binding.fileName,
          fileUrl: sidecar.binding.fileUrl,
          transport: sidecar.binding.transport,
          lastSyncedAt: sidecar.binding.lastSyncedAt,
          boundNodes: Object.keys(sidecar.binding.nodes).length,
          remoteComments: sidecar.remoteComments?.items.length ?? 0,
        }
      : null,
    setupScriptPath,
    settingsUrl: 'https://www.figma.com/settings',
  }
}

export function buildCanvasFromIr(params: {
  ir: FigmaIrDocument
  imageHashes: Record<string, string>
  canvasName: string
  fileKey: string
  fileName?: string
  fileUrl?: string
  transport: FigmaSyncSidecar['binding']['transport']
}): { doc: Record<string, unknown>; sidecar: FigmaSyncSidecar } {
  const usedIds = new Set<string>()
  const pageBindings: Record<string, string> = {}
  const nodeBindings: Record<string, string> = {}
  const passthrough: Record<string, Record<string, unknown>> = {}
  const imageHashes: Record<string, string> = { ...params.imageHashes }

  const pages = params.ir.pages.map((irPage, index) => {
    const pageId = irPage.dshId && /^[A-Za-z0-9_-]{1,64}$/.test(irPage.dshId) ? irPage.dshId : `page-${index + 1}`
    if (irPage.figmaId) pageBindings[pageId] = irPage.figmaId
    const children = irPage.children.map((child) =>
      irNodeToDshNode(child, { nodeBindings, passthrough, imageHashes, usedIds }),
    )
    return {
      id: pageId,
      name: irPage.name || `Page ${index + 1}`,
      background: irPage.background ?? '#f5f5f5',
      children,
    }
  })

  const rawDoc = {
    ...emptyDoc(params.fileName ?? params.ir.fileName ?? params.canvasName),
    pages: pages.length ? pages : [{ id: 'page-1', name: 'Page 1', background: '#f5f5f5', children: [] }],
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      layoutIgnoreHidden: true,
    },
  }
  const doc = normalizeDoc(rawDoc, { touch: false })
  const localIr = dshDocToIr(doc)
  const sidecar = createInitialSidecar({
    canvasName: params.canvasName,
    canvasDocId: String(doc.id ?? newId('doc')),
    canvasRevision: 'initial',
    fileKey: params.fileKey,
    fileName: params.fileName ?? params.ir.fileName,
    fileUrl: params.fileUrl,
    transport: params.transport,
    remoteIr: params.ir,
    pageBindings,
    nodeBindings,
    passthrough,
    imageHashes,
    localIr,
  })
  return { doc, sidecar }
}

export async function importFigmaFromUrl(params: {
  url: string
  canvasDir: string
  canvasName: string
  currentDoc?: Record<string, unknown> | null
  currentRevision?: string
  mode?: 'import' | 'pull'
  dryRun?: boolean
  selectedIds?: string[]
  resolutions?: Record<string, ConflictResolution>
  credOptions?: CredentialStoreOptions
}) {
  const parsed = parseFigmaUrl(params.url)
  const token = await requireFigmaAccessToken(params.credOptions)
  const { ir, imageHashes } = await fetchFigmaAsIr(parsed.fileKey, token, params.canvasDir, {
    nodeId: parsed.nodeId,
    fetchImpl: params.credOptions?.fetchImpl,
  })

  const existingSidecar = await readSidecar(params.canvasDir, params.canvasName).catch(() => null)
  if (params.mode === 'pull' && params.currentDoc && existingSidecar) {
    const plan = planPullDiff(params.currentDoc, existingSidecar, ir, {
      canvasName: params.canvasName,
      baseCanvasRevision: params.currentRevision ?? existingSidecar.binding.lastCanvasRevision,
    })
    if (params.dryRun !== false) {
      return { ok: true, mode: 'pull', dryRun: true, written: false, plan, fileKey: parsed.fileKey }
    }
    const applied = applyPullPlan(params.currentDoc, existingSidecar, ir, plan, {
      ...(params.selectedIds ? { selectedIds: new Set(params.selectedIds) } : {}),
      ...(params.resolutions ? { resolutions: params.resolutions } : {}),
    })
    applied.sidecar.binding.imageHashes = { ...applied.sidecar.binding.imageHashes, ...imageHashes }
    return {
      ok: true,
      mode: 'pull',
      dryRun: false,
      written: true,
      plan,
      doc: normalizeDoc(applied.doc, { touch: true }),
      sidecar: applied.sidecar,
      appliedCount: applied.appliedCount,
      skippedCount: applied.skippedCount,
      fileKey: parsed.fileKey,
    }
  }

  const built = buildCanvasFromIr({
    ir,
    imageHashes,
    canvasName: params.canvasName,
    fileKey: parsed.fileKey,
    fileName: ir.fileName ?? parsed.fileName,
    fileUrl: parsed.url,
    transport: 'rest',
  })

  if (params.dryRun) {
    return {
      ok: true,
      mode: 'import',
      dryRun: true,
      written: false,
      fileKey: parsed.fileKey,
      fileName: built.doc.title,
      pages: (built.doc.pages as unknown[]).length,
      nodes: Object.keys(built.sidecar.binding.nodes).length,
      images: Object.keys(imageHashes).length,
      notices: ir.notices ?? [],
    }
  }

  return {
    ok: true,
    mode: 'import',
    dryRun: false,
    written: true,
    fileKey: parsed.fileKey,
    fileName: built.doc.title,
    doc: built.doc,
    sidecar: built.sidecar,
    nodes: Object.keys(built.sidecar.binding.nodes).length,
    images: Object.keys(imageHashes).length,
    notices: ir.notices ?? [],
  }
}

export async function importFigmaFromFigBytes(params: {
  bytes: Uint8Array
  canvasDir: string
  canvasName: string
  fileKey?: string
  fileName?: string
  currentDoc?: Record<string, unknown> | null
  currentRevision?: string
  mode?: 'import' | 'pull'
  dryRun?: boolean
  selectedIds?: string[]
  resolutions?: Record<string, ConflictResolution>
}) {
  const { ir, schemaVersion, imageHashes } = await decodeFigBytesToIr(params.bytes, params.canvasDir, {
    fileKey: params.fileKey,
    fileName: params.fileName,
  })
  const existingSidecar = await readSidecar(params.canvasDir, params.canvasName).catch(() => null)
  const fileKey = params.fileKey || existingSidecar?.binding.fileKey || `local_${newId('fig')}`

  if (params.mode === 'pull' && params.currentDoc && existingSidecar) {
    const plan = planPullDiff(params.currentDoc, existingSidecar, ir, {
      canvasName: params.canvasName,
      baseCanvasRevision: params.currentRevision ?? existingSidecar.binding.lastCanvasRevision,
    })
    if (params.dryRun !== false) {
      return { ok: true, mode: 'pull', dryRun: true, written: false, schemaVersion, plan }
    }
    const applied = applyPullPlan(params.currentDoc, existingSidecar, ir, plan, {
      ...(params.selectedIds ? { selectedIds: new Set(params.selectedIds) } : {}),
      ...(params.resolutions ? { resolutions: params.resolutions } : {}),
    })
    applied.sidecar.binding.imageHashes = { ...applied.sidecar.binding.imageHashes, ...imageHashes }
    return {
      ok: true,
      mode: 'pull',
      dryRun: false,
      written: true,
      schemaVersion,
      plan,
      doc: normalizeDoc(applied.doc, { touch: true }),
      sidecar: applied.sidecar,
      appliedCount: applied.appliedCount,
      skippedCount: applied.skippedCount,
    }
  }

  const built = buildCanvasFromIr({
    ir,
    imageHashes,
    canvasName: params.canvasName,
    fileKey,
    fileName: params.fileName ?? ir.fileName,
    transport: 'fig-file',
  })

  return {
    ok: true,
    mode: 'import',
    dryRun: Boolean(params.dryRun),
    written: !params.dryRun,
    schemaVersion,
    doc: built.doc,
    sidecar: built.sidecar,
    nodes: Object.keys(built.sidecar.binding.nodes).length,
    images: Object.keys(imageHashes).length,
    notices: ir.notices ?? [],
  }
}

export async function planOrQueueFigmaPush(params: {
  doc: Record<string, unknown>
  canvasDir: string
  canvasName: string
  baseCanvasRevision: string
  mode?: PushApplyMode
  selectedIds?: string[]
  dryRun?: boolean
  bridge?: FigmaPluginBridge
  sessionId?: string
}): Promise<{ ok: true; plan: FigmaDiffPlan; patch?: FigmaSyncPatch; queuedForPlugin?: boolean }> {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName)
  if (!sidecar) {
    throw new Error(`Canvas "${params.canvasName}" is not bound to a Figma file yet. Import or pair via Companion Plugin first.`)
  }
  const plan = planPushDiff(params.doc, sidecar, {
    canvasName: params.canvasName,
    baseCanvasRevision: params.baseCanvasRevision,
  })
  if (params.dryRun !== false) {
    return { ok: true, plan }
  }
  const patch = buildFigmaSyncPatch(params.doc, sidecar, plan, {
    mode: params.mode ?? 'in-place',
    ...(params.selectedIds ? { selectedIds: new Set(params.selectedIds) } : {}),
  })
  let queuedForPlugin = false
  if (params.bridge && params.sessionId) {
    queuedForPlugin = params.bridge.queuePatch(params.sessionId, params.canvasName, patch)
  }
  return { ok: true, plan, patch, queuedForPlugin }
}

export async function applyPluginPushAck(params: {
  doc: Record<string, unknown>
  canvasDir: string
  canvasName: string
  canvasRevision: string
  ack: FigmaPushAck
}): Promise<FigmaSyncSidecar> {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName)
  if (!sidecar) throw new Error(`Missing Figma sidecar for "${params.canvasName}"`)
  const updated = commitPushAck(params.doc, sidecar, params.ack, params.canvasRevision)
  await writeSidecar(params.canvasDir, params.canvasName, updated)
  return updated
}

export async function syncFigmaComments(params: {
  doc: Record<string, unknown>
  canvasDir: string
  canvasName: string
  fileKey?: string
  credOptions?: CredentialStoreOptions
}) {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName)
  const fileKey = params.fileKey ? parseFigmaUrl(params.fileKey).fileKey : sidecar?.binding.fileKey
  if (!fileKey) throw new Error('Specify a Figma URL/fileKey or bind this canvas to Figma first')
  const token = await requireFigmaAccessToken(params.credOptions)
  const remoteComments = await fetchFigmaComments(fileKey, token, sidecar?.binding.nodes ?? {}, params.credOptions?.fetchImpl)
  const versions = await fetchFigmaVersions(fileKey, token, params.credOptions?.fetchImpl).catch(() => [])

  if (!sidecar) {
    return { ok: true, fileKey, comments: remoteComments, versionsCount: versions.length, written: false }
  }
  const merged = mergeFigmaCommentsIntoDoc(params.doc, sidecar, remoteComments)
  return {
    ok: true,
    fileKey,
    doc: normalizeDoc(merged.doc, { touch: true }),
    sidecar: merged.sidecar,
    imported: merged.imported,
    updated: merged.updated,
    totalComments: remoteComments.length,
    versionsCount: versions.length,
    written: true,
  }
}

export async function replyToFigmaComment(params: {
  canvasDir: string
  canvasName: string
  message: string
  fileKey?: string
  parentId?: string
  nodeId?: string
  x?: number
  y?: number
  credOptions?: CredentialStoreOptions
}) {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName)
  const fileKey = params.fileKey ? parseFigmaUrl(params.fileKey).fileKey : sidecar?.binding.fileKey
  if (!fileKey) throw new Error('Specify a Figma URL/fileKey or bind this canvas to Figma first')
  const token = await requireFigmaAccessToken(params.credOptions)
  const figmaNodeId = params.nodeId && sidecar?.binding.nodes[params.nodeId] ? sidecar.binding.nodes[params.nodeId] : params.nodeId
  const posted = await postFigmaComment(
    fileKey,
    token,
    { message: params.message, parentId: params.parentId, figmaNodeId, x: params.x, y: params.y },
    params.credOptions?.fetchImpl,
  )
  return { ok: true, fileKey, comment: posted }
}

export async function exportCanvasAsDshFig(params: {
  doc: Record<string, unknown>
  canvasDir: string
  canvasName: string
}) {
  const sidecar = await readSidecar(params.canvasDir, params.canvasName).catch(() => null)
  return exportDshFigBundle({
    doc: params.doc,
    sidecar,
    loadAsset: async (relPath) => new Uint8Array(await readFile(join(params.canvasDir, relPath))),
  })
}

export async function restoreCanvasFromDshFig(params: {
  bytes: Uint8Array
  canvasDir: string
  canvasName: string
}) {
  const unpacked = importDshFigBundle(params.bytes)
  for (const [relPath, data] of unpacked.files) {
    const dest = join(params.canvasDir, relPath)
    await mkdir(dirname(dest), { recursive: true })
    await writeFile(dest, data)
  }
  if (unpacked.sidecar) {
    await writeSidecar(params.canvasDir, params.canvasName, {
      ...unpacked.sidecar,
      canvasName: params.canvasName,
    })
  }
  return {
    doc: unpacked.doc,
    hasSidecar: Boolean(unpacked.sidecar),
    assetsRestored: unpacked.files.size,
  }
}

export {
  clearFigmaToken,
  decodeFigmaClipboard,
  getFigmaAuthStatus,
  parseFigmaUrl,
  readSidecar,
  saveFigmaToken,
  writeSidecar,
  type FigmaScopeMode,
}
