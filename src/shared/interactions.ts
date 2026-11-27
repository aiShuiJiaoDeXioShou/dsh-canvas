/** Read the interaction metadata already attached to canvas path and line nodes. */

const NODE_ID = /^[A-Za-z0-9_-]{1,64}$/
const ASSET = /^assets\/[A-Za-z0-9._-]{1,120}$/

interface DocumentNode {
  id: string
  name: string
  pageId: string
  parentId: string | null
  sourceId: string
  screenshot: string | null
  previewAsset: string | null
  visible: boolean
}

export interface InteractionEdge {
  id: string
  from: string
  to: string
  event: string
  interactionId: string
  labelId: string | null
}

interface InteractionIndex {
  nodes: Map<string, DocumentNode>
  edges: InteractionEdge[]
  wireIds: Set<string>
  placements: Map<string, string[]>
  endpointIds: Set<string>
}

interface PreviewEvent {
  edgeId: string
  direction: 'incoming' | 'outgoing'
  text: string
}

export interface InteractionTarget extends DocumentNode {
  key: string
  events: PreviewEvent[]
}

export interface InteractionScope {
  ids: Set<string>
  edges: InteractionEdge[]
  targets: InteractionTarget[]
  name: string
  anchorId: string | null
  placements: string[]
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && NODE_ID.test(value)
}

function imageAsset(fills: unknown): string | null {
  for (const value of list(fills)) {
    const fill = record(value)
    if (fill?.type === 'image' && typeof fill.asset === 'string' && ASSET.test(fill.asset) && !fill.asset.includes('..')) {
      return fill.asset
    }
  }
  return null
}

export function buildInteractionIndex(doc: unknown): InteractionIndex {
  const nodes = new Map<string, DocumentNode>()
  const edges: InteractionEdge[] = []
  const wireIds = new Set<string>()
  const endpointIds = new Set<string>()
  const entries = new Map<string, { node: Record<string, unknown>; entry: DocumentNode }>()

  function visit(value: unknown, pageId: string, parentId: string | null, parentVisible: boolean): string | null {
    const node = record(value)
    if (!node || !isId(node.id)) return null
    const screenshot = record(node.screenshot)?.id
    const entry: DocumentNode = {
      id: node.id, sourceId: node.id,
      name: typeof node.name === 'string' ? node.name : node.id,
      pageId, parentId,
      screenshot: isId(screenshot) ? screenshot : null,
      previewAsset: imageAsset(node.fills),
      visible: parentVisible && node.visible !== false,
    }
    nodes.set(entry.id, entry)
    entries.set(entry.id, { node, entry })
    for (const child of list(node.children)) {
      const childAsset = visit(child, pageId, entry.id, entry.visible)
      entry.previewAsset ??= childAsset
    }
    return entry.visible ? entry.previewAsset : null
  }

  for (const value of list(record(doc)?.pages)) {
    const page = record(value)
    if (!page || !isId(page.id)) continue
    for (const node of list(page.children)) visit(node, page.id, null, true)
  }
  const placements = new Map<string, string[]>()
  for (const { node, entry } of entries.values()) {
    const source = isId(node.pageRef) ? entries.get(node.pageRef) : null
    if (source && !source.node.pageRef) entry.sourceId = source.entry.id
    if (!entry.visible) continue
    const members = placements.get(entry.sourceId)
    if (members) members.push(entry.id)
    else placements.set(entry.sourceId, [entry.id])
  }
  for (const { node, entry } of entries.values()) {
    if (node.type !== 'path' && node.type !== 'line') continue
    const interaction = record(node.interaction)
    if (!interaction || !isId(interaction.from) || !isId(interaction.to)) continue
    const from = nodes.get(interaction.from)
    const to = nodes.get(interaction.to)
    if (!from?.visible || !to?.visible || !entry.visible) continue
    const event = typeof interaction.event === 'string' && interaction.event.trim()
      ? interaction.event.trim()
      : entry.name
    const legacyLabel = entry.id.endsWith('-arrow') ? entry.id.replace(/-arrow$/, '-event') : null
    const label = entries.get(isId(interaction.labelId) ? interaction.labelId : legacyLabel ?? '')
    const labelId = label?.node.type === 'text' && label.entry.pageId === entry.pageId &&
      (label.entry.id === interaction.labelId || (label.entry.parentId === entry.parentId &&
        (label.node.text === event || label.node.name === '触发事件')))
      ? label.entry.id
      : null
    edges.push({ id: entry.id, from: from.id, to: to.id, event, labelId, interactionId: isId(interaction.id) ? interaction.id : entry.id })
    endpointIds.add(from.id)
    endpointIds.add(to.id)
    wireIds.add(entry.id)
    if (labelId) wireIds.add(labelId)
  }

  for (const id of [...endpointIds]) {
    let node = nodes.get(id)
    while (node) {
      const members = placements.get(node.sourceId)
      if (members?.length > 1) for (const member of members) endpointIds.add(member)
      node = nodes.get(node.parentId ?? '')
    }
  }
  return { nodes, edges, wireIds, endpointIds, placements }
}

