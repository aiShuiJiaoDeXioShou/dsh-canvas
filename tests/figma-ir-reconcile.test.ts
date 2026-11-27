import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyDoc, normalizeDoc } from '../src/shared/format.js'
import { buildScene } from '../src/shared/scene/resolve.js'
import { layoutScene } from '../src/shared/scene/layout.js'
import {
  createInitialSidecar,
  dshDocToIr,
  figmaRgbaToHex,
  hexToFigmaRgba,
} from '../src/shared/figma/ir.js'
import {
  applyPullPlan,
  planPullDiff,
  retargetInteractionIdentity,
} from '../src/shared/figma/reconcile.js'
import {
  buildFigmaSyncPatch,
  commitPushAck,
  planPushDiff,
} from '../src/shared/figma/patch.js'
import type { FigmaIrDocument } from '../src/shared/figma/sync-types.js'

test('hexToFigmaRgba and figmaRgbaToHex compose 8-digit hex alpha with opacity cleanly', () => {
  const rgba = hexToFigmaRgba('#ff008080', 0.5)
  assert.equal(rgba.r, 1)
  assert.equal(rgba.g, 0)
  assert.ok(Math.abs(rgba.b - 128 / 255) < 0.005)
  assert.ok(Math.abs(rgba.a - (128 / 255) * 0.5) < 0.005)

  const back = figmaRgbaToHex({ r: 1, g: 0, b: 0.5, a: 1 }, 0.25)
  assert.equal(back.color, '#ff0080')
  assert.equal(back.opacity, 0.25)
})

test('dsh.canvas@1 supports cornerRadii, layoutPositioning absolute, and ignoreHidden in auto-layout', () => {
  const doc = normalizeDoc({
    ...emptyDoc('Layout Alignment'),
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        children: [
          {
            id: 'card',
            type: 'frame',
            name: 'Card',
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            cornerRadii: [12, 12, 4, 4],
            layout: { direction: 'vertical', gap: 10, padding: { top: 10, right: 10, bottom: 10, left: 10 }, ignoreHidden: true },
            children: [
              { id: 'c1', type: 'rect', name: 'A', x: 0, y: 0, width: 100, height: 30 },
              { id: 'c_hidden', type: 'rect', name: 'Hidden', x: 0, y: 0, width: 100, height: 50, visible: false },
              { id: 'c2', type: 'rect', name: 'B', x: 0, y: 0, width: 100, height: 30 },
              { id: 'badge', type: 'rect', name: 'Badge', x: 250, y: 8, width: 24, height: 24, layoutPositioning: 'absolute' },
            ],
          },
        ],
      },
    ],
  })

  const scene = buildScene(doc, { pageId: 'page-1' })
  layoutScene(scene)
  const card = scene.byKey.get('card')
  const c1 = scene.byKey.get('c1')
  const c2 = scene.byKey.get('c2')
  const badge = scene.byKey.get('badge')

  assert.deepEqual(card.cornerRadii, [12, 12, 4, 4])
  assert.equal(c1.y, 10)
  // c_hidden is skipped, so c2 sits right after c1 + gap (10 + 30 + 10 = 50)
  assert.equal(c2.y, 50)
  // badge is absolute, keeping its authored coordinates
  assert.equal(badge.x, 250)
  assert.equal(badge.y, 8)

  // Headless dshDocToIr computes exact auto-layout child positions instead of (0,0)
  const ir = dshDocToIr(doc)
  const irCard = ir.pages[0].children[0]
  assert.equal(irCard.children?.[2]?.y, 50)
})

