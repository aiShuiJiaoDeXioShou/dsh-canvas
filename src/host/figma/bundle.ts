/**
 * Unified `.dshfig` lossless portable ZIP container (`fflate`).
 *
 * Layout inside `<name>.dshfig`:
 *   manifest.json     — { format: 'dsh.fig.bundle', version: 1, index: { 'assets/...': sha256 } }
 *   canvas.json       — clean `dsh.canvas@1` document
 *   figma.sync.json   — optional `dsh.figma.sync@1` sidecar (binding, dual base, passthrough, comments)
 *   objects/<sha256>  — zero-compression (`level: 0`) deduplicated images/fonts/snapshots
 */

import { createHash } from 'node:crypto'
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate'
import { normalizeDoc } from '../../shared/format.js'
import {
  FIGMA_SYNC_FORMAT,
  FIGMA_SYNC_VERSION,
  type FigmaSyncSidecar,
} from '../../shared/figma/sync-types.js'
import { extractDocFromLegacyArchive, isLegacyFigmaArchive } from './sidecar.js'

export const BUNDLE_FORMAT = 'dsh.fig.bundle' as const
export const BUNDLE_VERSION = 1 as const
export const BUNDLE_SUFFIX = '.dshfig'

const MAX_BUNDLE_BYTES = 256 * 1024 * 1024
const MAX_JSON_BYTES = 48 * 1024 * 1024
const ASSET_PATH_RE = /^(?:assets|fonts)\/[A-Za-z0-9._-]{1,120}$/
const OBJECT_PATH_RE = /^objects\/[0-9a-f]{64}$/

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function collectReferencedAssets(doc: Record<string, unknown>): Set<string> {
  const files = new Set<string>()
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
    } else if (value && typeof value === 'object') {
      const rec = value as Record<string, unknown>
      if (typeof rec.asset === 'string' && ASSET_PATH_RE.test(rec.asset) && !rec.asset.includes('..')) {
        files.add(rec.asset)
      }
      for (const item of Object.values(rec)) visit(item)
    }
  }
  visit(doc)
  return files
}

export async function exportDshFigBundle(params: {
  doc: Record<string, unknown>
  sidecar?: FigmaSyncSidecar | null
  loadAsset: (relPath: string) => Promise<Uint8Array>
}): Promise<{ bytes: Uint8Array; objects: number; assetCount: number }> {
  const normalizedDoc = normalizeDoc(params.doc, { touch: false })
  const assetPaths = collectReferencedAssets(normalizedDoc)
  const index: Record<string, string> = {}
  const parts: Zippable = {}
  let totalBytes = 0

  for (const relPath of assetPaths) {
    const data = await params.loadAsset(relPath)
    const hash = sha256Hex(data)
    index[relPath] = hash
    const objectKey = `objects/${hash}`
    if (!parts[objectKey]) {
      totalBytes += data.byteLength
      if (totalBytes > MAX_BUNDLE_BYTES) throw new Error('Bundle exceeds 256 MiB limit')
      // Level 0 (store) keeps export/import in the tens of milliseconds for 50 MiB+ canvases
      parts[objectKey] = [data, { level: 0 }]
    }
  }

  const canvasBytes = strToU8(JSON.stringify(normalizedDoc))
  if (canvasBytes.byteLength > MAX_JSON_BYTES) throw new Error('Canvas document exceeds bundle JSON limit')
  parts['canvas.json'] = [canvasBytes, { level: 1 }]

  if (params.sidecar) {
    const sidecarBytes = strToU8(JSON.stringify(params.sidecar))
    if (sidecarBytes.byteLength > MAX_JSON_BYTES) throw new Error('Figma sync sidecar exceeds bundle JSON limit')
    parts['figma.sync.json'] = [sidecarBytes, { level: 1 }]
  }

  const manifestBytes = strToU8(
    JSON.stringify({
      format: BUNDLE_FORMAT,
      version: BUNDLE_VERSION,
      exportedAt: new Date().toISOString(),
      hasSidecar: Boolean(params.sidecar),
      index,
    }),
  )
  parts['manifest.json'] = [manifestBytes, { level: 1 }]

  const bytes = zipSync(parts)
  return {
    bytes,
    objects: Object.keys(parts).filter((k) => k.startsWith('objects/')).length,
    assetCount: assetPaths.size,
  }
}

