/**
 * Cross-platform secure Figma credential store for Drafi Host.
 *
 * Security invariants:
 * - Tokens are NEVER echoed back in API responses, tool outputs, or error messages.
 * - Read priority: `DSH_FIGMA_TOKEN` env -> macOS Keychain -> `~/.dsh/credentials/dsh-canvas-figma.json` (mode 0600).
 * - Unified schema supports both PAT (`figd_*`) and future OAuth 2.0 (`accessToken` + `refreshToken`).
 */

import { execFile } from 'node:child_process'
import { chmod, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

const API_ORIGIN = 'https://api.figma.com'
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,240}$/
const KEYCHAIN_SERVICE = 'dsh-canvas.figma'
const KEYCHAIN_ACCOUNT = 'default'
const LEGACY_KEYCHAIN_SERVICE = 'dsh-canvas.figma.personal'
const LEGACY_KEYCHAIN_ACCOUNT = 'readonly'

export type FigmaScopeMode = 'readonly' | 'comments-write' | 'unknown'
export type FigmaCredentialSource = 'env' | 'keychain' | 'file' | 'none'

export interface StoredFigmaCredential {
  kind: 'pat' | 'oauth'
  accessToken: string
  refreshToken?: string
  scopeMode: FigmaScopeMode
  createdAt: string
  expiresAt?: string
  account?: {
    id?: string
    handle?: string
    email?: string
  }
}

export interface RedactedFigmaAuthStatus {
  configured: boolean
  valid: boolean
  source: FigmaCredentialSource
  kind: 'pat' | 'oauth' | null
  scopeMode: FigmaScopeMode
  account?: {
    id?: string
    handle?: string
    email?: string
  }
  createdAt?: string
  expiresAt?: string
  daysUntilExpiry?: number | null
  expiringSoon?: boolean
  error?: string
}

export interface CredentialStoreOptions {
  env?: NodeJS.ProcessEnv
  credentialsDir?: string
  platform?: NodeJS.Platform
  fetchImpl?: typeof fetch
  execFileImpl?: typeof execFile
}

function resolveCredFile(options?: CredentialStoreOptions): string {
  const dir = options?.credentialsDir ?? join(homedir(), '.dsh', 'credentials')
  return join(dir, 'dsh-canvas-figma.json')
}

function resolveMetaFile(options?: CredentialStoreOptions): string {
  const dir = options?.credentialsDir ?? join(homedir(), '.dsh', 'credentials')
  return join(dir, 'dsh-canvas-figma.meta.json')
}

export function isValidFigmaTokenFormat(token: string): boolean {
  const trimmed = token.trim()
  return TOKEN_PATTERN.test(trimmed)
}

async function execSecurity(args: string[], options?: CredentialStoreOptions): Promise<string> {
  const runner = options?.execFileImpl ? promisify(options.execFileImpl) : run
  const result = await runner('/usr/bin/security', args, { timeout: 15000, maxBuffer: 8192 })
  return String(result.stdout ?? '').trim()
}

async function readMeta(options?: CredentialStoreOptions): Promise<Omit<StoredFigmaCredential, 'accessToken' | 'refreshToken'> | null> {
  try {
    const raw = await readFile(resolveMetaFile(options), 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    // ignore missing meta
  }
  return null
}

async function writeMeta(meta: Omit<StoredFigmaCredential, 'accessToken' | 'refreshToken'>, options?: CredentialStoreOptions): Promise<void> {
  const file = resolveMetaFile(options)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(meta, null, 2) + '\n', { mode: 0o600 })
  await chmod(file, 0o600).catch(() => {})
}

/**
 * Read the raw access token for internal Host HTTP requests only.
 * Never return this value to clients or tools.
 */
