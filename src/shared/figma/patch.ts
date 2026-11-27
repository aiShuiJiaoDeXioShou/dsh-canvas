/**
 * Push Diff Planner & `FigmaSyncPatch` generator (Drafi -> Figma).
 *
 * Supports:
 * - Selective staging (push only selected frames/nodes)
 * - Optimistic locking via `expectedRemoteHash`
 * - Dual delivery modes: `in-place` (preserve URL, comments, passthrough) and `proposal-frame`
 * - Dual-baseline commit on push acknowledgement (idempotent 0-diff subsequent runs)
 */

import { dshDocToIr, extractNodeSnapshot } from './ir.js'
import { buildPlanObject, diffSnapshots } from './reconcile.js'
import type {
  FigmaDiffPlan,
  FigmaIrNode,
  FigmaPatchOperation,
  FigmaPushAck,
  FigmaSyncPatch,
  FigmaSyncSidecar,
  NodeDiffEntry,
  PushApplyMode,
  SyncedNodeBase,
} from './sync-types.js'

interface LocalIndexed {
  dshId: string
  figmaId?: string
  pageDshId: string
  pageFigmaId?: string
  parentId: string | null
  rootFrameId?: string
  index: number
  node: FigmaIrNode
  snapshot: SyncedNodeBase
}

function indexLocalDoc(doc: Record<string, unknown>, sidecar: FigmaSyncSidecar): Map<string, LocalIndexed> {
  const ir = dshDocToIr(doc, sidecar)
  const map = new Map<string, LocalIndexed>()
  for (const page of ir.pages) {
    const pageDshId = page.dshId ?? 'page-1'
    const pageFigmaId = sidecar.binding.pages[pageDshId]
    const visit = (nodes: FigmaIrNode[], parentId: string | null, rootFrameId?: string) => {
      nodes.forEach((node, index) => {
        const dshId = node.dshId ?? ''
        if (!dshId) return
        const ownRoot = rootFrameId ?? (parentId === null ? dshId : undefined)
        map.set(dshId, {
          dshId,
          figmaId: sidecar.binding.nodes[dshId],
          pageDshId,
          pageFigmaId,
          parentId,
          rootFrameId: ownRoot,
          index,
          node,
          snapshot: extractNodeSnapshot(node, parentId),
        })
        if (node.children?.length) visit(node.children, dshId, ownRoot)
      })
    }
    visit(page.children, null, undefined)
  }
  return map
}

/**
 * Plan a Push diff (local `dsh.canvas@1` vs `sidecar.base.localNodes`).
 */
export function planPushDiff(
  doc: Record<string, unknown>,
  sidecar: FigmaSyncSidecar,
  options: { canvasName?: string; baseCanvasRevision?: string } = {},
): FigmaDiffPlan {
  const localMap = indexLocalDoc(doc, sidecar)
  const entries: NodeDiffEntry[] = []
  const notices: string[] = []
  const missingAssets = new Set<string>()
  const knownAssets = new Set(Object.values(sidecar.binding.imageHashes))

  for (const [dshId, item] of localMap) {
    const base = sidecar.base.localNodes[dshId]
    const remoteBase = sidecar.base.remoteProjectedNodes[dshId] ?? base
    const passthroughPreserved = Object.keys(sidecar.passthrough[dshId] ?? {})

    for (const fill of item.node.fills ?? []) {
      if (fill.type === 'image' && fill.asset && !knownAssets.has(fill.asset)) {
        missingAssets.add(fill.asset)
      }
    }

    if (!base || !item.figmaId) {
      entries.push({
        dshId,
        figmaNodeId: item.figmaId,
        nodeName: item.node.name,
        nodeType: item.node.type,
        pageId: item.pageDshId,
        rootFrameId: item.rootFrameId,
        kind: 'added',
        fields: [],
        passthroughPreserved,
        selected: true,
      })
      continue
    }

    const fields = diffSnapshots(base, item.snapshot)
    if (fields.length === 0) continue

    const onlyMoved = fields.every((f) => f.field === 'x' || f.field === 'y' || f.field === 'parentId')
    entries.push({
      dshId,
      figmaNodeId: item.figmaId,
      nodeName: item.node.name,
      nodeType: item.node.type,
      pageId: item.pageDshId,
      rootFrameId: item.rootFrameId,
      kind: onlyMoved ? 'moved' : 'modified',
      fields,
      passthroughPreserved,
      expectedRemoteHash: remoteBase?.fingerprint,
      selected: true,
    })
  }

  // Detect local deletions of previously synced nodes
  for (const [dshId, base] of Object.entries(sidecar.base.localNodes)) {
    if (localMap.has(dshId)) continue
    const figmaNodeId = sidecar.binding.nodes[dshId]
    if (!figmaNodeId) continue
    entries.push({
      dshId,
      figmaNodeId,
      nodeName: base.name,
      nodeType: base.type,
      pageId: Object.keys(sidecar.binding.pages)[0] ?? 'page-1',
      kind: 'deleted',
      fields: [],
      passthroughPreserved: Object.keys(sidecar.passthrough[dshId] ?? {}),
      expectedRemoteHash: sidecar.base.remoteProjectedNodes[dshId]?.fingerprint,
      selected: true,
    })
  }

  return buildPlanObject(
    'push',
    'complete',
    options.canvasName ?? sidecar.canvasName,
    options.baseCanvasRevision ?? sidecar.binding.lastCanvasRevision,
    sidecar.binding.fileKey,
    entries,
    [],
    notices,
    missingAssets.size,
  )
}

