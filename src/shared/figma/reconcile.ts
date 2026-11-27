/**
 * Unified O(N) 3-Way Diff & Reconciler for `dsh.figma.ir@1` <-> `dsh.canvas@1`.
 *
 * Guarantees:
 * - Dual-baseline noise suppression (`localNodes` + `remoteProjectedNodes`, 0.01 numeric tolerance)
 *   so repeated Pull / Push produces strictly 0 changes and 0 writes.
 * - Complete-read deletion safety valve (`readCompleteness: 'partial'` NEVER emits deletions).
 * - 3-tier permanent identity reconciliation (`logicalPages` / `placements` / `interactions`):
 *   deleting a source placement never orphans remaining sibling placements; retargeting an edge
 *   preserves old evidence in history and marks `needs-recheck`.
 * - Orphan comment protection (`unanchored-needs-relocate` keeps coordinates & threads).
 * - Passthrough preservation: Drafi edits never clobber Figma-native opaque props.
 */

import { newId, walkNodes } from '../format.js'
import {
  canonicalStringify,
  dshDocToIr,
  extractNodeSnapshot,
  irNodeToDshNode,
  round2,
} from './ir.js'
import type {
  ConflictResolution,
  DiffConflict,
  FieldChange,
  FigmaDiffPlan,
  FigmaIrDocument,
  FigmaIrNode,
  FigmaSyncSidecar,
  NodeDiffEntry,
  SyncedNodeBase,
} from './sync-types.js'

const NUMERIC_TOLERANCE = 0.01

const COMPARED_FIELDS: Array<{ field: keyof SyncedNodeBase; category: FieldChange['category'] }> = [
  { field: 'name', category: 'content' },
  { field: 'x', category: 'geometry' },
  { field: 'y', category: 'geometry' },
  { field: 'width', category: 'geometry' },
  { field: 'height', category: 'geometry' },
  { field: 'rotation', category: 'geometry' },
  { field: 'opacity', category: 'style' },
  { field: 'visible', category: 'style' },
  { field: 'cornerRadius', category: 'style' },
  { field: 'cornerRadii', category: 'style' },
  { field: 'clip', category: 'layout' },
  { field: 'fills', category: 'style' },
  { field: 'strokes', category: 'style' },
  { field: 'effects', category: 'style' },
  { field: 'layout', category: 'layout' },
  { field: 'layoutSizing', category: 'layout' },
  { field: 'layoutPositioning', category: 'layout' },
  { field: 'text', category: 'content' },
  { field: 'font', category: 'content' },
  { field: 'align', category: 'content' },
  { field: 'verticalAlign', category: 'content' },
  { field: 'd', category: 'geometry' },
  { field: 'fillRule', category: 'style' },
]

export function valuesEquivalent(a: unknown, b: unknown, fieldName?: string): boolean {
  if (Object.is(a, b)) return true
  if (a === undefined && b === undefined) return true
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= NUMERIC_TOLERANCE
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, idx) => valuesEquivalent(item, b[idx], fieldName))
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as Record<string, unknown>).filter((k) => (a as Record<string, unknown>)[k] !== undefined)
    const kb = Object.keys(b as Record<string, unknown>).filter((k) => (b as Record<string, unknown>)[k] !== undefined)
    if (ka.length !== kb.length) return false
    return ka.every((k) => valuesEquivalent((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], k))
  }
  return false
}

interface IndexedNode {
  dshId: string
  figmaId?: string
  pageId: string
  rootFrameId?: string
  parentId: string | null
  node: FigmaIrNode
  snapshot: SyncedNodeBase
}

