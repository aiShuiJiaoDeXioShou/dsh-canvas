/**
 * Unified Figma ecosystem contracts shared across Host, Client, and Companion Plugin.
 * Pure TypeScript types and constants — zero Node or DOM dependencies.
 */

export const FIGMA_IR_FORMAT = 'dsh.figma.ir' as const
export const FIGMA_IR_VERSION = 1 as const
export const FIGMA_SYNC_FORMAT = 'dsh.figma.sync' as const
export const FIGMA_SYNC_VERSION = 1 as const

export interface FigmaRgba {
  r: number
  g: number
  b: number
  a: number
}

export interface FigmaIrSolidFill {
  type: 'solid'
  color: string
  opacity?: number
}

export interface FigmaIrGradientStop {
  position: number
  color: string
  opacity?: number
}

export interface FigmaIrGradientFill {
  type: 'linear-gradient' | 'radial-gradient'
  angle?: number
  stops: FigmaIrGradientStop[]
  opacity?: number
}

export interface FigmaIrImageFill {
  type: 'image'
  asset?: string
  imageHash?: string
  scaleMode?: 'fill' | 'fit' | 'stretch' | 'tile'
  opacity?: number
}

export type FigmaIrFill = FigmaIrSolidFill | FigmaIrGradientFill | FigmaIrImageFill

export interface FigmaIrStroke {
  color: string
  width: number
  opacity?: number
  align?: 'inside' | 'center' | 'outside'
  dash?: number[]
}

export interface FigmaIrEffect {
  type: 'drop-shadow' | 'inner-shadow' | 'blur'
  color?: string
  x?: number
  y?: number
  blur: number
  spread?: number
  opacity?: number
}

export interface FigmaIrFont {
  family: string
  weight: number
  style?: 'normal' | 'italic'
  size: number
  lineHeight: number
  letterSpacing?: number
}

export interface FigmaIrPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface FigmaIrLayout {
  direction: 'horizontal' | 'vertical'
  gap: number
  padding: FigmaIrPadding
  alignPrimary?: 'start' | 'center' | 'end' | 'space-between'
  alignCounter?: 'start' | 'center' | 'end' | 'stretch'
  wrap?: boolean
}

export type FigmaOpaqueProps = Record<string, unknown>

export interface FigmaIrNode {
  figmaId?: string
  dshId?: string
  type: 'frame' | 'group' | 'rect' | 'ellipse' | 'line' | 'text' | 'path' | 'instance'
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
  clip?: boolean
  cornerRadius?: number
  cornerRadii?: [number, number, number, number]
  fills?: FigmaIrFill[]
  strokes?: FigmaIrStroke[]
  effects?: FigmaIrEffect[]
  layout?: FigmaIrLayout
  layoutSizing?: { h?: 'fixed' | 'hug' | 'fill'; v?: 'fixed' | 'hug' | 'fill' }
  layoutPositioning?: 'auto' | 'absolute'
  text?: string
  font?: FigmaIrFont
  align?: 'left' | 'center' | 'right' | 'justify'
  verticalAlign?: 'top' | 'center' | 'bottom'
  autoHeight?: boolean
  d?: string
  viewBox?: { x: number; y: number; width: number; height: number }
  fillRule?: 'nonzero' | 'evenodd'
  componentId?: string
  figmaComponentKey?: string
  children?: FigmaIrNode[]
  /** Figma-native properties preserved verbatim across round trips. */
  passthrough?: FigmaOpaqueProps
}

export interface FigmaIrPage {
  figmaId?: string
  dshId?: string
  name: string
  background?: string
  children: FigmaIrNode[]
}

export interface FigmaIrDocument {
  format: typeof FIGMA_IR_FORMAT
  version: typeof FIGMA_IR_VERSION
  fileKey?: string
  fileName?: string
  remoteVersion?: string
  readCompleteness: 'complete' | 'partial'
  pages: FigmaIrPage[]
  /** Optional raw binary images keyed by Figma imageHash (base64 when serialized over JSON). */
  imageAssets?: Record<string, { asset: string; sha256?: string }>
  notices?: string[]
}

export interface LogicalPageIdentity {
  id: string
  name: string
  screenshotHash?: string
  evidence?: Record<string, unknown>
}

export interface PlacementIdentity {
  placementId: string
  logicalPageId: string
}

export interface InteractionIdentity {
  interactionId: string
  fromPlacementId: string
  toPlacementId: string
  event: string
  wireIds: string[]
  labelIds: string[]
  evidence?: Record<string, unknown>
  evidenceHistory?: Array<{ recordedAt: string; fromPlacementId: string; toPlacementId: string; evidence: Record<string, unknown> }>
  evidenceStatus?: 'verified' | 'needs-recheck'
}

