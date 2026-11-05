/**
 * Cross-panel focus requests. A reference chip in the chat can ask the canvas
 * tab to open a document and reveal a node, whether the tab is already mounted
 * or will be mounted by the same click.
 */

export const CANVAS_FOCUS_EVENT = 'dsh-canvas:focus'

const PENDING_KEY = '__dshCanvasPendingFocus'

/** @param {{doc?: string, node?: string, page?: string, sessionId?: string}} request */
export function requestCanvasFocus(request) {
  if (typeof window === 'undefined') return
  window[PENDING_KEY] = { ...request, at: Date.now() }
  window.dispatchEvent(new CustomEvent(CANVAS_FOCUS_EVENT, { detail: { ...request } }))
}

/**
 * Take the pending request when it belongs to this session (or names none).
 * @param {string} sessionId
 */
export function consumePendingFocus(sessionId) {
  if (typeof window === 'undefined') return null
  const pending = window[PENDING_KEY]
  if (!pending) return null
  if (pending.sessionId && sessionId && pending.sessionId !== sessionId) return null
  window[PENDING_KEY] = null
  return pending
}

/** @param {(request: any) => void} listener */
export function onCanvasFocus(listener) {
  if (typeof window === 'undefined') return () => {}
  const handler = (event) => listener(event.detail ?? {})
  window.addEventListener(CANVAS_FOCUS_EVENT, handler)
  return () => window.removeEventListener(CANVAS_FOCUS_EVENT, handler)
}