function indexIr(
  ir: FigmaIrDocument,
  figmaToDsh: ReadonlyMap<string, string>,
  figmaPageToDsh: ReadonlyMap<string, string>,
): Map<string, IndexedNode> {
  const map = new Map<string, IndexedNode>()
  for (const page of ir.pages) {
    const pageId = page.dshId ?? (page.figmaId ? figmaPageToDsh.get(page.figmaId) : undefined) ?? page.figmaId ?? 'page-1'
    const visit = (nodes: FigmaIrNode[], parentId: string | null, rootFrameId?: string) => {
      for (const node of nodes) {
        const dshId =
          node.dshId ??
          (node.figmaId ? figmaToDsh.get(node.figmaId) : undefined) ??
          (node.figmaId ? `figma_${node.figmaId.replace(/[^A-Za-z0-9_-]/g, '_')}` : newId('n'))
        const ownRoot = rootFrameId ?? (parentId === null ? dshId : undefined)
        const snapshot = extractNodeSnapshot(node, parentId)
        map.set(dshId, {
          dshId,
          figmaId: node.figmaId,
          pageId,
          rootFrameId: ownRoot,
          parentId,
          node,
          snapshot,
        })
        if (node.children?.length) visit(node.children, dshId, ownRoot)
      }
    }
    visit(page.children, null, undefined)
  }
  return map
}

export function diffSnapshots(before: SyncedNodeBase, after: SyncedNodeBase): FieldChange[] {
  const changes: FieldChange[] = []
  for (const { field, category } of COMPARED_FIELDS) {
    const prev = before[field]
    const next = after[field]
    if (!valuesEquivalent(prev, next, field)) {
      changes.push({ field, before: prev, after: next, category })
    }
  }
  if (before.parentId !== after.parentId) {
    changes.push({ field: 'parentId', before: before.parentId, after: after.parentId, category: 'structure' })
  }
  return changes
}

/**
 * Plan a Pull diff (Figma IR -> local `dsh.canvas@1` document) using dual baselines.
 */