test('dual-baseline 3-way merge suppresses 0.01 jitter and font-fallback noise for 0-write idempotency', () => {
  const doc = normalizeDoc({
    ...emptyDoc('Sync Test'),
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        children: [
          {
            id: 'title',
            type: 'text',
            name: 'Title',
            x: 20,
            y: 40,
            width: 200,
            height: 28,
            text: 'Hello',
            font: { family: 'Noto Sans SC', weight: 600, size: 18, lineHeight: 1.4 },
            fills: [{ type: 'solid', color: '#111827' }],
          },
        ],
      },
    ],
  })

  const localIr = dshDocToIr(doc)
  // Simulate Figma projecting Noto Sans SC SemiBold (600) -> Medium (500) + tiny float jitter
  const remoteProjected: FigmaIrDocument = structuredClone(localIr)
  remoteProjected.pages[0].children[0].figmaId = '1:2'
  remoteProjected.pages[0].children[0].font = { family: 'Noto Sans SC', weight: 500, size: 18, lineHeight: 1.4 }
  remoteProjected.pages[0].children[0].x = 20.004

  const sidecar = createInitialSidecar({
    canvasName: 'main',
    canvasDocId: doc.id,
    canvasRevision: 'rev1',
    fileKey: 'FILEKEY12345',
    transport: 'plugin',
    remoteIr: remoteProjected,
    localIr,
    pageBindings: { 'page-1': '0:1' },
    nodeBindings: { title: '1:2' },
    passthrough: { title: { blendMode: 'MULTIPLY', reactions: [{ trigger: 'ON_CLICK' }] } },
  })

  // Repeating pull with same projected remote values yields strictly 0 changes
  const plan = planPullDiff(doc, sidecar, remoteProjected, { canvasName: 'main', baseCanvasRevision: 'rev1' })
  assert.equal(plan.entries.length, 0)
  assert.equal(plan.conflicts.length, 0)
})

test('partial read deletion safety valve never emits deletions when remote read is incomplete', () => {
  const doc = normalizeDoc({
    ...emptyDoc('Partial Safety'),
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        children: [
          { id: 'n1', type: 'rect', name: 'Keep', x: 0, y: 0, width: 100, height: 100 },
          { id: 'n2', type: 'rect', name: 'Offscreen', x: 200, y: 0, width: 100, height: 100 },
        ],
      },
    ],
  })
  const fullIr = dshDocToIr(doc)
  fullIr.pages[0].children[0].figmaId = '1:1'
  fullIr.pages[0].children[1].figmaId = '1:2'

  const sidecar = createInitialSidecar({
    canvasName: 'main',
    canvasDocId: doc.id,
    canvasRevision: 'rev1',
    fileKey: 'FILEKEY12345',
    transport: 'rest',
    remoteIr: fullIr,
    localIr: fullIr,
    pageBindings: { 'page-1': '0:1' },
    nodeBindings: { n1: '1:1', n2: '1:2' },
    passthrough: {},
  })

  // Partial remote read returns only n1
  const partialIr: FigmaIrDocument = {
    ...structuredClone(fullIr),
    readCompleteness: 'partial',
    pages: [{ ...fullIr.pages[0], children: [fullIr.pages[0].children[0]] }],
  }

  const plan = planPullDiff(doc, sidecar, partialIr, { canvasName: 'main', baseCanvasRevision: 'rev1' })
  assert.equal(plan.summary.deleted, 0)
  assert.equal(plan.readCompleteness, 'partial')
})

