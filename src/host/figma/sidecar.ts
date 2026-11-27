/**
 * Atomic sidecar persistence for `.dsh-canvas/figma/<name>.sync.json` (`dsh.figma.sync@1`),
 * plus read-only transparent migration for legacy `dsh.canvas.figma@1` single-file archives.
 */

import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { isSlug, normalizeDoc } from '../../shared/format.js'
import {
  FIGMA_SYNC_FORMAT,
  FIGMA_SYNC_VERSION,
  type FigmaSyncSidecar,
} from '../../shared/figma/sync-types.js'

const SYNC_SUFFIX = '.sync.json'
const LEGACY_ARCHIVE_FORMAT = 'dsh.canvas.figma@1'

function assertInside(root: string, target: string): string {
  const base = resolve(root)
  const full = resolve(target)
  if (full !== base && !full.startsWith(base + sep)) {
    throw new Error('path escapes .dsh-canvas directory')
  }
  return full
}

export function sidecarFile(canvasDir: string, name: string): string {
  if (!isSlug(name)) throw new Error(`invalid canvas name "${name}"`)
  return assertInside(canvasDir, join(canvasDir, 'figma', `${name}${SYNC_SUFFIX}`))
}

export async function readSidecar(canvasDir: string, name: string): Promise<FigmaSyncSidecar | null> {
  const file = sidecarFile(canvasDir, name)
  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
  const parsed = JSON.parse(raw) as Record<string, unknown>
  if (parsed?.format !== FIGMA_SYNC_FORMAT || parsed?.version !== FIGMA_SYNC_VERSION) {
    throw new Error(`Unsupported Figma sync sidecar format in ${name}${SYNC_SUFFIX}`)
  }
  return parsed as unknown as FigmaSyncSidecar
}

export async function writeSidecar(canvasDir: string, name: string, sidecar: FigmaSyncSidecar): Promise<string> {
  const file = sidecarFile(canvasDir, name)
  await mkdir(dirname(file), { recursive: true })
  const normalized: FigmaSyncSidecar = {
    ...sidecar,
    format: FIGMA_SYNC_FORMAT,
    version: FIGMA_SYNC_VERSION,
    canvasName: name,
  }
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temp, JSON.stringify(normalized, null, 2) + '\n', 'utf8')
  await rename(temp, file)
  return file
}

export async function deleteSidecar(canvasDir: string, name: string): Promise<boolean> {
  const file = sidecarFile(canvasDir, name)
  try {
    await unlink(file)
    return true
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }
    throw error
  }
}

export async function renameSidecar(canvasDir: string, from: string, to: string): Promise<boolean> {
  const existing = await readSidecar(canvasDir, from)
  if (!existing) return false
  existing.canvasName = to
  await writeSidecar(canvasDir, to, existing)
  await deleteSidecar(canvasDir, from)
  return true
}

/**
 * Read-only transparent detector & unpacker for legacy experimental `dsh.canvas.figma@1` files.
 * Keeps `.canvas.json` strictly `dsh.canvas@1` going forward.
 */
export function isLegacyFigmaArchive(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && (value as Record<string, unknown>).format === LEGACY_ARCHIVE_FORMAT)
}

export function extractDocFromLegacyArchive(raw: Record<string, unknown>): Record<string, unknown> {
  const dsh = raw.dsh && typeof raw.dsh === 'object' ? (raw.dsh as Record<string, unknown>) : {}
  const docTree = raw.document && typeof raw.document === 'object' ? (raw.document as Record<string, unknown>) : {}
  const nodesById = dsh.nodes && typeof dsh.nodes === 'object' ? (dsh.nodes as Record<string, Record<string, unknown>>) : {}

  const figmaPages = Array.isArray(docTree.children) ? (docTree.children as Array<Record<string, unknown>>) : []
  const pages = figmaPages.map((page, index) => {
    const convertChildren = (children: unknown): Array<Record<string, unknown>> => {
      if (!Array.isArray(children)) return []
      const result: Array<Record<string, unknown>> = []
      for (const child of children) {
        if (!child || typeof child !== 'object') continue
        const c = child as Record<string, unknown>
        const figId = typeof c.id === 'string' ? c.id : ''
        const ext = nodesById[figId]
        const base: Record<string, unknown> = ext ? structuredClone(ext) : {
          id: figId.replace(/[^A-Za-z0-9_-]/g, '_') || `node_${index}`,
          type: 'frame',
          name: typeof c.name === 'string' ? c.name : 'Frame',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        }
        if (base.type === 'frame' || base.type === 'group') {
          base.children = convertChildren(c.children)
        }
        result.push(base)
      }
      return result
    }
    return {
      id: typeof page.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(page.id) ? page.id : `page-${index + 1}`,
      name: typeof page.name === 'string' ? page.name : `Page ${index + 1}`,
      background: '#f5f5f5',
      children: convertChildren(page.children),
    }
  })

  return normalizeDoc(
    {
      format: 'dsh.canvas',
      version: 1,
      id: typeof dsh.id === 'string' ? dsh.id : 'canvas_migrated',
      title: typeof docTree.name === 'string' ? docTree.name : 'Migrated Canvas',
      pages: pages.length ? pages : [{ id: 'page-1', name: 'Page 1', background: '#f5f5f5', children: [] }],
      styles: Array.isArray(dsh.styles) ? dsh.styles : [],
      components: Array.isArray(dsh.components) ? dsh.components : [],
      variantSets: Array.isArray(dsh.variantSets) ? dsh.variantSets : [],
      fonts: Array.isArray(dsh.fonts) ? dsh.fonts : [],
      comments: Array.isArray(dsh.comments) ? dsh.comments : [],
    },
    { touch: false },
  )
}