export function planPullDiff(
  doc: Record<string, unknown>,
  sidecar: FigmaSyncSidecar,
  remoteIr: FigmaIrDocument,
  options: { canvasName: string; baseCanvasRevision: string } = {
    canvasName: sidecar.canvasName,
    baseCanvasRevision: sidecar.binding.lastCanvasRevision,
  },
): FigmaDiffPlan {
  const figmaToDsh = new Map<string, string>()
  for (const [dshId, figmaId] of Object.entries(sidecar.binding.nodes)) figmaToDsh.set(figmaId, dshId)
  const figmaPageToDsh = new Map<string, string>()
  for (const [dshId, figmaId] of Object.entries(sidecar.binding.pages)) figmaPageToDsh.set(figmaId, dshId)

  const localIr = dshDocToIr(doc, sidecar)
  const localMap = indexIr(localIr, figmaToDsh, figmaPageToDsh)
  const remoteMap = indexIr(remoteIr, figmaToDsh, figmaPageToDsh)

  const entries: NodeDiffEntry[] = []
  const conflicts: DiffConflict[] = []
  const notices: string[] = [...(remoteIr.notices ?? [])]
  if (remoteIr.readCompleteness === 'partial') {
    notices.push('远端为局部/不完整读取（partial），已启用删除安全阀：跳过所有删除项。')
  }

  const allIds = new Set<string>([
    ...localMap.keys(),
    ...remoteMap.keys(),
    ...Object.keys(sidecar.base.localNodes),
    ...Object.keys(sidecar.base.remoteProjectedNodes),
  ])

  for (const dshId of allIds) {
    const local = localMap.get(dshId)
    const remote = remoteMap.get(dshId)
    const localBase = sidecar.base.localNodes[dshId]
    const remoteBase = sidecar.base.remoteProjectedNodes[dshId] ?? localBase
    const figmaNodeId = remote?.figmaId ?? sidecar.binding.nodes[dshId]
    const passthroughPreserved = Object.keys(sidecar.passthrough[dshId] ?? {})

    // Case 1: Remote added a brand new node not present locally
    if (remote && !local) {
      if (localBase) {
        // Was synced before, deleted locally while still present remotely
        const remoteChanges = remoteBase ? diffSnapshots(remoteBase, remote.snapshot) : []
        if (remoteChanges.length > 0) {
          conflicts.push({
            conflictKey: `${dshId}:deleted-locally`,
            dshId,
            figmaNodeId,
            nodeName: remote.node.name,
            field: '*',
            reason: 'deleted-locally',
            baseValue: remoteBase,
            localValue: null,
            remoteValue: remote.snapshot,
          })
        }
        continue
      }
      entries.push({
        dshId,
        figmaNodeId,
        nodeName: remote.node.name,
        nodeType: remote.node.type,
        pageId: remote.pageId,
        rootFrameId: remote.rootFrameId,
        kind: 'added',
        fields: [],
        passthroughPreserved: Object.keys(remote.node.passthrough ?? {}),
        expectedRemoteHash: remote.snapshot.fingerprint,
        selected: true,
      })
      continue
    }

    // Case 2: Present locally, missing remotely
    if (local && !remote) {
      // Partial read safety valve: never delete when remote read was incomplete
      if (remoteIr.readCompleteness === 'partial') continue
      // Only consider deletion if this node was previously bound to Figma
      if (!figmaNodeId || !remoteBase) continue
      const localChanges = localBase ? diffSnapshots(localBase, local.snapshot) : []
      if (localChanges.length > 0) {
        conflicts.push({
          conflictKey: `${dshId}:deleted-remotely`,
          dshId,
          figmaNodeId,
          nodeName: local.node.name,
          field: '*',
          reason: 'deleted-remotely',
          baseValue: localBase,
          localValue: local.snapshot,
          remoteValue: null,
        })
      } else {
        entries.push({
          dshId,
          figmaNodeId,
          nodeName: local.node.name,
          nodeType: local.node.type,
          pageId: local.pageId,
          rootFrameId: local.rootFrameId,
          kind: 'deleted',
          fields: [],
          passthroughPreserved,
          selected: true,
        })
      }
      continue
    }

    // Case 3: Present in both local and remote
    if (local && remote) {
      if (local.snapshot.type !== remote.snapshot.type) {
        conflicts.push({
          conflictKey: `${dshId}:type`,
          dshId,
          figmaNodeId,
          nodeName: local.node.name,
          field: 'type',
          reason: 'type-changed',
          baseValue: localBase?.type,
          localValue: local.snapshot.type,
          remoteValue: remote.snapshot.type,
        })
        continue
      }

      const localChanges = localBase ? diffSnapshots(localBase, local.snapshot) : []
      const remoteChanges = remoteBase ? diffSnapshots(remoteBase, remote.snapshot) : diffSnapshots(local.snapshot, remote.snapshot)

      if (remoteChanges.length === 0) continue

      const localChangedMap = new Map(localChanges.map((c) => [c.field, c]))
      const effectiveChanges: FieldChange[] = []

      for (const rc of remoteChanges) {
        const lc = localChangedMap.get(rc.field)
        if (lc) {
          // Both changed the same field — check if they converged to the same value
          if (valuesEquivalent(lc.after, rc.after, rc.field)) continue
          conflicts.push({
            conflictKey: `${dshId}:${rc.field}`,
            dshId,
            figmaNodeId,
            nodeName: local.node.name,
            field: rc.field,
            reason: rc.field === 'parentId' ? 'reparented' : 'both-modified',
            baseValue: lc.before,
            localValue: lc.after,
            remoteValue: rc.after,
          })
        } else {
          effectiveChanges.push({
            ...rc,
            before: local.snapshot[rc.field as keyof SyncedNodeBase],
          })
        }
      }

      if (effectiveChanges.length > 0) {
        const onlyMoved = effectiveChanges.every((c) => c.field === 'x' || c.field === 'y' || c.field === 'parentId')
        entries.push({
          dshId,
          figmaNodeId,
          nodeName: remote.node.name,
          nodeType: remote.node.type,
          pageId: remote.pageId,
          rootFrameId: remote.rootFrameId,
          kind: onlyMoved ? 'moved' : 'modified',
          fields: effectiveChanges,
          passthroughPreserved,
          expectedRemoteHash: remote.snapshot.fingerprint,
          selected: true,
        })
      }
    }
  }

  return buildPlanObject('pull', remoteIr.readCompleteness, options.canvasName, options.baseCanvasRevision, sidecar.binding.fileKey, entries, conflicts, notices)
}

