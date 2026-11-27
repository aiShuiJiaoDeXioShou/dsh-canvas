/**
 * Browser-side HTTP/SSE client for the canvas Host half.
 * All routes live under /dsh-canvas/api and resolve against document.baseURI
 * so a mounted deployment (or the desktop proxy) keeps the same origin.
 */

export class ApiError extends Error {
  status: number
  code: string
  details: unknown
  doc: unknown
  revision: string

  constructor(message: string, status: number, code: string, details?: unknown, doc?: unknown, revision?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.doc = doc
    this.revision = revision
  }
}

function baseUrl(path) {
  const base = typeof document !== 'undefined' ? document.baseURI : undefined
  try {
    const url = new URL(path, base ?? 'http://127.0.0.1/')
    return url.origin === 'null' ? path : url.pathname + url.search
  } catch {
    return path
  }
}

function api(path) {
  return baseUrl(`dsh-canvas/api/${path}`)
}

async function request(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}) {
  const response = await fetch(api(path), {
    method: options.method ?? 'GET',
    headers: options.body === undefined ? { accept: 'application/json' } : { accept: 'application/json', 'content-type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    credentials: 'same-origin',
  })
  let payload = null
  const text = await response.text()
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError(`unexpected response from canvas host (${response.status})`, response.status, 'bad-response')
  }
  if (!response.ok || payload?.ok === false) {
    throw new ApiError(
      payload?.message ?? payload?.error ?? `canvas request failed (${response.status})`,
      response.status,
      payload?.error ?? 'request-failed',
      payload?.details,
      payload?.doc,
      payload?.revision,
    )
  }
  return payload
}

/** @param {string} sessionId @param {string|undefined} name */
export function loadState(sessionId, name, signal?: AbortSignal) {
  const query = new URLSearchParams({ sessionId })
  if (name) query.set('name', name)
  return request(`state?${query}`, { signal })
}

/** @param {string} sessionId @param {string} name @param {string} baseRevision @param {any} doc */
export function saveDoc(sessionId, name, baseRevision, doc, signal?: AbortSignal) {
  return request('doc', { method: 'PUT', body: { sessionId, name, baseRevision, doc }, signal })
}

/** @param {string} sessionId @param {string} from @param {string} to */
export function renameCanvasDoc(sessionId, from, to) {
  return request('doc/rename', { method: 'POST', body: { sessionId, from, to } })
}

/** @param {string} sessionId @param {string} name */
export function deleteCanvasDoc(sessionId, name) {
  return request('doc/delete', { method: 'POST', body: { sessionId, name } })
}

/** @param {string} sessionId @param {string} name @param {{pageId?:string,nodeId?:string,system?:string}} [options] */
export function auditCanvas(sessionId, name, options = {}) {
  return request('audit', { method: 'POST', body: { sessionId, name, ...options } })
}

/** @param {string} sessionId */
export function imageCapabilities(sessionId) {
  const query = new URLSearchParams({ sessionId })
  return request(`image/capabilities?${query}`)
}

/** @param {string} sessionId @param {string} name @param {string} prompt */
export function generateCanvasImage(sessionId, name, prompt) {
  return request('image/generate', { method: 'POST', body: { sessionId, name, prompt } })
}

/** @param {string} sessionId @param {string} name @param {string[]} ids @param {string|undefined} pageId */
export function postSelection(sessionId, name, ids, pageId) {
  return request('selection', {
    method: 'POST',
    body: { sessionId, name, ids, pageId },
  }).catch(() => undefined)
}

/** @param {string} sessionId @param {string} [name] */
export function fetchPack(sessionId, name) {
  const query = new URLSearchParams({ sessionId, ...(name ? { name } : {}) })
  return request(`pack?${query}`)
}

/** @param {string} sessionId @param {string} [name] */
export function exportPack(sessionId, name) {
  return request('pack/export', { method: 'POST', body: { sessionId, name } })
}

/** @param {string} sessionId @param {object} pack @param {string} [name] */
export function importPack(sessionId, pack, name) {
  return request('pack/import', { method: 'POST', body: { sessionId, pack, name } })
}

/** @param {string} sessionId @param {string} requestId @param {string} data @param {string|undefined} nodeId */
export function postSnapshot(sessionId, requestId, data, nodeId) {
  return request('snapshot', {
    method: 'POST',
    body: { sessionId, requestId, data, nodeId },
  })
}

