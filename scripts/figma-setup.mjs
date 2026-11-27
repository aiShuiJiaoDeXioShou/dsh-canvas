#!/usr/bin/env node
/**
 * Zero-leak CLI helper for the `canvas-figma-setup` skill.
 *
 * Usage:
 *   node scripts/figma-setup.mjs --status
 *   node scripts/figma-setup.mjs --open-settings
 *   node scripts/figma-setup.mjs --from-clipboard [--scope readonly|comments-write] [--days 90]
 *   node scripts/figma-setup.mjs --clear
 *   node scripts/figma-setup.mjs --plugin-path
 *   node scripts/figma-setup.mjs               # interactive hidden prompt (no echo)
 *
 * Security:
 * - Never prints raw Figma tokens to stdout or stderr.
 * - `--from-clipboard` immediately clears the system clipboard after storing.
 */

import { execFileSync, spawn } from 'node:child_process'
import { chmod, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KEYCHAIN_SERVICE = 'dsh-canvas.figma'
const KEYCHAIN_ACCOUNT = 'default'
const LEGACY_SERVICE = 'dsh-canvas.figma.personal'
const LEGACY_ACCOUNT = 'readonly'
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,240}$/
const SETTINGS_URL = 'https://www.figma.com/settings'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const credDir = join(homedir(), '.dsh', 'credentials')
const credFile = join(credDir, 'dsh-canvas-figma.json')
const metaFile = join(credDir, 'dsh-canvas-figma.meta.json')

function parseArgs(argv) {
  const args = {
    status: false,
    openSettings: false,
    fromClipboard: false,
    clear: false,
    pluginPath: false,
    scope: 'readonly',
    days: 90,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--status') args.status = true
    else if (a === '--open-settings') args.openSettings = true
    else if (a === '--from-clipboard') args.fromClipboard = true
    else if (a === '--clear') args.clear = true
    else if (a === '--plugin-path') args.pluginPath = true
    else if (a === '--scope' && argv[i + 1]) {
      args.scope = argv[++i] === 'comments-write' ? 'comments-write' : 'readonly'
    } else if (a === '--days' && argv[i + 1]) {
      const n = Number(argv[++i])
      if (Number.isFinite(n) && n > 0 && n <= 365) args.days = Math.round(n)
    }
  }
  return args
}

function readClipboard() {
  if (process.platform === 'darwin') {
    return execFileSync('pbpaste', [], { encoding: 'utf8', timeout: 5000 }).trim()
  }
  if (process.platform === 'linux') {
    for (const [cmd, cmdArgs] of [
      ['wl-paste', ['--no-newline']],
      ['xclip', ['-o', '-selection', 'clipboard']],
      ['xsel', ['--clipboard', '--output']],
    ]) {
      try {
        return execFileSync(cmd, cmdArgs, { encoding: 'utf8', timeout: 5000 }).trim()
      } catch {
        // try next
      }
    }
    throw new Error('No clipboard utility found (install wl-clipboard, xclip, or xsel)')
  }
  if (process.platform === 'win32') {
    return execFileSync('powershell', ['-NoProfile', '-Command', 'Get-Clipboard'], { encoding: 'utf8', timeout: 5000 }).trim()
  }
  throw new Error(`Unsupported platform for clipboard read: ${process.platform}`)
}

function writeClipboard(text) {
  try {
    if (process.platform === 'darwin') {
      execFileSync('pbcopy', [], { input: text, timeout: 5000 })
      return true
    }
    if (process.platform === 'linux') {
      for (const [cmd, cmdArgs] of [
        ['wl-copy', []],
        ['xclip', ['-selection', 'clipboard']],
      ]) {
        try {
          execFileSync(cmd, cmdArgs, { input: text, timeout: 5000 })
          return true
        } catch {
          // try next
        }
      }
    }
    if (process.platform === 'win32') {
      execFileSync('powershell', ['-NoProfile', '-Command', 'Set-Clipboard -Value $input'], { input: text, timeout: 5000 })
      return true
    }
  } catch {
    return false
  }
  return false
}

function openUrl(url) {
  const [cmd, cmdArgs] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : ['xdg-open', [url]]
  const child = spawn(cmd, cmdArgs, { detached: true, stdio: 'ignore' })
  child.unref()
}

async function verifyToken(token) {
  const res = await fetch('https://api.figma.com/v1/me', {
    method: 'GET',
    redirect: 'error',
    headers: { accept: 'application/json', 'X-Figma-Token': token },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 403 && /scope|current_user/i.test(text)) {
      return { handle: 'Figma (restricted scope)', scopeNote: 'Token lacks current_user:read; file/comment scopes may still work.' }
    }
    throw new Error(`Figma /v1/me returned HTTP ${res.status}`)
  }
  const data = await res.json()
  return {
    id: typeof data.id === 'string' ? data.id : undefined,
    handle: typeof data.handle === 'string' ? data.handle : undefined,
    email: typeof data.email === 'string' ? data.email : undefined,
  }
}