/**
 * Apply an approved Pull DiffPlan to a clone of `doc` and `sidecar`.
 * Fails closed if any conflict remains unresolved.
 */
export function applyPullPlan(
  doc: Record<string, unknown>,
  sidecar: FigmaSyncSidecar,
  remoteIr: FigmaIrDocument,
  plan: FigmaDiffPlan,
  options: {
    selectedIds?: ReadonlySet<string>
    resolutions?: Readonly<Record<string, ConflictResolution>>
  } = {},
): { doc: Record<string, unknown>; sidecar: FigmaSyncSidecar; appliedCount: number; skippedCount: number } {
  // Ensure every conflict has a resolution
  for (const conflict of plan.conflicts) {
    const resolved = options.resolutions?.[conflict.conflictKey] ?? conflict.resolution
    if (!resolved) {
      throw new Error(`Unresolved sync conflict on "${conflict.nodeName}" (${conflict.field}); choose keep-drafi, take-figma, or skip`)
    }
  }

  const nextDoc = structuredClone(doc)
  const nextSidecar = structuredClone(sidecar)
  const figmaToDsh = new Map<string, string>()
  for (const [dshId, figmaId] of Object.entries(nextSidecar.binding.nodes)) figmaToDsh.set(figmaId, dshId)
  const figmaPageToDsh = new Map<string, string>()
  for (const [dshId, figmaId] of Object.entries(nextSidecar.binding.pages)) figmaPageToDsh.set(figmaId, dshId)

  const remoteMap = indexIr(remoteIr, figmaToDsh, figmaPageToDsh)
  const usedIds = new Set<string>()
  walkNodes(nextDoc, (n: Record<string, unknown>) => {
    if (typeof n.id === 'string') usedIds.add(n.id)
  })

  const isSelected = (entry: NodeDiffEntry) =>
    options.selectedIds ? options.selectedIds.has(entry.dshId) : entry.selected

  let appliedCount = 0
  let skippedCount = 0
  const deletedIds = new Set<string>()
  const touchedDshIds = new Set<string>()

  // 1. Apply non-conflict entries
  for (const entry of plan.entries) {
    if (!isSelected(entry)) {
      skippedCount += 1
      continue
    }
    const remote = remoteMap.get(entry.dshId)
    if (entry.kind === 'added' && remote) {
      const targetPage = findOrCreatePage(nextDoc, nextSidecar, entry.pageId, remoteIr)
      const created = irNodeToDshNode(
        { ...remote.node, dshId: entry.dshId },
        {
          nodeBindings: nextSidecar.binding.nodes,
          passthrough: nextSidecar.passthrough,
          imageHashes: nextSidecar.binding.imageHashes,
          usedIds,
        },
      )
      insertNodeIntoParent(targetPage, created, remote.parentId)
      touchedDshIds.add(entry.dshId)
      appliedCount += 1
    } else if (entry.kind === 'deleted') {
      if (removeNodeById(nextDoc, entry.dshId)) {
        deletedIds.add(entry.dshId)
        delete nextSidecar.binding.nodes[entry.dshId]
        delete nextSidecar.base.localNodes[entry.dshId]
        delete nextSidecar.base.remoteProjectedNodes[entry.dshId]
        delete nextSidecar.passthrough[entry.dshId]
        appliedCount += 1
      }
    } else if ((entry.kind === 'modified' || entry.kind === 'moved') && remote) {
      const localNode = findMutableNode(nextDoc, entry.dshId)
      if (localNode) {
        for (const change of entry.fields) {
          applyFieldToDshNode(localNode, change.field, change.after)
        }
        if (remote.node.passthrough) {
          nextSidecar.passthrough[entry.dshId] = {
            ...(nextSidecar.passthrough[entry.dshId] ?? {}),
            ...structuredClone(remote.node.passthrough),
          }
        }
        syncEventLabelText(nextDoc, nextSidecar, entry.dshId, localNode)
        touchedDshIds.add(entry.dshId)
        appliedCount += 1
      }
    }
  }

  // 2. Apply conflict resolutions
  for (const conflict of plan.conflicts) {
    const resolution = options.resolutions?.[conflict.conflictKey] ?? conflict.resolution
    if (resolution === 'skip') {
      skippedCount += 1
      continue
    }
    const remote = remoteMap.get(conflict.dshId)
    if (resolution === 'take-figma') {
      if (conflict.reason === 'deleted-remotely') {
        if (removeNodeById(nextDoc, conflict.dshId)) {
          deletedIds.add(conflict.dshId)
          delete nextSidecar.binding.nodes[conflict.dshId]
          delete nextSidecar.base.localNodes[conflict.dshId]
          delete nextSidecar.base.remoteProjectedNodes[conflict.dshId]
          appliedCount += 1
        }
      } else if (conflict.reason === 'deleted-locally' && remote) {
        const targetPage = findOrCreatePage(nextDoc, nextSidecar, remote.pageId, remoteIr)
        const created = irNodeToDshNode(
          { ...remote.node, dshId: conflict.dshId },
          {
            nodeBindings: nextSidecar.binding.nodes,
            passthrough: nextSidecar.passthrough,
            imageHashes: nextSidecar.binding.imageHashes,
            usedIds,
          },
        )
        insertNodeIntoParent(targetPage, created, remote.parentId)
        touchedDshIds.add(conflict.dshId)
        appliedCount += 1
      } else {
        const localNode = findMutableNode(nextDoc, conflict.dshId)
        if (localNode) {
          applyFieldToDshNode(localNode, conflict.field, conflict.remoteValue)
          syncEventLabelText(nextDoc, nextSidecar, conflict.dshId, localNode)
          touchedDshIds.add(conflict.dshId)
          appliedCount += 1
        }
      }
    } else if (resolution === 'keep-drafi') {
      // Keep local value; update remoteProjectedBase so we don't keep prompting for the same remote state
      if (remote) {
        nextSidecar.base.remoteProjectedNodes[conflict.dshId] = remote.snapshot
      }
      appliedCount += 1
    }
  }

  // 3. Reconcile 3-tier permanent identities & orphan comments on node deletions
  if (deletedIds.size > 0) {
    reconcileDeletedPlacementsAndComments(nextDoc, nextSidecar, deletedIds)
  }

  // 4. Refresh dual baselines ONLY for touched nodes (unselected nodes keep old baselines!)
  const updatedLocalIr = dshDocToIr(nextDoc, nextSidecar)
  const updatedLocalMap = indexIr(updatedLocalIr, figmaToDsh, figmaPageToDsh)
  for (const dshId of touchedDshIds) {
    const localSnap = updatedLocalMap.get(dshId)?.snapshot
    const remoteSnap = remoteMap.get(dshId)?.snapshot
    if (localSnap) nextSidecar.base.localNodes[dshId] = localSnap
    if (remoteSnap) nextSidecar.base.remoteProjectedNodes[dshId] = remoteSnap
  }

  nextSidecar.binding.lastSyncedAt = new Date().toISOString()
  if (remoteIr.remoteVersion) nextSidecar.binding.lastRemoteVersion = remoteIr.remoteVersion

  return { doc: nextDoc, sidecar: nextSidecar, appliedCount, skippedCount }
}