/**
 * Compile selected entries of a Push `FigmaDiffPlan` into a minimal `FigmaSyncPatch`.
 */
export function buildFigmaSyncPatch(
  doc: Record<string, unknown>,
  sidecar: FigmaSyncSidecar,
  plan: FigmaDiffPlan,
  options: { mode?: PushApplyMode; selectedIds?: ReadonlySet<string> } = {},
): FigmaSyncPatch {
  const localMap = indexLocalDoc(doc, sidecar)
  const mode: PushApplyMode = options.mode ?? 'in-place'
  const operations: FigmaPatchOperation[] = []
  const missingAssets = new Set<string>()
  const knownAssets = new Set(Object.values(sidecar.binding.imageHashes))

  for (const entry of plan.entries) {
    const selected = options.selectedIds ? options.selectedIds.has(entry.dshId) : entry.selected
    if (!selected) continue

    if (entry.kind === 'deleted') {
      if (!entry.figmaNodeId) continue
      operations.push({
        op: 'delete',
        dshId: entry.dshId,
        figmaNodeId: entry.figmaNodeId,
        pageDshId: entry.pageId,
        pageFigmaId: sidecar.binding.pages[entry.pageId],
        expectedRemoteHash: entry.expectedRemoteHash,
      })
      continue
    }

    const item = localMap.get(entry.dshId)
    if (!item) continue
    for (const fill of item.node.fills ?? []) {
      if (fill.type === 'image' && fill.asset && !knownAssets.has(fill.asset)) {
        missingAssets.add(fill.asset)
      }
    }

    if (entry.kind === 'added') {
      operations.push({
        op: 'create',
        dshId: entry.dshId,
        parentDshId: item.parentId ?? undefined,
        parentFigmaNodeId: item.parentId ? sidecar.binding.nodes[item.parentId] : undefined,
        pageDshId: item.pageDshId,
        pageFigmaId: item.pageFigmaId,
        index: item.index,
        node: item.node,
      })
    } else {
      const fields: Record<string, unknown> = {}
      for (const change of entry.fields) {
        fields[change.field] = change.after
      }
      operations.push({
        op: entry.kind === 'moved' && entry.fields.some((f) => f.field === 'parentId') ? 'move' : 'update',
        dshId: entry.dshId,
        figmaNodeId: item.figmaId,
        parentDshId: item.parentId ?? undefined,
        parentFigmaNodeId: item.parentId ? sidecar.binding.nodes[item.parentId] : undefined,
        pageDshId: item.pageDshId,
        pageFigmaId: item.pageFigmaId,
        index: item.index,
        expectedRemoteHash: entry.expectedRemoteHash,
        fields,
        passthroughPreserved: entry.passthroughPreserved,
      })
    }
  }

  return {
    format: 'dsh.figma.patch',
    version: 1,
    planId: plan.planId,
    canvasName: plan.canvasName,
    fileKey: plan.fileKey,
    mode,
    baseCanvasRevision: plan.baseCanvasRevision,
    operations,
    missingAssets: [...missingAssets],
  }
}

/**
 * Commit a plugin's push acknowledgement into the sidecar.
 * Only advances baselines for applied nodes; skipped/unselected nodes preserve their old base!
 */
export function commitPushAck(
  doc: Record<string, unknown>,
  sidecar: FigmaSyncSidecar,
  ack: FigmaPushAck,
  canvasRevision: string,
): FigmaSyncSidecar {
  const next = structuredClone(sidecar)
  const localMap = indexLocalDoc(doc, next)

  if (ack.createdPageIds) {
    for (const [dshPageId, figmaPageId] of Object.entries(ack.createdPageIds)) {
      next.binding.pages[dshPageId] = figmaPageId
    }
  }
  for (const [dshId, figmaId] of Object.entries(ack.createdNodeIds)) {
    next.binding.nodes[dshId] = figmaId
  }

  for (const dshId of ack.appliedDshIds) {
    const localItem = localMap.get(dshId)
    if (!localItem) {
      // Deletion was confirmed
      delete next.binding.nodes[dshId]
      delete next.base.localNodes[dshId]
      delete next.base.remoteProjectedNodes[dshId]
      delete next.passthrough[dshId]
      continue
    }
    next.base.localNodes[dshId] = localItem.snapshot
    next.base.remoteProjectedNodes[dshId] = ack.remoteProjectedNodes?.[dshId] ?? localItem.snapshot
  }

  next.binding.lastSyncedAt = new Date().toISOString()
  next.binding.lastCanvasRevision = canvasRevision
  if (ack.remoteVersion) next.binding.lastRemoteVersion = ack.remoteVersion
  return next
}