test('G31 3+1+1 -> G42 micro-benchmark: deleting source placement preserves siblings, evidence, and orphan comments', () => {
  const doc = normalizeDoc({
    ...emptyDoc('G31 Benchmark'),
    pages: [
      {
        id: 'page-1',
        name: 'Flow',
        children: [
          { id: 'start-0', type: 'frame', name: 'Start 0', x: 0, y: 0, width: 200, height: 400, children: [] },
          { id: 'start-1', type: 'frame', name: 'Start 1', x: 300, y: 0, width: 200, height: 400, pageRef: 'start-0', children: [] },
          { id: 'start-2', type: 'frame', name: 'Start 2', x: 600, y: 0, width: 200, height: 400, pageRef: 'start-0', children: [] },
          { id: 'g42', type: 'frame', name: 'G42', x: 900, y: 0, width: 200, height: 400, children: [] },
          { id: 'lbl-1', type: 'text', name: 'Event Label', x: 220, y: 180, width: 120, height: 24, text: '点 Video Quality' },
        ],
      },
    ],
    comments: [
      { id: 'c1', pageId: 'page-1', nodeId: 'start-0', x: 0.5, y: 0.5, body: 'Review Start 0', author: 'user', replies: [{ id: 'r1', body: 'Keep thread', author: 'ai' }] },
    ],
  })

  const baseIr = dshDocToIr(doc)
  baseIr.pages[0].children.forEach((c, idx) => { c.figmaId = `10:${idx + 1}` })
  const sidecar = createInitialSidecar({
    canvasName: 'g31',
    canvasDocId: doc.id,
    canvasRevision: 'rev1',
    fileKey: 'G31FILEKEY00',
    transport: 'plugin',
    remoteIr: baseIr,
    localIr: baseIr,
    pageBindings: { 'page-1': '0:1' },
    nodeBindings: { 'start-0': '10:1', 'start-1': '10:2', 'start-2': '10:3', g42: '10:4', 'lbl-1': '10:5' },
    passthrough: { g42: { reactions: [{ action: 'NAVIGATE' }] } },
  })
  sidecar.identities.logicalPages['lp-start'] = { id: 'lp-start', name: 'Start Page' }
  sidecar.identities.placements['start-0'] = { placementId: 'start-0', logicalPageId: 'lp-start' }
  sidecar.identities.placements['start-1'] = { placementId: 'start-1', logicalPageId: 'lp-start' }
  sidecar.identities.placements['start-2'] = { placementId: 'start-2', logicalPageId: 'lp-start' }
  sidecar.identities.interactions['ix-vq'] = {
    interactionId: 'ix-vq',
    fromPlacementId: 'start-1',
    toPlacementId: 'g42',
    event: '点 Video Quality',
    wireIds: ['w1'],
    labelIds: ['lbl-1'],
    evidence: { verifiedIn: 'ios-sim-2026' },
    evidenceStatus: 'verified',
  }

  // Local edit: move start-1
  doc.pages[0].children[1].y = 80
  // Remote edit: delete start-0, move g42, rename lbl-1 text
  const remoteIr = structuredClone(baseIr)
  remoteIr.pages[0].children = remoteIr.pages[0].children.filter((c) => c.figmaId !== '10:1')
  remoteIr.pages[0].children.find((c) => c.figmaId === '10:4')!.y = 120
  remoteIr.pages[0].children.find((c) => c.figmaId === '10:5')!.text = '点视频画质'

  const plan = planPullDiff(doc, sidecar, remoteIr, { canvasName: 'g31', baseCanvasRevision: 'rev2' })
  assert.equal(plan.conflicts.length, 0)
  assert.equal(plan.summary.deleted, 1)

  const applied = applyPullPlan(doc, sidecar, remoteIr, plan)
  const finalNodes = applied.doc.pages[0].children as Array<Record<string, unknown>>
  const s1 = finalNodes.find((n) => n.id === 'start-1')!
  const s2 = finalNodes.find((n) => n.id === 'start-2')!
  const g42 = finalNodes.find((n) => n.id === 'g42')!
  const lbl = finalNodes.find((n) => n.id === 'lbl-1')!

  // Local move + remote move + event label update all merged cleanly
  assert.equal(s1.y, 80)
  assert.equal(g42.y, 120)
  assert.equal(lbl.text, '点视频画质')
  assert.equal(applied.sidecar.identities.interactions['ix-vq'].event, '点视频画质')
  assert.deepEqual(applied.sidecar.identities.interactions['ix-vq'].evidence, { verifiedIn: 'ios-sim-2026' })

  // Deleting start-0 promoted start-1 as anchor and re-pointed start-2 -> start-1 without breaking logicalPageId
  assert.equal(s1.pageRef, undefined)
  assert.equal(s2.pageRef, 'start-1')
  assert.equal(applied.sidecar.identities.placements['start-1'].logicalPageId, 'lp-start')
  assert.equal(applied.sidecar.identities.placements['start-2'].logicalPageId, 'lp-start')

  // Passthrough preserved on g42
  assert.ok(applied.sidecar.passthrough['g42']?.reactions)

  // Orphan comment transitions to unanchored-needs-relocate preserving thread & validating under normalizeDoc
  const orphan = (applied.doc.comments as Array<Record<string, unknown>>)[0]
  assert.equal(orphan.anchorState, 'unanchored-needs-relocate')
  assert.equal(orphan.nodeId, undefined)
  assert.equal((orphan.replies as unknown[]).length, 1)
  assert.doesNotThrow(() => normalizeDoc(applied.doc, { touch: false }))

  // Retargeting interaction archives old evidence & marks needs-recheck
  retargetInteractionIdentity(applied.sidecar, 'ix-vq', 'start-2')
  assert.equal(applied.sidecar.identities.interactions['ix-vq'].evidenceStatus, 'needs-recheck')
  assert.equal(applied.sidecar.identities.interactions['ix-vq'].evidenceHistory?.length, 1)

  // Re-pulling same remote state produces 0 changes (strict idempotency!)
  const secondPlan = planPullDiff(applied.doc, applied.sidecar, remoteIr, { canvasName: 'g31', baseCanvasRevision: 'rev3' })
  assert.equal(secondPlan.entries.length, 0)
  assert.equal(secondPlan.conflicts.length, 0)
})