/**
 * Reconcile 3-tier identities when a physical node (e.g., G31 source `start-0`) is deleted:
 * - Sibling placements keep their `logicalPageId`; if legacy `pageRef` pointed to a deleted node,
 *   promote a surviving sibling placement as the new `pageRef` anchor so branches are never lost!
 * - Comments anchored on deleted nodes move to `unanchored-needs-relocate` preserving coordinates and replies.
 */
export function reconcileDeletedPlacementsAndComments(
  doc: Record<string, unknown>,
  sidecar: FigmaSyncSidecar,
  deletedIds: ReadonlySet<string>,
): void {
  // 1. Repoint surviving pageRef placements via logicalPageId
  const survivingByLogical = new Map<string, string[]>()
  for (const [placementId, placement] of Object.entries(sidecar.identities.placements)) {
    if (deletedIds.has(placementId)) {
      delete sidecar.identities.placements[placementId]
      continue
    }
    const list = survivingByLogical.get(placement.logicalPageId) ?? []
    list.push(placementId)
    survivingByLogical.set(placement.logicalPageId, list)
  }

  // Also promote legacy pageRef chains when a source node is deleted
  const nodesById = new Map<string, Record<string, unknown>>()
  walkNodes(doc, (n: Record<string, unknown>) => {
    if (typeof n.id === 'string') nodesById.set(n.id, n)
  })
  const refsToDeleted = new Map<string, Array<Record<string, unknown>>>()
  for (const node of nodesById.values()) {
    if (typeof node.pageRef === 'string' && deletedIds.has(node.pageRef)) {
      const list = refsToDeleted.get(node.pageRef) ?? []
      list.push(node)
      refsToDeleted.set(node.pageRef, list)
    }
  }
  for (const [, orphans] of refsToDeleted) {
    const [newAnchor, ...rest] = orphans
    if (!newAnchor || typeof newAnchor.id !== 'string') continue
    delete newAnchor.pageRef
    for (const sibling of rest) {
      sibling.pageRef = newAnchor.id
    }
  }

  // 2. Preserve comments anchored to deleted nodes as unanchored-needs-relocate
  if (sidecar.remoteComments) {
    for (const item of sidecar.remoteComments.items) {
      if (item.canvasNodeId && deletedIds.has(item.canvasNodeId)) {
        item.anchorState = 'unanchored-needs-relocate'
      }
    }
  }
  if (Array.isArray(doc.comments)) {
    for (const comment of doc.comments as Array<Record<string, unknown>>) {
      if (typeof comment.nodeId === 'string' && deletedIds.has(comment.nodeId)) {
        comment.anchorState = 'unanchored-needs-relocate'
        comment.formerNodeId = comment.nodeId
        delete comment.nodeId
      }
    }
  }
}

