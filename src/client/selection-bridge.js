/**
 * Bridge between the canvas tab and the composer-area selection chip.
 * Kept module-local (not host state) because it is presentation-only.
 */

const EVENT = 'dsh-canvas:selection'

const selections = new Map()
let sequence = 0

/** @param {{sessionId: string, doc: string, node: string, page?: string, label: string}} data */
export function announceCanvasSelection(data) {
  if (!data?.sessionId) return
  selections.set(data.sessionId, { ...data, at: Date.now(), seq: ++sequence })
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...data } }))
  }
}

/** @param {string} sessionId */
export function readCanvasSelection(sessionId) {
  return selections.get(sessionId) ?? null
}

/** @param {string} sessionId */
export function dismissCanvasSelection(sessionId) {
  selections.delete(sessionId)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { sessionId, dismissed: true } }))
  }
}

/** @param {() => void} listener */
export function onCanvasSelection(listener) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => listener()
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