function within(index: InteractionIndex, node: DocumentNode, parentId: string): boolean {
  let current = node
  while (current) {
    if (current.id === parentId) return true
    current = index.nodes.get(current.parentId ?? '')
  }
  return false
}

export function interactionScope(index: InteractionIndex, selection: readonly string[]): InteractionScope {
  const ids = new Set<string>()
  const names = new Set<string>()
  let anchorId: string | null = null
  for (const key of selection) {
    const selected = index.nodes.get(key)
    if (!selected?.visible) continue
    const descendants = [...index.endpointIds].filter(id => within(index, index.nodes.get(id), selected.id))
    let anchor = selected
    if (!descendants.length) {
      while (anchor && !index.endpointIds.has(anchor.id) && !anchor.screenshot) {
        anchor = index.nodes.get(anchor.parentId ?? '')
      }
    }
    if (!anchor || (!descendants.length && !index.endpointIds.has(anchor.id))) continue
    names.add(index.nodes.get(anchor.sourceId)?.name ?? anchor.name)
    anchorId ??= anchor.id
    if (descendants.length) {
      for (const id of descendants) ids.add(id)
    } else {
      ids.add(anchor.id)
    }
  }

  // A single page and its children share the reference family. A container
  // keeps its own physical subtree so unrelated branches stay local.
  for (const key of selection) {
    let node = index.nodes.get(key)
    while (node?.visible && !ids.has(node.id)) node = index.nodes.get(node.parentId ?? '')
    const family = node?.visible && index.placements.get(node.sourceId)
    if (family && family.length > 1) {
      for (const member of family) {
        for (const endpoint of index.endpointIds) {
          if (within(index, index.nodes.get(endpoint), member)) ids.add(endpoint)
        }
      }
    }
  }
  const edges: InteractionEdge[] = []
  const targets = new Map<string, InteractionTarget>()
  function addTarget(id: string, sourceId: string, edge: InteractionEdge, direction: PreviewEvent['direction']) {
    if (id === sourceId) return
    let target = targets.get(id)
    if (!target) {
      target = { ...index.nodes.get(id), key: id, events: [] }
      targets.set(id, target)
    }
    target.events.push({ edgeId: edge.id, direction, text: edge.event })
  }

  for (const edge of index.edges) {
    const from = ids.has(edge.from)
    const to = ids.has(edge.to)
    if (!from && !to) continue
    edges.push(edge)
    if (from) addTarget(edge.to, edge.from, edge, 'outgoing')
    if (to) addTarget(edge.from, edge.to, edge, 'incoming')
  }

  const placements = selection.length === 1 && anchorId ? index.placements.get(index.nodes.get(anchorId).sourceId) ?? [] : []
  return { ids, edges, targets: [...targets.values()], name: [...names].join('、'), anchorId, placements }
}

export interface InteractionPresentation {
  activeEdge?: string
  placements?: readonly string[]
  anchorId?: string
  hidden: ReadonlySet<string>
  emphasized: ReadonlySet<string>
}

export function interactionPresentation(index: InteractionIndex, scope: InteractionScope, activeEdge?: string): InteractionPresentation {
  const emphasized = new Set<string>()
  for (const edge of scope.edges) {
    emphasized.add(edge.id)
    if (edge.labelId) emphasized.add(edge.labelId)
  }
  return { emphasized, activeEdge, anchorId: scope.anchorId, placements: scope.placements, hidden: new Set([...index.wireIds].filter(id => !emphasized.has(id))) }
}