async function readStoredToken() {
  if (process.env.DSH_FIGMA_TOKEN?.trim()) {
    return { source: 'env', token: process.env.DSH_FIGMA_TOKEN.trim() }
  }
  if (process.platform === 'darwin') {
    for (const [service, account] of [
      [KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT],
      [LEGACY_SERVICE, LEGACY_ACCOUNT],
    ]) {
      try {
        const val = execFileSync('/usr/bin/security', ['find-generic-password', '-s', service, '-a', account, '-w'], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 10000,
        }).trim()
        if (val) return { source: 'keychain', token: val }
      } catch {
        // try next
      }
    }
  }
  try {
    const parsed = JSON.parse(await readFile(credFile, 'utf8'))
    if (typeof parsed.accessToken === 'string' && parsed.accessToken) {
      return { source: 'file', token: parsed.accessToken, meta: parsed }
    }
  } catch {
    // none
  }
  return null
}

async function storeToken(token, { scope, days, account }) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + days * 86_400_000).toISOString()
  const meta = { kind: 'pat', scopeMode: scope, createdAt: now.toISOString(), expiresAt, account }

  if (process.platform === 'darwin') {
    try {
      execFileSync('/usr/bin/security', ['add-generic-password', '-U', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w', token], {
        stdio: 'ignore',
        timeout: 10000,
      })
      await mkdir(credDir, { recursive: true })
      await writeFile(metaFile, JSON.stringify(meta, null, 2) + '\n', { mode: 0o600 })
      await chmod(metaFile, 0o600).catch(() => {})
      return { source: 'keychain', ...meta }
    } catch {
      // fallback to file
    }
  }

  await mkdir(credDir, { recursive: true })
  await writeFile(credFile, JSON.stringify({ ...meta, accessToken: token }, null, 2) + '\n', { mode: 0o600 })
  await chmod(credFile, 0o600).catch(() => {})
  return { source: 'file', ...meta }
}

function promptHidden(promptText) {
  return new Promise((resolvePrompt, rejectPrompt) => {
    if (!process.stdin.isTTY) {
      rejectPrompt(new Error('Interactive prompt requires a TTY. Use --from-clipboard or the Drafi Figma Sync UI dialog.'))
      return
    }
    process.stderr.write(promptText)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    let buf = ''
    const onData = (chunk) => {
      const ch = chunk.toString('utf8')
      if (ch === '\r' || ch === '\n') {
        cleanup()
        process.stderr.write('\n')
        resolvePrompt(buf.trim())
      } else if (ch === '\u0003') {
        cleanup()
        process.stderr.write('\n')
        rejectPrompt(new Error('Cancelled'))
      } else if (ch === '\u007f' || ch === '\b') {
        buf = buf.slice(0, -1)
      } else {
        buf += ch
      }
    }
    const cleanup = () => {
      process.stdin.removeListener('data', onData)
      process.stdin.setRawMode(false)
      process.stdin.pause()
    }
    process.stdin.on('data', onData)
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.openSettings) {
    openUrl(SETTINGS_URL)
    console.log(JSON.stringify({ ok: true, opened: SETTINGS_URL }))
    return
  }

  if (args.pluginPath) {
    const manifestPath = join(pkgRoot, 'figma-plugin', 'manifest.json')
    const copied = writeClipboard(manifestPath)
    console.log(JSON.stringify({ ok: true, manifestPath, copiedToClipboard: copied }))
    return
  }

  if (args.clear) {
    let cleared = false
    if (process.platform === 'darwin') {
      for (const [service, account] of [
        [KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT],
        [LEGACY_SERVICE, LEGACY_ACCOUNT],
      ]) {
        try {
          execFileSync('/usr/bin/security', ['delete-generic-password', '-s', service, '-a', account], { stdio: 'ignore' })
          cleared = true
        } catch {
          // ignore
        }
      }
    }
    for (const file of [credFile, metaFile]) {
      try {
        await unlink(file)
        cleared = true
      } catch {
        // ignore
      }
    }
    console.log(JSON.stringify({ ok: true, cleared }))
    return
  }

  if (args.status) {
    const found = await readStoredToken()
    if (!found) {
      console.log(JSON.stringify({ ok: true, configured: false, valid: false, source: 'none' }))
      return
    }
    try {
      const account = await verifyToken(found.token)
      let meta = found.meta ?? null
      if (!meta) {
        try {
          meta = JSON.parse(await readFile(metaFile, 'utf8'))
        } catch {
          meta = null
        }
      }
      console.log(
        JSON.stringify({
          ok: true,
          configured: true,
          valid: true,
          source: found.source,
          scopeMode: meta?.scopeMode ?? 'unknown',
          expiresAt: meta?.expiresAt ?? null,
          account,
        }),
      )
    } catch (error) {
      console.log(
        JSON.stringify({
          ok: false,
          configured: true,
          valid: false,
          source: found.source,
          error: error instanceof Error ? error.message : String(error),
        }),
      )
    }
    return
  }

  const token = args.fromClipboard
    ? readClipboard()
    : await promptHidden('Paste your Figma Personal Access Token (hidden): ')

  if (!TOKEN_PATTERN.test(token)) {
    throw new Error('Clipboard/input does not contain a valid Figma token (expected figd_...)')
  }

  const account = await verifyToken(token)
  const stored = await storeToken(token, { scope: args.scope, days: args.days, account })
  let clipboardCleared = false
  if (args.fromClipboard) {
    clipboardCleared = writeClipboard('')
  }
  console.log(
    JSON.stringify({
      ok: true,
      configured: true,
      valid: true,
      source: stored.source,
      scopeMode: stored.scopeMode,
      expiresAt: stored.expiresAt,
      account: stored.account,
      ...(args.fromClipboard ? { clipboardCleared } : {}),
    }),
  )
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }))
  process.exit(1)
})
