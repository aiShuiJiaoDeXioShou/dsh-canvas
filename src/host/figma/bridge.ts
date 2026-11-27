/**
 * Local Pairing Bridge for the free Drafi Companion Figma Plugin.
 *
 * Security model:
 * - Short-lived random Bearer token scoped to one workspace + canvas session.
 * - Only exposed on `/dsh-canvas/bridge/v1/*` with explicit CORS for Figma Plugin iframe (`null` / figma.com).
 * - Never relaxes existing `/dsh-canvas/api/*` same-origin checks.
 */

import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { FigmaDiffPlan, FigmaIrDocument, FigmaPushAck, FigmaSyncPatch } from '../../shared/figma/sync-types.js'

const TOKEN_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours

export interface PairingSession {
  token: string
  pairingCode: string
  sessionId: string
  cwd: string
  canvasName: string
  createdAt: number
  expiresAt: number
  connectedAt?: number
  pluginClient?: string
  pendingPatch?: FigmaSyncPatch | null
  lastPullPlan?: FigmaDiffPlan | null
  lastPullIr?: FigmaIrDocument | null
  lastPushAck?: FigmaPushAck | null
}

export class FigmaPluginBridge {
  private readonly byToken = new Map<string, PairingSession>()
  private readonly byCode = new Map<string, PairingSession>()

  createPairing(params: { sessionId: string; cwd: string; canvasName: string }): PairingSession {
    this.pruneExpired()
    // Reuse or replace previous pairing for same session+canvas
    for (const existing of this.byToken.values()) {
      if (existing.sessionId === params.sessionId && existing.canvasName === params.canvasName) {
        this.byToken.delete(existing.token)
        this.byCode.delete(existing.pairingCode)
      }
    }
    const token = `dshb_${randomBytes(24).toString('base64url')}`
    const rawCode = randomBytes(4).toString('hex').toUpperCase()
    const pairingCode = `${rawCode.slice(0, 4)}-${rawCode.slice(4, 8)}`
    const now = Date.now()
    const session: PairingSession = {
      token,
      pairingCode,
      sessionId: params.sessionId,
      cwd: params.cwd,
      canvasName: params.canvasName,
      createdAt: now,
      expiresAt: now + TOKEN_TTL_MS,
    }
    this.byToken.set(token, session)
    this.byCode.set(pairingCode, session)
    return session
  }

  exchangeCode(pairingCode: string, pluginClient = 'drafi-figma-plugin'): PairingSession | null {
    this.pruneExpired()
    const normalized = String(pairingCode ?? '').trim().toUpperCase()
    const session = this.byCode.get(normalized)
    if (!session) return null
    session.connectedAt = Date.now()
    session.pluginClient = pluginClient
    return session
  }

  authenticateBearer(request: IncomingMessage): PairingSession | null {
    this.pruneExpired()
    const auth = String(request.headers.authorization ?? '').trim()
    if (!auth.startsWith('Bearer ')) return null
    const token = auth.slice(7).trim()
    const session = this.byToken.get(token)
    if (!session) return null
    session.connectedAt = Date.now()
    return session
  }

  getForCanvas(sessionId: string, canvasName: string): PairingSession | null {
    this.pruneExpired()
    for (const s of this.byToken.values()) {
      if (s.sessionId === sessionId && s.canvasName === canvasName) return s
    }
    return null
  }

  queuePatch(sessionId: string, canvasName: string, patch: FigmaSyncPatch): boolean {
    const session = this.getForCanvas(sessionId, canvasName)
    if (!session) return false
    session.pendingPatch = patch
    return true
  }

  consumePatch(tokenSession: PairingSession): FigmaSyncPatch | null {
    const patch = tokenSession.pendingPatch ?? null
    tokenSession.pendingPatch = null
    return patch
  }

  revoke(sessionId: string, canvasName?: string): number {
    let count = 0
    for (const [token, s] of this.byToken.entries()) {
      if (s.sessionId === sessionId && (!canvasName || s.canvasName === canvasName)) {
        this.byToken.delete(token)
        this.byCode.delete(s.pairingCode)
        count += 1
      }
    }
    return count
  }

  dispose(): void {
    this.byToken.clear()
    this.byCode.clear()
  }

  private pruneExpired(): void {
    const now = Date.now()
    for (const [token, s] of this.byToken.entries()) {
      if (s.expiresAt <= now) {
        this.byToken.delete(token)
        this.byCode.delete(s.pairingCode)
      }
    }
  }
}

/**
 * Apply scoped CORS headers ONLY for `/dsh-canvas/bridge/v1/*` requests originating from Figma Plugin iframes
 * (Figma sandboxed iframes send `Origin: null` or `https://www.figma.com`).
 */
export function applyBridgeCors(request: IncomingMessage, response: ServerResponse): boolean {
  const origin = typeof request.headers.origin === 'string' ? request.headers.origin : ''
  const allowed =
    !origin ||
    origin === 'null' ||
    origin === 'https://www.figma.com' ||
    /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/i.test(origin)
  if (!allowed) return false
  response.setHeader('access-control-allow-origin', origin || '*')
  response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS')
  response.setHeader('access-control-allow-headers', 'authorization, content-type')
  response.setHeader('access-control-allow-private-network', 'true')
  response.setHeader('vary', 'origin')
  return true
}