test('Push diff plans minimal patch, supports proposal-frame, and commitPushAck makes subsequent push a 0-diff no-op', () => {
  const doc = normalizeDoc({
    ...emptyDoc('Push Test'),
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        children: [
          { id: 'box', type: 'rect', name: 'Box', x: 10, y: 20, width: 100, height: 60, fills: [{ type: 'solid', color: '#3b82f6' }] },
        ],
      },
    ],
  })
  const baseIr = dshDocToIr(doc)
  baseIr.pages[0].children[0].figmaId = '2:1'
  const sidecar = createInitialSidecar({
    canvasName: 'push',
    canvasDocId: doc.id,
    canvasRevision: 'rev1',
    fileKey: 'PUSHKEY12345',
    transport: 'plugin',
    remoteIr: baseIr,
    localIr: baseIr,
    pageBindings: { 'page-1': '0:1' },
    nodeBindings: { box: '2:1' },
    passthrough: { box: { blendMode: 'OVERLAY' } },
  })

  // Modify box width and add a new text node
  doc.pages[0].children[0].width = 180
  doc.pages[0].children.push({
    id: 'label',
    type: 'text',
    name: 'Label',
    x: 10,
    y: 90,
    width: 120,
    height: 24,
    text: 'New',
    font: { family: 'Inter', weight: 400, size: 14, lineHeight: 1.4 },
    fills: [{ type: 'solid', color: '#111827' }],
  })

  const plan = planPushDiff(doc, sidecar, { canvasName: 'push', baseCanvasRevision: 'rev2' })
  assert.equal(plan.summary.modified, 1)
  assert.equal(plan.summary.added, 1)

  const patch = buildFigmaSyncPatch(doc, sidecar, plan, { mode: 'proposal-frame' })
  assert.equal(patch.mode, 'proposal-frame')
  assert.equal(patch.operations.length, 2)
  const updateOp = patch.operations.find((op) => op.dshId === 'box')!
  assert.deepEqual(updateOp.fields, { width: 180 })
  assert.deepEqual(updateOp.passthroughPreserved, ['blendMode'])

  const committed = commitPushAck(
    doc,
    sidecar,
    { planId: plan.planId, appliedDshIds: ['box', 'label'], createdNodeIds: { label: '2:2' } },
    'rev2',
  )
  assert.equal(committed.binding.nodes['label'], '2:2')

  const afterPlan = planPushDiff(doc, committed, { canvasName: 'push', baseCanvasRevision: 'rev2' })
  assert.equal(afterPlan.entries.length, 0)
})