export async function readFigmaCredential(
  options?: CredentialStoreOptions,
): Promise<{ credential: StoredFigmaCredential; source: FigmaCredentialSource } | null> {
  const env = options?.env ?? process.env
  const platform = options?.platform ?? process.platform

  // 1. Environment variable override
  const envToken = env.DSH_FIGMA_TOKEN?.trim()
  if (envToken && isValidFigmaTokenFormat(envToken)) {
    const meta = await readMeta(options)
    return {
      source: 'env',
      credential: {
        kind: 'pat',
        accessToken: envToken,
        scopeMode: meta?.scopeMode ?? 'unknown',
        createdAt: meta?.createdAt ?? new Date().toISOString(),
        ...(meta?.expiresAt ? { expiresAt: meta.expiresAt } : {}),
        ...(meta?.account ? { account: meta.account } : {}),
      },
    }
  }

  // 2. macOS Keychain (new service + legacy fallback)
  if (platform === 'darwin' && !options?.credentialsDir) {
    for (const [service, account] of [
      [KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT],
      [LEGACY_KEYCHAIN_SERVICE, LEGACY_KEYCHAIN_ACCOUNT],
    ] as const) {
      try {
        const secret = await execSecurity(['find-generic-password', '-s', service, '-a', account, '-w'], options)
        if (secret) {
          if (secret.startsWith('{')) {
            const parsed = JSON.parse(secret) as StoredFigmaCredential
            if (parsed.accessToken && isValidFigmaTokenFormat(parsed.accessToken)) {
              return { source: 'keychain', credential: parsed }
            }
          } else if (isValidFigmaTokenFormat(secret)) {
            const meta = await readMeta(options)
            return {
              source: 'keychain',
              credential: {
                kind: 'pat',
                accessToken: secret,
                scopeMode: meta?.scopeMode ?? (service === LEGACY_KEYCHAIN_SERVICE ? 'readonly' : 'unknown'),
                createdAt: meta?.createdAt ?? new Date().toISOString(),
                ...(meta?.expiresAt ? { expiresAt: meta.expiresAt } : {}),
                ...(meta?.account ? { account: meta.account } : {}),
              },
            }
          }
        }
      } catch {
        // try next keychain item or file store
      }
    }
  }

  // 3. Cross-platform protected credential file (~/.dsh/credentials/dsh-canvas-figma.json, 0600)
  try {
    const raw = await readFile(resolveCredFile(options), 'utf8')
    const parsed = JSON.parse(raw) as StoredFigmaCredential
    if (parsed && typeof parsed.accessToken === 'string' && isValidFigmaTokenFormat(parsed.accessToken)) {
      return { source: 'file', credential: parsed }
    }
  } catch {
    // not configured
  }

  return null
}

/** Convenience helper used by REST adapter. Throws a helpful setup message if unconfigured. */
export async function requireFigmaAccessToken(options?: CredentialStoreOptions): Promise<string> {
  const found = await readFigmaCredential(options)
  if (!found) {
    throw new Error('Figma API token is not configured. Run the canvas-figma-setup skill or configure it in Figma Sync settings.')
  }
  return found.credential.accessToken
}