export interface SyncedNodeBase {
  type: FigmaIrNode['type']
  name: string
  parentId: string | null
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  cornerRadius: number
  cornerRadii?: [number, number, number, number]
  clip?: boolean
  fills?: FigmaIrFill[]
  strokes?: FigmaIrStroke[]
  effects?: FigmaIrEffect[]
  layout?: FigmaIrLayout
  layoutSizing?: { h?: 'fixed' | 'hug' | 'fill'; v?: 'fixed' | 'hug' | 'fill' }
  layoutPositioning?: 'auto' | 'absolute'
  text?: string
  font?: FigmaIrFont
  align?: 'left' | 'center' | 'right' | 'justify'
  verticalAlign?: 'top' | 'center' | 'bottom'
  d?: string
  fillRule?: 'nonzero' | 'evenodd'
  fingerprint: string
}

export interface SyncedFigmaComment {
  id: string
  parentId?: string
  message: string
  author: string
  createdAt: string
  resolvedAt?: string | null
  figmaNodeId?: string
  canvasNodeId?: string
  x?: number
  y?: number
  anchorState: 'attached' | 'unanchored-needs-relocate'
  localCommentId?: string
}

export type FigmaBindingScope =
  | { kind: 'document' }
  | { kind: 'pages'; pageIds: string[] }
  | { kind: 'subtrees'; figmaRootIds: string[] }

export interface FigmaSyncSidecar {
  format: typeof FIGMA_SYNC_FORMAT
  version: typeof FIGMA_SYNC_VERSION
  canvasName: string
  canvasDocId: string
  identities: {
    logicalPages: Record<string, LogicalPageIdentity>
    placements: Record<string, PlacementIdentity>
    interactions: Record<string, InteractionIdentity>
  }
  binding: {
    bindingId: string
    fileKey: string
    fileName?: string
    fileUrl?: string
    scope: FigmaBindingScope
    transport: 'plugin' | 'rest' | 'fig-file' | 'clipboard'
    lastSyncedAt: string
    lastCanvasRevision: string
    lastRemoteVersion?: string
    pages: Record<string, string>
    nodes: Record<string, string>
    styles: Record<string, string>
    components: Record<string, string>
    imageHashes: Record<string, string>
  }
  base: {
    localNodes: Record<string, SyncedNodeBase>
    remoteProjectedNodes: Record<string, SyncedNodeBase>
    order: Record<string, string[]>
  }
  passthrough: Record<string, FigmaOpaqueProps>
  remoteComments?: {
    syncedAt: string
    items: SyncedFigmaComment[]
  }
  nativeSnapshot?: {
    file: string
    sha256: string
    schemaVersion: number
  }
}

export type DiffKind = 'added' | 'modified' | 'moved' | 'deleted'
export type ConflictResolution = 'keep-drafi' | 'take-figma' | 'skip'
export type PushApplyMode = 'in-place' | 'proposal-frame'

export interface FieldChange {
  field: string
  before: unknown
  after: unknown
  category: 'geometry' | 'layout' | 'content' | 'style' | 'structure'
}

export interface NodeDiffEntry {
  dshId: string
  figmaNodeId?: string
  nodeName: string
  nodeType: string
  pageId: string
  rootFrameId?: string
  kind: DiffKind
  fields: FieldChange[]
  passthroughPreserved: string[]
  expectedRemoteHash?: string
  selected: boolean
}

export interface DiffConflict {
  conflictKey: string
  dshId: string
  figmaNodeId?: string
  nodeName: string
  field: string
  reason: 'both-modified' | 'deleted-remotely' | 'deleted-locally' | 'reparented' | 'type-changed'
  baseValue?: unknown
  localValue?: unknown
  remoteValue?: unknown
  resolution?: ConflictResolution
}

export interface FigmaDiffPlan {
  planId: string
  direction: 'pull' | 'push'
  readCompleteness: 'complete' | 'partial'
  canvasName: string
  baseCanvasRevision: string
  fileKey: string
  summary: {
    added: number
    modified: number
    moved: number
    deleted: number
    conflicts: number
    assetsToTransfer: number
  }
  entries: NodeDiffEntry[]
  conflicts: DiffConflict[]
  notices: string[]
}

export interface FigmaPatchOperation {
  op: 'create' | 'update' | 'move' | 'delete'
  dshId: string
  figmaNodeId?: string
  parentDshId?: string
  parentFigmaNodeId?: string
  pageDshId: string
  pageFigmaId?: string
  index?: number
  expectedRemoteHash?: string
  node?: FigmaIrNode
  fields?: Record<string, unknown>
  passthroughPreserved?: string[]
}

export interface FigmaSyncPatch {
  format: 'dsh.figma.patch'
  version: 1
  planId: string
  canvasName: string
  fileKey: string
  mode: PushApplyMode
  baseCanvasRevision: string
  operations: FigmaPatchOperation[]
  missingAssets: string[]
}

export interface FigmaPushAck {
  planId: string
  remoteVersion?: string
  appliedDshIds: string[]
  createdNodeIds: Record<string, string>
  createdPageIds?: Record<string, string>
  remoteProjectedNodes?: Record<string, SyncedNodeBase>
  skippedDshIds?: string[]
  rejected?: Array<{ dshId: string; reason: string }>
}
