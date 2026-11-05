/**
 * The canvas link grammar shared by the composer insertion and the chat's
 * user-text rule. Links look like:
 *   [在画布中定位：Title](dsh-canvas://main?node=login-title&page=page-1)
 * The chat replaces the link with a clickable canvas chip; the composer keeps
 * the markdown form until the message is sent.
 */

const CANVAS_LINK = /\[([^\][\n]{1,140})\]\(dsh-canvas:\/\/([a-z0-9][a-z0-9-_]{0,63})(?:\?([^)\n]*))?\)/g

/**
 * @param {{doc: string, node: string, page?: string, label?: string}} input
 * @returns {string}
 */
export function formatCanvasLink(input) {
  const label = (String(input.label ?? '在画布中定位').replace(/[\[\]\n]/g, ' ').replace(/\s+/g, ' ').trim() || '在画布中定位').slice(0, 70)
  const params = new URLSearchParams({ node: input.node })
  if (input.page) params.set('page', input.page)
  return `[${label}](dsh-canvas://${input.doc}?${params})`
}

/**
 * @param {string} text
 * @param {number} from
 * @returns {{id: string, start: number, end: number, data: {label: string, doc: string, node?: string, page?: string}} | undefined}
 */
export function matchCanvasLink(text, from) {
  CANVAS_LINK.lastIndex = from
  const match = CANVAS_LINK.exec(text)
  if (!match) return undefined
  const params = new URLSearchParams(match[3] ?? '')
  return {
    id: 'dsh-canvas',
    start: match.index,
    end: match.index + match[0].length,
    data: {
      label: match[1].trim() || '画布',
      doc: match[2],
      node: params.get('node') ?? undefined,
      page: params.get('page') ?? undefined,
    },
  }
}

export const canvasLinkRule = {
  id: 'dsh-canvas',
  order: 20,
  match: matchCanvasLink,
}
