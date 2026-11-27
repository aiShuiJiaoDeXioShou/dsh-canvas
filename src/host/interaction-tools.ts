import { randomUUID } from 'node:crypto'
import { buildInteractionIndex, interactionScope } from '../shared/interactions.js'

interface LiveClient {
  file: string
  sessionId: string
  response: { write(chunk: string): unknown }
}

interface ViewReply {
  ok: boolean
  [key: string]: unknown
}

interface Pending {
  sessionId: string
  complete(result: ViewReply): void
}

export function createInteractionChannel() {
  const pending = new Map<string, Pending>()
  function request(clients: Set<LiveClient>, file: string, sessionId: string, action: string, nodeId?: string) {
    const client = [...clients].reverse().find(entry => entry.file === file && entry.sessionId === sessionId)
    if (!client) return Promise.resolve({ ok: false, error: 'no-live-canvas', message: 'Open this canvas in the current session first.' })
    const requestId = randomUUID()
    return new Promise<ViewReply>((resolve) => {
      const complete = (result: ViewReply) => {
        clearTimeout(timer)
        pending.delete(requestId)
        resolve(result)
      }
      const timer = setTimeout(() => complete({ ok: false, error: 'view-timeout', message: 'The live canvas did not confirm the interaction request.' }), 5000)
      pending.set(requestId, { sessionId, complete })
      try {
        client.response.write(`data: ${JSON.stringify({ type: 'interaction-view-request', requestId, action, nodeId })}\n\n`)
      } catch {
        complete({ ok: false, error: 'no-live-canvas', message: 'The live canvas disconnected.' })
      }
    })
  }

  return {
    request,
    reply(sessionId: string, requestId: string, result: ViewReply) {
      const entry = pending.get(requestId)
      if (!entry || entry.sessionId !== sessionId) return false
      entry.complete(result)
      return true
    },
    dispose() {
      for (const entry of pending.values()) entry.complete({ ok: false, error: 'plugin-unloaded' })
    },
  }
}

export function describeInteractions(doc: unknown, options: { ids?: string[]; offset?: number; limit?: number } = {}) {
  const index = buildInteractionIndex(doc)
  const ids = options.ids ?? []
  const scope = ids.length ? interactionScope(index, ids) : null
  const all = scope?.edges ?? index.edges
  const offset = Math.max(0, Math.floor(options.offset || 0))
  const limit = Math.min(50, Math.max(1, Math.floor(options.limit || 25)))
  const page = all.slice(offset, offset + limit)
  const returned = new Set(page.map(edge => edge.id))

  function endpoint(id: string) {
    const node = index.nodes.get(id)
    return { nodeId: id, name: node.name, pageId: node.pageId, sourceNodeId: node.sourceId, screenshotId: node.screenshot, previewAsset: node.previewAsset }
  }

  return {
    anchor: scope?.anchorId ? endpoint(scope.anchorId) : null,
    total: all.length,
    offset,
    nextOffset: offset + page.length < all.length ? offset + page.length : null,
    connections: page.map(edge => ({
      id: edge.id, interactionId: edge.interactionId, type: 'interaction', trigger: edge.event, eventNodeId: edge.labelId,
      from: endpoint(edge.from), to: endpoint(edge.to),
    })),
    ...(scope ? {
      placementIds: scope.placements,
      relatedPages: scope.targets.flatMap(target => {
        const events = target.events.filter(event => returned.has(event.edgeId))
        return events.length ? [{ ...endpoint(target.id), events: events.map(event => ({
          connectionId: event.edgeId, type: 'interaction', direction: event.direction, trigger: event.text,
        })) }] : []
      }),
    } : {}),
  }
}