/** Verify a Figma token against `GET /v1/me` (never returns the token). */
export async function verifyFigmaToken(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ valid: boolean; account?: { id?: string; handle?: string; email?: string }; error?: string }> {
  const trimmed = token.trim()
  if (!isValidFigmaTokenFormat(trimmed)) {
    return { valid: false, error: 'Token format is invalid (expected a Figma Personal Access Token like figd_...)' }
  }
  try {
    const response = await fetchImpl(new URL('/v1/me', API_ORIGIN), {
      method: 'GET',
      redirect: 'error',
      headers: {
        accept: 'application/json',
        'X-Figma-Token': trimmed,
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      // Granular Figma PATs without `current_user:read` return 403 Invalid scope on /v1/me
      // even though the token is authentic and valid for file/comment endpoints.
      if (response.status === 403 && /scope|current_user/i.test(text)) {
        return {
          valid: true,
          account: { handle: 'Figma (restricted scope)' },
        }
      }
      return { valid: false, error: `Figma /v1/me returned HTTP ${response.status}` }
    }
    const data = (await response.json()) as Record<string, unknown>
    return {
      valid: true,
      account: {
        ...(typeof data.id === 'string' ? { id: data.id } : {}),
        ...(typeof data.handle === 'string' ? { handle: data.handle } : {}),
        ...(typeof data.email === 'string' ? { email: data.email } : {}),
      },
    }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Verify and persist a Figma Personal Access Token into macOS Keychain (or 0600 file on non-macOS/test dirs).
 * Returns strictly redacted status.
 */
export async function saveFigmaToken(
  token: string,
  params: {
    scopeMode?: FigmaScopeMode
    expiresInDays?: number
    skipVerify?: boolean
  } = {},
  options?: CredentialStoreOptions,
): Promise<RedactedFigmaAuthStatus> {
  const trimmed = token.trim()
  if (!isValidFigmaTokenFormat(trimmed)) {
    throw new Error('Invalid Figma token format')
  }

  let account: StoredFigmaCredential['account']
  let valid = true
  if (!params.skipVerify) {
    const check = await verifyFigmaToken(trimmed, options?.fetchImpl)
    if (!check.valid) {
      throw new Error(check.error ?? 'Figma token verification failed')
    }
    account = check.account
  }

  const now = new Date()
  const expiresDays = typeof params.expiresInDays === 'number' && params.expiresInDays > 0 ? params.expiresInDays : 90
  const expiresAt = new Date(now.getTime() + expiresDays * 86_400_000).toISOString()
  const credential: StoredFigmaCredential = {
    kind: 'pat',
    accessToken: trimmed,
    scopeMode: params.scopeMode ?? 'readonly',
    createdAt: now.toISOString(),
    expiresAt,
    ...(account ? { account } : {}),
  }

  const platform = options?.platform ?? process.platform
  let source: FigmaCredentialSource = 'file'

  if (platform === 'darwin' && !options?.credentialsDir) {
    try {
      await execSecurity(
        ['add-generic-password', '-U', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w', trimmed],
        options,
      )
      await writeMeta(
        {
          kind: credential.kind,
          scopeMode: credential.scopeMode,
          createdAt: credential.createdAt,
          expiresAt: credential.expiresAt,
          ...(account ? { account } : {}),
        },
        options,
      )
      source = 'keychain'
    } catch {
      // Fallback to 0600 file if Keychain is locked or unavailable
      source = 'file'
    }
  }

  if (source === 'file') {
    const file = resolveCredFile(options)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(credential, null, 2) + '\n', { mode: 0o600 })
    await chmod(file, 0o600).catch(() => {})
  }

  return buildRedactedStatus(credential, source, valid)
}

/** Delete stored Figma token from Keychain and protected file store. */
export async function clearFigmaToken(options?: CredentialStoreOptions): Promise<{ cleared: boolean }> {
  const platform = options?.platform ?? process.platform
  let cleared = false
  if (platform === 'darwin' && !options?.credentialsDir) {
    for (const [service, account] of [
      [KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT],
      [LEGACY_KEYCHAIN_SERVICE, LEGACY_KEYCHAIN_ACCOUNT],
    ] as const) {
      try {
        await execSecurity(['delete-generic-password', '-s', service, '-a', account], options)
        cleared = true
      } catch {
        // item did not exist
      }
    }
  }
  for (const file of [resolveCredFile(options), resolveMetaFile(options)]) {
    try {
      await unlink(file)
      cleared = true
    } catch {
      // did not exist
    }
  }
  return { cleared }
}

/** Return strictly redacted Figma auth status (optionally probing `/v1/me` live). */
export async function getFigmaAuthStatus(
  params: { probe?: boolean } = {},
  options?: CredentialStoreOptions,
): Promise<RedactedFigmaAuthStatus> {
  const found = await readFigmaCredential(options)
  if (!found) {
    return {
      configured: false,
      valid: false,
      source: 'none',
      kind: null,
      scopeMode: 'unknown',
    }
  }
  if (!params.probe) {
    return buildRedactedStatus(found.credential, found.source, true)
  }
  const check = await verifyFigmaToken(found.credential.accessToken, options?.fetchImpl)
  const cred: StoredFigmaCredential = {
    ...found.credential,
    ...(check.account ? { account: check.account } : {}),
  }
  return buildRedactedStatus(cred, found.source, check.valid, check.error)
}

function buildRedactedStatus(
  credential: StoredFigmaCredential,
  source: FigmaCredentialSource,
  valid: boolean,
  error?: string,
): RedactedFigmaAuthStatus {
  let daysUntilExpiry: number | null = null
  if (credential.expiresAt) {
    const ms = Date.parse(credential.expiresAt) - Date.now()
    if (Number.isFinite(ms)) daysUntilExpiry = Math.ceil(ms / 86_400_000)
  }
  return {
    configured: true,
    valid,
    source,
    kind: credential.kind,
    scopeMode: credential.scopeMode,
    ...(credential.account ? { account: credential.account } : {}),
    createdAt: credential.createdAt,
    ...(credential.expiresAt ? { expiresAt: credential.expiresAt } : {}),
    daysUntilExpiry,
    expiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 7,
    ...(error ? { error } : {}),
  }
}