/**
 * Record interaction retargeting: archives old verified evidence into history and marks `needs-recheck`.
 */
export function retargetInteractionIdentity(
  sidecar: FigmaSyncSidecar,
  interactionId: string,
  newToPlacementId: string,
): void {
  const interaction = sidecar.identities.interactions[interactionId]
  if (!interaction || interaction.toPlacementId === newToPlacementId) return
  if (interaction.evidence) {
    interaction.evidenceHistory = interaction.evidenceHistory ?? []
    interaction.evidenceHistory.push({
      recordedAt: new Date().toISOString(),
      fromPlacementId: interaction.fromPlacementId,
      toPlacementId: interaction.toPlacementId,
      evidence: structuredClone(interaction.evidence),
    })
  }
  interaction.toPlacementId = newToPlacementId
  interaction.evidenceStatus = 'needs-recheck'
}

/** Keep managed interaction.event and all sibling labelIds synchronized when any label text changes. */
function syncEventLabelText(
  doc: Record<string, unknown>,
  sidecar: FigmaSyncSidecar,
  changedDshId: string,
  changedNode: Record<string, unknown>,
): void {
  if (changedNode.type !== 'text' || typeof changedNode.text !== 'string') return
  for (const interaction of Object.values(sidecar.identities.interactions)) {
    if (!interaction.labelIds.includes(changedDshId)) continue
    interaction.event = changedNode.text
    for (const labelId of interaction.labelIds) {
      if (labelId === changedDshId) continue
      const sibling = findMutableNode(doc, labelId)
      if (sibling && sibling.type === 'text') sibling.text = changedNode.text
    }
  }
}