/** @param {string} sessionId @param {string} name @param {'png'|'svg'} kind @param {string} data */
export function saveExport(sessionId, name, kind, data) {
  return request('export', { method: 'POST', body: { sessionId, name, kind, data } })
}

/** @param {string} sessionId @param {string} name @param {string} asset */
export function assetUrl(sessionId, name, asset) {
  const query = new URLSearchParams({ sessionId, name, asset })
  return api(`asset?${query}`)
}

/** @param {string} sessionId @param {string} asset */
export function fontUrl(sessionId, asset) {
  const query = new URLSearchParams({ sessionId, asset })
  return api(`font?${query}`)
}

/** @param {File} file */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const comma = result.indexOf(',')
      resolve(comma === -1 ? '' : result.slice(comma + 1))
    }
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

export function extOf(filename) {
  const index = filename.lastIndexOf('.')
  return index === -1 ? '' : filename.slice(index).toLowerCase()
}

/** @param {string} sessionId @param {File} file */
export async function uploadImage(sessionId, file) {
  const ext = extOf(file.name)
  const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
  if (!allowed.includes(ext)) throw new Error('只支持 png/jpeg/webp/gif 图片')
  const data = await fileToBase64(file)
  return request('asset', { method: 'POST', body: { sessionId, ext, data } })
}

/** @param {string} sessionId @param {File} file @param {{family:string,weight:number,style:string}} meta */
export async function uploadFont(sessionId, file, meta) {
  const ext = extOf(file.name)
  const allowed = ['.woff2', '.woff', '.ttf', '.otf']
  if (!allowed.includes(ext)) throw new Error('只支持 woff2/woff/ttf/otf 字体')
  const data = await fileToBase64(file)
  return request('font', { method: 'POST', body: { sessionId, ext, data, ...meta } })
}

/**
 * Stream doc-changed events. Resolves when the signal aborts. Reconnects with
 * backoff until aborted.
 * @param {string} sessionId
 * @param {string} name
 * @param {(event: any) => void} onEvent
 * @param {AbortSignal} signal
 */
export async function openEvents(sessionId, name, onEvent, signal) {
  let delay = 500
  while (!signal.aborted) {
    try {
      const query = new URLSearchParams({ sessionId, name })
      const response = await fetch(api(`events?${query}`), {
        headers: { accept: 'text/event-stream' },
        credentials: 'same-origin',
        signal,
      })
      if (!response.ok || !response.body) throw new Error(`event stream failed (${response.status})`)
      delay = 500
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (!signal.aborted) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let boundary = buffer.indexOf('\n\n')
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))
              if (event?.type === 'interaction-view-request') {
                interactionRequests.dispatchEvent(new CustomEvent('request', { detail: { sessionId, name, event } }))
              } else onEvent(event)
            } catch {
              // ignore a malformed frame
            }
          }
          boundary = buffer.indexOf('\n\n')
        }
      }
    } catch (error) {
      if (signal.aborted) return
    }
    await new Promise((resolve) => setTimeout(resolve, delay))
    delay = Math.min(delay * 2, 5000)
  }
}


