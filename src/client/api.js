/**
 * Browser-side HTTP/SSE client for the canvas Host half.
 * All routes live under /dsh-canvas/api and resolve against document.baseURI
 * so a mounted deployment (or the desktop proxy) keeps the same origin.
 */

export class ApiError extends Error {
  constructor(message, status, code, details, doc, revision) {
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

async function request(path, options = {}) {
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
export function loadState(sessionId, name, signal) {
  const query = new URLSearchParams({ sessionId })
  if (name) query.set('name', name)
  return request(`state?${query}`, { signal })
}

/** @param {string} sessionId @param {string} name @param {string} baseRevision @param {any} doc */
export function saveDoc(sessionId, name, baseRevision, doc, signal) {
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
              onEvent(JSON.parse(line.slice(6)))
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