function applyFieldToDshNode(node: Record<string, unknown>, field: string, value: unknown): void {
  if (field === 'parentId') return
  if (value === undefined) {
    delete node[field]
    return
  }
  if (field === 'x' || field === 'y' || field === 'width' || field === 'height' || field === 'rotation' || field === 'cornerRadius' || field === 'opacity') {
    node[field] = typeof value === 'number' ? round2(value) : value
    return
  }
  node[field] = structuredClone(value)
}

function findMutableNode(doc: Record<string, unknown>, id: string): Record<string, unknown> | null {
  let found: Record<string, unknown> | null = null
  walkNodes(doc, (n: Record<string, unknown>) => {
    if (n.id === id) found = n
  })
  return found
}

function removeNodeById(doc: Record<string, unknown>, id: string): boolean {
  const pages = Array.isArray(doc.pages) ? (doc.pages as Array<Record<string, unknown>>) : []
  const removeFromList = (list: Array<Record<string, unknown>>): boolean => {
    const idx = list.findIndex((n) => n.id === id)
    if (idx >= 0) {
      list.splice(idx, 1)
      return true
    }
    for (const item of list) {
      if (Array.isArray(item.children) && removeFromList(item.children as Array<Record<string, unknown>>)) {
        return true
      }
    }
    return false
  }
  for (const page of pages) {
    if (Array.isArray(page.children) && removeFromList(page.children as Array<Record<string, unknown>>)) {
      return true
    }
  }
  return false
}

function findOrCreatePage(
  doc: Record<string, unknown>,
  sidecar: FigmaSyncSidecar,
  pageId: string,
  remoteIr: FigmaIrDocument,
): Record<string, unknown> {
  const pages = (Array.isArray(doc.pages) ? doc.pages : (doc.pages = [])) as Array<Record<string, unknown>>
  const existing = pages.find((p) => p.id === pageId)
  if (existing) return existing
  const remotePage = remoteIr.pages.find((p) => p.dshId === pageId || p.figmaId === pageId)
  const newPageId = /^[A-Za-z0-9_-]{1,64}$/.test(pageId) ? pageId : newId('page')
  const page: Record<string, unknown> = {
    id: newPageId,
    name: remotePage?.name ?? 'Page',
    background: remotePage?.background ?? '#f5f5f5',
    children: [],
  }
  pages.push(page)
  if (remotePage?.figmaId) sidecar.binding.pages[newPageId] = remotePage.figmaId
  return page
}

function insertNodeIntoParent(
  page: Record<string, unknown>,
  node: Record<string, unknown>,
  parentId: string | null,
): void {
  if (parentId) {
    const parent = findMutableNode({ pages: [page] }, parentId)
    if (parent && (parent.type === 'frame' || parent.type === 'group')) {
      const children = (Array.isArray(parent.children) ? parent.children : (parent.children = [])) as Array<Record<string, unknown>>
      children.push(node)
      return
    }
  }
  const children = (Array.isArray(page.children) ? page.children : (page.children = [])) as Array<Record<string, unknown>>
  children.push(node)
}

export function buildPlanObject(
  direction: 'pull' | 'push',
  readCompleteness: 'complete' | 'partial',
  canvasName: string,
  baseCanvasRevision: string,
  fileKey: string,
  entries: NodeDiffEntry[],
  conflicts: DiffConflict[],
  notices: string[],
  assetsToTransfer = 0,
): FigmaDiffPlan {
  let added = 0
  let modified = 0
  let moved = 0
  let deleted = 0
  for (const e of entries) {
    if (e.kind === 'added') added += 1
    else if (e.kind === 'modified') modified += 1
    else if (e.kind === 'moved') moved += 1
    else if (e.kind === 'deleted') deleted += 1
  }
  const planId = `plan_${canonicalStringify({ direction, baseCanvasRevision, added, modified, moved, deleted, conflicts: conflicts.length }).length}_${newId('p')}`
  return {
    planId,
    direction,
    readCompleteness,
    canvasName,
    baseCanvasRevision,
    fileKey,
    summary: { added, modified, moved, deleted, conflicts: conflicts.length, assetsToTransfer },
    entries,
    conflicts,
    notices,
  }
}