export function importDshFigBundle(bytes: Uint8Array): {
  doc: Record<string, unknown>
  sidecar: FigmaSyncSidecar | null
  files: Map<string, Uint8Array>
} {
  if (bytes.byteLength > MAX_BUNDLE_BYTES) throw new Error('Bundle exceeds 256 MiB limit')
  let total = 0
  const seen = new Set<string>()
  const parts = unzipSync(bytes, {
    filter: (member) => {
      const allowed =
        member.name === 'manifest.json' ||
        member.name === 'canvas.json' ||
        member.name === 'figma.sync.json' ||
        OBJECT_PATH_RE.test(member.name)
      if (!allowed) return false
      if (seen.has(member.name)) throw new Error(`Duplicate entry "${member.name}" in .dshfig bundle`)
      seen.add(member.name)
      total += member.originalSize
      if (total > MAX_BUNDLE_BYTES) throw new Error('Bundle exceeds 256 MiB decompressed limit')
      if (!member.name.startsWith('objects/') && member.originalSize > MAX_JSON_BYTES) {
        throw new Error(`Bundle JSON member "${member.name}" exceeds size limit`)
      }
      return true
    },
  })

  if (!parts['manifest.json']) throw new Error('Invalid .dshfig bundle: missing manifest.json')
  const manifest = JSON.parse(strFromU8(parts['manifest.json'])) as Record<string, unknown>

  // Transparently support legacy experimental `dsh.canvas.figma.bundle` archives
  if (manifest.format === 'dsh.canvas.figma.bundle' && isLegacyFigmaArchive(manifest.archive)) {
    const doc = extractDocFromLegacyArchive(manifest.archive)
    const files = extractIndexedFiles(manifest.index, parts)
    return { doc, sidecar: null, files }
  }

  if (manifest.format !== BUNDLE_FORMAT || manifest.version !== BUNDLE_VERSION) {
    throw new Error(`Unsupported .dshfig bundle format: ${String(manifest.format)}`)
  }
  if (!parts['canvas.json']) throw new Error('Invalid .dshfig bundle: missing canvas.json')
  const doc = normalizeDoc(JSON.parse(strFromU8(parts['canvas.json'])), { touch: false })

  let sidecar: FigmaSyncSidecar | null = null
  if (parts['figma.sync.json']) {
    const parsedSidecar = JSON.parse(strFromU8(parts['figma.sync.json'])) as Record<string, unknown>
    if (parsedSidecar.format === FIGMA_SYNC_FORMAT && parsedSidecar.version === FIGMA_SYNC_VERSION) {
      sidecar = parsedSidecar as unknown as FigmaSyncSidecar
    }
  }

  const files = extractIndexedFiles(manifest.index, parts)
  return { doc, sidecar, files }
}

function extractIndexedFiles(indexRaw: unknown, parts: Record<string, Uint8Array>): Map<string, Uint8Array> {
  const index = (indexRaw && typeof indexRaw === 'object' ? indexRaw : {}) as Record<string, unknown>
  const files = new Map<string, Uint8Array>()
  for (const [relPath, hash] of Object.entries(index)) {
    if (!ASSET_PATH_RE.test(relPath) || relPath.includes('..')) {
      throw new Error(`Invalid asset path "${relPath}" in bundle`)
    }
    if (typeof hash !== 'string' || !/^[0-9a-f]{64}$/.test(hash)) {
      throw new Error(`Invalid checksum for "${relPath}" in bundle`)
    }
    const data = parts[`objects/${hash}`]
    if (!data || sha256Hex(data) !== hash) {
      throw new Error(`Checksum mismatch for "${relPath}" in bundle`)
    }
    files.set(relPath, data)
  }
  return files
}
