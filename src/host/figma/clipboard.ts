/**
 * Figma clipboard decoder for `POST /dsh-canvas/api/figma/paste`.
 *
 * Recognizes Figma native HTML clipboard payloads containing:
 *   <!--(figmeta)<base64-json>-->
 *   <!--(figma)<base64-fig-kiwi>-->
 * Persists embedded images to `.dsh-canvas/assets/` and converts the decoded IR into
 * normalized `dsh.canvas@1` nodes + passthrough metadata. Falls back cleanly to SVG import
 * when the clipboard contains `<svg>...</svg>` (e.g. Figma "Copy as SVG").
 */

import { newId } from '../../shared/format.js'
import { irNodeToDshNode } from '../../shared/figma/ir.js'
import type { FigmaOpaqueProps } from '../../shared/figma/sync-types.js'
import { importSvgPaths } from '../../shared/path/svg-import.js'
import { decodeFigBytesToIr } from './fig-adapter.js'

const FIGMETA_RE = /<!--\(figmeta\)([A-Za-z0-9+/=\s_-]+)-->/
const FIGMA_RE = /<!--\(figma\)([A-Za-z0-9+/=\s_-]+)-->/

export interface FigmaClipboardResult {
  source: 'figma-kiwi' | 'svg'
  fileKey?: string
  nodes: Array<Record<string, unknown>>
  passthrough: Record<string, FigmaOpaqueProps>
  nodeBindings: Record<string, string>
  imageHashes: Record<string, string>
  warnings: string[]
}

export function extractFigmaClipboardPayload(html: string): { figmeta?: Record<string, unknown>; buffer: Buffer } | null {
  const figMatch = FIGMA_RE.exec(html)
  if (!figMatch) return null
  const b64 = figMatch[1].replace(/\s+/g, '')
  const buffer = Buffer.from(b64, 'base64')
  if (buffer.byteLength < 12) return null

  let figmeta: Record<string, unknown> | undefined
  const metaMatch = FIGMETA_RE.exec(html)
  if (metaMatch) {
    try {
      const parsed = JSON.parse(Buffer.from(metaMatch[1].replace(/\s+/g, ''), 'base64').toString('utf8'))
      if (parsed && typeof parsed === 'object') figmeta = parsed as Record<string, unknown>
    } catch {
      // Optional metadata; ignore malformed figmeta
    }
  }
  return { figmeta, buffer }
}

/**
 * Decode a Figma clipboard HTML or SVG payload into `dsh.canvas@1` nodes ready for insertion.
 */
export async function decodeFigmaClipboard(
  payload: { html?: string; svg?: string; text?: string; existingIds?: ReadonlySet<string> },
  canvasDir: string,
): Promise<FigmaClipboardResult> {
  const html = typeof payload.html === 'string' ? payload.html : ''
  const extracted = html ? extractFigmaClipboardPayload(html) : null

  if (extracted) {
    const fileKey = typeof extracted.figmeta?.fileKey === 'string' ? extracted.figmeta.fileKey : undefined
    const decoded = await decodeFigBytesToIr(extracted.buffer, canvasDir, { fileKey })
    const collector = {
      nodeBindings: {} as Record<string, string>,
      passthrough: {} as Record<string, FigmaOpaqueProps>,
      imageHashes: { ...decoded.imageHashes },
      usedIds: new Set<string>(payload.existingIds ?? []),
    }
    const nodes: Array<Record<string, unknown>> = []
    for (const page of decoded.ir.pages) {
      for (const child of page.children) {
        nodes.push(irNodeToDshNode(child, collector))
      }
    }
    return {
      source: 'figma-kiwi',
      ...(fileKey ? { fileKey } : {}),
      nodes,
      passthrough: collector.passthrough,
      nodeBindings: collector.nodeBindings,
      imageHashes: collector.imageHashes,
      warnings: decoded.ir.notices ?? [],
    }
  }

  // Fallback: SVG payload (from Figma "Copy as SVG" or plain SVG text)
  const svgSource = [payload.svg, payload.text, html].find(
    (s): s is string => typeof s === 'string' && /<svg[\s>]/i.test(s),
  )
  if (svgSource) {
    const imported = importSvgPaths(svgSource)
    const usedIds = new Set<string>(payload.existingIds ?? [])
    const nodes: Array<Record<string, unknown>> = imported.paths.map((p) => {
      let id = newId('path')
      while (usedIds.has(id)) id = newId('path')
      usedIds.add(id)
      return {
        id,
        type: 'path',
        name: p.name,
        x: p.viewBox.x,
        y: p.viewBox.y,
        width: p.width,
        height: p.height,
        d: p.d,
        viewBox: p.viewBox,
        fillRule: p.fillRule,
        fills: p.fills,
        strokes: p.strokes,
      }
    })
    return {
      source: 'svg',
      nodes,
      passthrough: {},
      nodeBindings: {},
      imageHashes: {},
      warnings: imported.warnings ?? [],
    }
  }

  throw new Error('Clipboard does not contain Figma Kiwi data or SVG markup')
}