/** Fire-and-forget diagnostic line consumed by the Host log. */
export function reportDiag(event) {
  try {
    return fetch(api('diag'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
      credentials: 'same-origin',
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    return Promise.resolve(undefined)
  }
}

const interactionRequests = new EventTarget()

export function onInteractionViewRequest(
  listener: (request: { sessionId: string; name: string; event: { requestId: string; action: string; nodeId?: string } }) => void,
) {
  const callback = (event: Event) => listener((event as CustomEvent).detail)
  interactionRequests.addEventListener('request', callback)
  return () => interactionRequests.removeEventListener('request', callback)
}

export function replyInteractionView(sessionId: string, requestId: string, result: object) {
  return request('interaction-view/reply', { method: 'POST', body: { sessionId, requestId, result } })
}

export interface FigmaSetupStatusView {
  ok: boolean
  auth: {
    configured: boolean
    valid: boolean
    source: string
    scopeMode: string
    daysUntilExpiry?: number | null
    expiringSoon?: boolean
    account?: { id?: string; handle?: string; email?: string }
    error?: string
  }
  channels: {
    clipboard: { ready: boolean; requiresToken: boolean }
    figFile: { ready: boolean; requiresToken: boolean }
    companionPlugin: {
      ready: boolean
      paired: boolean
      pairingCode: string | null
      expiresAt: string | null
      figmaDesktopInstalled: boolean
      manifestPath: string
    }
    restApi: { ready: boolean; requiresToken: boolean; scopeMode: string }
  }
  binding: {
    bindingId: string
    fileKey: string
    fileName?: string
    fileUrl?: string
    transport: string
    lastSyncedAt: string
    boundNodes: number
    remoteComments: number
  } | null
  setupScriptPath: string
  settingsUrl: string
}

export interface FigmaDiffPlanView {
  planId: string
  direction: 'pull' | 'push'
  readCompleteness: 'complete' | 'partial'
  summary: { added: number; modified: number; moved: number; deleted: number; conflicts: number; assetsToTransfer: number }
  entries: Array<{ dshId: string; nodeName: string; nodeType: string; kind: string; fields: Array<{ field: string }>; selected: boolean }>
  conflicts: Array<{ conflictKey: string; dshId: string; nodeName: string; field: string; reason: string }>
  notices: string[]
}

export function fetchFigmaStatus(sessionId: string, name?: string, probe = true): Promise<FigmaSetupStatusView> {
  const query = new URLSearchParams({ sessionId, probe: String(probe) })
  if (name) query.set('name', name)
  return request(`figma/status?${query}`)
}

export function saveFigmaAuthToken(token: string, scopeMode: 'readonly' | 'comments-write' = 'readonly', expiresInDays = 90) {
  return request('figma/auth/token', { method: 'POST', body: { token, scopeMode, expiresInDays } })
}

export function clearFigmaAuthToken() {
  return request('figma/auth/token', { method: 'DELETE' })
}

export function createFigmaPairing(sessionId: string, name: string): Promise<{ ok: boolean; pairingCode: string; canvasName: string; expiresAt: string }> {
  return request('figma/pair', { method: 'POST', body: { sessionId, name } })
}

export function pasteFigmaClipboard(sessionId: string, payload: { html?: string; svg?: string; text?: string; existingIds?: string[] }) {
  return request('figma/paste', { method: 'POST', body: { sessionId, ...payload } })
}

export function importFigmaUrl(
  sessionId: string,
  name: string,
  options: {
    url: string
    mode: 'import' | 'pull'
    dryRun: boolean
    baseRevision?: string
    selectedIds?: string[]
    resolutions?: Record<string, 'keep-drafi' | 'take-figma' | 'skip'>
  },
) {
  return request('figma/import-url', { method: 'POST', body: { sessionId, name, ...options } })
}

export async function uploadFigmaFile(
  sessionId: string,
  name: string,
  file: File,
  options: { mode: 'import' | 'pull'; dryRun: boolean; baseRevision?: string },
) {
  const query = new URLSearchParams({
    sessionId,
    name,
    mode: options.mode,
    dryRun: String(options.dryRun),
    fileName: file.name,
    ...(options.baseRevision ? { baseRevision: options.baseRevision } : {}),
  })
  const response = await fetch(api(`figma/import-fig?${query}`), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/octet-stream' },
    body: file,
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message ?? 'Figma .fig import failed')
  return payload
}

export function requestFigmaPush(
  sessionId: string,
  name: string,
  options: { mode: 'in-place' | 'proposal-frame'; dryRun: boolean; selectedIds?: string[] },
) {
  return request('figma/push', { method: 'POST', body: { sessionId, name, ...options } })
}

export function syncFigmaCommentsApi(sessionId: string, name: string, fileKey?: string) {
  return request('figma/comments/sync', { method: 'POST', body: { sessionId, name, ...(fileKey ? { fileKey } : {}) } })
}

export async function downloadDshFigBundle(sessionId: string, name: string): Promise<Blob> {
  const query = new URLSearchParams({ sessionId, name })
  const response = await fetch(api(`figma/bundle?${query}`), { method: 'GET', credentials: 'same-origin' })
  if (!response.ok) throw new Error('Export .dshfig failed')
  return response.blob()
}

export async function uploadDshFigBundle(sessionId: string, name: string, file: File) {
  const query = new URLSearchParams({ sessionId, name })
  const response = await fetch(api(`figma/bundle/import?${query}`), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/octet-stream' },
    body: file,
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message ?? 'Import .dshfig failed')
  return payload
}

