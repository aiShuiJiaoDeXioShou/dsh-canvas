/**
 * Host-side image support for @local/dsh-canvas.
 *
 * Three responsibilities, all dependency-free (node:fs/path/os/crypto/child_process):
 *
 *  - detectImageCapabilities(): report whether the active model can generate
 *    images natively and whether a Codex CLI with the image_generation feature
 *    is installed.
 *  - generateWithCodex(): run `codex exec` in an isolated temp directory, then
 *    validate and copy the image it produced into the canvas assets directory.
 *  - importImage(): validate a local file and copy it into the canvas assets
 *    directory with a safe, unique filename.
 *
 * Asset values are always returned as `assets/<file>`, matching the image fills
 * accepted by lib/format.js and served by lib/host/main.js. Expected failures
 * are returned as `{ ok: false, code, message, ... }`; they never throw. Only
 * invalid developer arguments (such as a missing prompt) throw.
 */

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants as fsConstants } from 'node:fs'
import { access, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, delimiter, extname, isAbsolute, join, resolve } from 'node:path'

import { LIMITS } from './format.js'

const DEFAULT_PROBE_TIMEOUT_MS = 10_000
const DEFAULT_GENERATE_TIMEOUT_MS = 180_000
const MAX_CAPTURE_CHARS = 128 * 1024
const MAX_TAIL_CHARS = 4_000
const MAX_VERSION_CHARS = 200
const KILL_GRACE_MS = 1_000
const FALLBACK_CLOSE_MS = 3_000
const MTIME_TOLERANCE_MS = 2_000
const MAX_SCAN_DEPTH = 4
const IMAGE_LIMIT_MIB = Math.round(LIMITS.imageBytes / (1024 * 1024))

// GPT/OpenAI-ish provider or model names: gpt, gpt-4o, chatgpt, openai,
// o1/o3/o4-style reasoning models. The boundaries keep words like "gptx" and
// "foo1" from matching while still accepting "gpt4" and "o3-mini".
const NATIVE_IMAGE_RE = /(?:^|[^a-z0-9])(?:gpt|chatgpt|openai|o[1-9])(?=$|[^a-z])/i

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const GENERATED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const GENERATED_KINDS = new Set(['png', 'jpeg', 'webp'])
const EXTENSION_BY_KIND = { png: '.png', jpeg: '.jpg', webp: '.webp', gif: '.gif' }
const EXTENSIONS_BY_KIND = {
  png: new Set(['.png']),
  jpeg: new Set(['.jpg', '.jpeg']),
  webp: new Set(['.webp']),
  gif: new Set(['.gif']),
}

// ───────────────────────────── small utilities ─────────────────────────────

/** @param {unknown} error */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Merge caller-supplied environment variables over process.env.
 * @param {Record<string, unknown> | null | undefined} overrides
 * @returns {Record<string, string>}
 */
function mergedEnv(overrides) {
  /** @type {Record<string, string>} */
  const env = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value
  }
  if (overrides && typeof overrides === 'object') {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) continue
      env[key] = String(value)
    }
  }
  return env
}

/**
 * @param {unknown} value
 * @param {number} fallback
 */
function normalizeTimeout(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return fallback
  return Math.floor(number)
}

/**
 * Resolve the Codex command: an explicit option wins, then the environment,
 * then the conventional `codex` name.
 * @param {unknown} codexBin
 * @param {Record<string, string>} env
 */
function requestedCodexBin(codexBin, env) {
  if (typeof codexBin === 'string' && codexBin.trim()) return codexBin.trim()
  const configured = env.DSH_CANVAS_CODEX_BIN
  if (typeof configured === 'string' && configured.trim()) return configured.trim()
  return 'codex'
}

/** @param {string} value */
function looksLikePath(value) {
  return isAbsolute(value) || value.includes('/') || value.includes('\\') || /^[A-Za-z]:/.test(value)
}

/** @param {string} file */
async function isRegularFile(file) {
  try {
    const info = await stat(file)
    return info.isFile()
  } catch {
    return false
  }
}

/** @param {string} file */
async function isExecutableFile(file) {
  if (!(await isRegularFile(file))) return false
  try {
    await access(file, fsConstants.X_OK)
    return true
  } catch {
    return false
  }
}

/**
 * `which`-style lookup. An explicitly supplied path is accepted when it names a
 * regular file (spawn reports EACCES later if it is not executable); PATH
 * entries must be executable, like `which`.
 * @param {string} command
 * @param {Record<string, string>} env
 * @returns {Promise<string | null>}
 */
async function lookupBinary(command, env) {
  if (!command) return null
  if (looksLikePath(command)) {
    const file = resolve(command)
    return (await isRegularFile(file)) ? file : null
  }
  const pathValue = env.PATH ?? env.Path ?? env.path ?? ''
  const extensions =
    process.platform === 'win32'
      ? ['', ...String(env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)]
      : ['']
  for (const directory of String(pathValue).split(delimiter)) {
    if (!directory) continue
    for (const extension of extensions) {
      const candidate = join(directory, command + extension)
      if (await isExecutableFile(candidate)) return resolve(candidate)
    }
  }
  return null
}

/**
 * Strip a fairly complete set of ANSI CSI sequences, so Codex's colored CLI
 * output remains parseable in a plain-text environment.
 * @param {unknown} value
 */
function stripAnsi(value) {
  return String(value ?? '').replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
}

/**
 * Last non-empty lines of stdout/stderr, capped for the tool result.
 * @param {...string} parts
 */
function rawOutputTail(...parts) {
  const text = parts
    .map((part) => stripAnsi(part))
    .filter((part) => part.trim())
    .join('\n')
    .trim()
  return text.length > MAX_TAIL_CHARS ? text.slice(-MAX_TAIL_CHARS) : text
}

/**
 * @param {string} code
 * @param {string} message
 * @param {string} [stdout]
 * @param {string} [stderr]
 */
function failure(code, message, stdout = '', stderr = '') {
  const result = { ok: false, code, message }
  const tail = rawOutputTail(stdout, stderr)
  if (tail) result.rawOutputTail = tail
  return result
}

/**
 * @param {unknown} value
 * @param {number} limit
 */
function capText(value, limit = MAX_CAPTURE_CHARS) {
  if (typeof value !== 'string') return ''
  return value.length > limit ? value.slice(0, limit) : value
}

/**
 * @param {unknown} value
 */
function toText(value) {
  if (typeof value === 'string') return value
  if (Buffer.isBuffer(value)) return value.toString('utf8')
  if (value == null) return ''
  return String(value)
}

/**
 * Attach a stream to a capped text capture.
 * @param {any} stream
 * @param {{ text: string }} state
 */
function captureStream(stream, state) {
  if (!stream || typeof stream.on !== 'function') return
  stream.on('data', (chunk) => {
    const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk)
    if (state.text.length < MAX_CAPTURE_CHARS) {
      state.text += text.slice(0, MAX_CAPTURE_CHARS - state.text.length)
    }
  })
  stream.on('error', () => {})
}

/**
 * Normalize the result of a Promise-returning spawnImpl. Supporting both this
 * and a real ChildProcess keeps the injection point convenient in tests.
 * @param {any} value
 */
function normalizeRunnerResult(value) {
  if (value == null) return { spawnError: new Error('spawnImpl returned no result') }
  if (typeof value === 'number') return { exitCode: value }
  if (typeof value === 'string' || Buffer.isBuffer(value)) return { exitCode: 0, stdout: toText(value) }
  if (typeof value !== 'object') return { spawnError: new Error('spawnImpl returned an invalid result') }
  let exitCode = 0
  if (Number.isInteger(value.exitCode)) exitCode = value.exitCode
  else if (Number.isInteger(value.code)) exitCode = value.code
  else if (value.ok === false) exitCode = 1
  const spawnError =
    value.error instanceof Error ? value.error : value.error != null ? new Error(String(value.error)) : null
  return {
    exitCode,
    signal: value.signal ?? null,
    timedOut: value.timedOut === true,
    spawnError,
    stdout: toText(value.stdout),
    stderr: toText(value.stderr),
  }
}

/**
 * Run one command, capture capped stdout/stderr, enforce a timeout, and never
 * throw. `spawnImpl` defaults to child_process.spawn; a Promise-returning
 * injection returning { code|exitCode, stdout, stderr } is also accepted.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {{ timeoutMs?: number, cwd?: string, env?: Record<string, string>, spawnImpl?: Function }} [options]
 * @returns {Promise<{ok: boolean, exitCode: number | null, signal: string | null, timedOut: boolean, spawnError: Error | null, stdout: string, stderr: string}>}
 */
function runCommand(command, args, options = {}) {
  const { timeoutMs = DEFAULT_PROBE_TIMEOUT_MS, cwd, env, spawnImpl = spawn } = options
  return new Promise((resolvePromise) => {
    const stdout = { text: '' }
    const stderr = { text: '' }
    /** @type {any} */
    let child = null
    let timedOut = false
    let settled = false
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timer = null
    /** @type {ReturnType<typeof setTimeout> | null} */
    let killTimer = null
    /** @type {ReturnType<typeof setTimeout> | null} */
    let fallbackTimer = null

    const clearTimers = () => {
      if (timer) clearTimeout(timer)
      if (killTimer) clearTimeout(killTimer)
      if (fallbackTimer) clearTimeout(fallbackTimer)
      timer = null
      killTimer = null
      fallbackTimer = null
    }

    /** @param {{ exitCode?: number | null, signal?: string | null, timedOut?: boolean, spawnError?: Error | null, stdout?: string, stderr?: string }} result */
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimers()
      resolvePromise({
        // `ok` means the process itself succeeded; callers still validate the
        // artifacts it wrote.
        ok: !timedOut && !result.spawnError && !result.timedOut && result.exitCode === 0,
        exitCode: Number.isInteger(result.exitCode) ? result.exitCode : null,
        signal: result.signal ?? null,
        timedOut: timedOut || result.timedOut === true,
        spawnError: result.spawnError ?? null,
        stdout: result.stdout != null ? capText(result.stdout) : stdout.text,
        stderr: result.stderr != null ? capText(result.stderr) : stderr.text,
      })
    }

    const startTimeout = () => {
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return
      timer = setTimeout(() => {
        timedOut = true
        if (child && typeof child.kill === 'function') {
          try {
            child.kill('SIGTERM')
          } catch {
            // the process may already be gone
          }
          killTimer = setTimeout(() => {
            try {
              child.kill('SIGKILL')
            } catch {
              // the process may already be gone
            }
          }, KILL_GRACE_MS)
          // A child that neither closes nor reacts to SIGKILL must not hang the
          // host tool forever; resolve once the grace period is over.
          fallbackTimer = setTimeout(
            () => finish({ exitCode: null, signal: 'SIGKILL', timedOut: true }),
            KILL_GRACE_MS + FALLBACK_CLOSE_MS,
          )
        } else {
          finish({ exitCode: null, timedOut: true })
        }
      }, timeoutMs)
    }

    let returned
    try {
      returned = spawnImpl(command, args, {
        cwd,
        env,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
    } catch (error) {
      finish({ spawnError: error instanceof Error ? error : new Error(String(error)) })
      return
    }

    if (returned && typeof returned.then === 'function') {
      startTimeout()
      returned.then(
        (value) => finish(normalizeRunnerResult(value)),
        (error) => finish({ spawnError: error instanceof Error ? error : new Error(String(error)) }),
      )
      return
    }

    child = returned
    if (!child || typeof child.on !== 'function') {
      finish({ spawnError: new Error('spawnImpl did not return a child process') })
      return
    }
    captureStream(child.stdout, stdout)
    captureStream(child.stderr, stderr)
    child.on('error', (error) => finish({ spawnError: error instanceof Error ? error : new Error(String(error)) }))
    child.on('close', (code, signal) => finish({ exitCode: code, signal }))
    startTimeout()
  })
}

// ───────────────────────────── image helpers ─────────────────────────────

/**
 * Detect a supported image format from its magic bytes.
 * @param {Buffer} buffer
 * @returns {'png' | 'jpeg' | 'webp' | 'gif' | null}
 */
function sniffImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 6) return null
  if (buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return 'png'
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg'
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp'
  }
  const head = buffer.toString('ascii', 0, 6)
  if (head === 'GIF87a' || head === 'GIF89a') return 'gif'
  return null
}

/**
 * Pick a filename extension that matches the real image bytes.
 * @param {string} kind
 * @param {string} [preferred]
 */
function extensionFor(kind, preferred) {
  const extension = typeof preferred === 'string' ? preferred.toLowerCase() : ''
  const allowed = EXTENSIONS_BY_KIND[kind]
  if (allowed?.has(extension)) return extension
  return EXTENSION_BY_KIND[kind] ?? '.bin'
}

/**
 * Turn an arbitrary filename into a short, safe asset stem:
 * ASCII letters/digits/underscore/dash only, at most 64 characters.
 * @param {unknown} value
 */
function sanitizeStem(value) {
  let stem = String(value ?? '')
    .split(/[\\/]/)
    .pop() ?? ''
  // Drop a known image extension; the canonical extension is chosen later from
  // the actual magic bytes.
  stem = stem.replace(/\.(?:png|jpe?g|webp|gif)$/i, '')
  stem = stem
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
  if (stem.length > 64) stem = stem.slice(0, 64).replace(/[._-]+$/, '')
  return stem || 'image'
}

/**
 * Write an already-validated image buffer into assetDir without overwriting an
 * existing file. Returns the plugin-relative `assets/<file>` and its absolute
 * host path.
 * @param {{ buffer: Buffer, assetDir: string, stem: string, preferredExt?: string }} input
 */
async function storeImage({ buffer, assetDir, stem, preferredExt }) {
  const kind = sniffImage(buffer)
  if (!kind) throw new Error('not a supported image')
  const extension = extensionFor(kind, preferredExt)
  const safeStem = sanitizeStem(stem)
  const directory = resolve(assetDir)
  await mkdir(directory, { recursive: true })
  for (let index = 0; index < 1_000; index += 1) {
    const filename = `${safeStem}${index === 0 ? '' : `-${index}`}${extension}`
    const hostPath = join(directory, filename)
    try {
      await writeFile(hostPath, buffer, { flag: 'wx' })
      return { asset: `assets/${filename}`, hostPath, bytes: buffer.length }
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'EEXIST') continue
      throw error
    }
  }
  throw new Error('could not find a unique asset filename')
}

/** @param {Buffer} buffer */
function imageStem(buffer) {
  return `image-${createHash('sha256').update(buffer).digest('hex').slice(0, 16)}`
}

/**
 * Find image files written by Codex. `output.png` wins; the rest are ordered by
 * modification time and path so the result is deterministic.
 * @param {string} root
 * @param {number} startedAt
 */
async function findGeneratedImages(root, startedAt) {
  /** @type {{path: string, name: string, mtimeMs: number}[]} */
  const candidates = []
  /** @param {string} directory @param {number} depth */
  const walk = async (directory, depth) => {
    if (depth > MAX_SCAN_DEPTH) return
    let entries
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(full, depth + 1)
        continue
      }
      if (!entry.isFile()) continue
      if (!GENERATED_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue
      let info
      try {
        info = await stat(full)
      } catch {
        continue
      }
      if (!info.isFile()) continue
      if (Number.isFinite(info.mtimeMs) && info.mtimeMs + MTIME_TOLERANCE_MS < startedAt) continue
      candidates.push({ path: full, name: entry.name, mtimeMs: info.mtimeMs })
    }
  }
  await walk(root, 0)
  const preferred = join(root, 'output.png')
  candidates.sort((a, b) => {
    const aPreferred = a.path === preferred ? 0 : 1
    const bPreferred = b.path === preferred ? 0 : 1
    if (aPreferred !== bPreferred) return aPreferred - bPreferred
    if (a.mtimeMs !== b.mtimeMs) return a.mtimeMs - b.mtimeMs
    return a.path.localeCompare(b.path)
  })
  return candidates
}

// ───────────────────────────── capability detection ─────────────────────────────

/**
 * @param {unknown} value
 * @returns {{provider?: string, model?: string} | null}
 */
function normalizeModelSelection(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const provider =
    typeof value.provider === 'string' && value.provider.trim() ? value.provider.trim().slice(0, 120) : undefined
  const model = typeof value.model === 'string' && value.model.trim() ? value.model.trim().slice(0, 120) : undefined
  if (!provider && !model) return null
  /** @type {{provider?: string, model?: string}} */
  const normalized = {}
  if (provider) normalized.provider = provider
  if (model) normalized.model = model
  return normalized
}

/** @param {{provider?: string, model?: string}} model */
function describeModel(model) {
  return `${model.provider ?? 'unknown-provider'}/${model.model ?? 'unknown-model'}`
}

/** @param {unknown} value */
function firstLine(value) {
  const text = stripAnsi(value).trim()
  if (!text) return undefined
  const line = text.split(/\r?\n/).find((entry) => entry.trim())
  return line ? line.trim().slice(0, MAX_VERSION_CHARS) : undefined
}

/**
 * Parse `codex features list`: one line must contain image_generation, stable
 * and true, regardless of tabs/column spacing.
 * @param {string} stdout
 * @param {string} stderr
 */
function imageGenerationFeature(stdout, stderr) {
  const text = stripAnsi(`${stdout ?? ''}\n${stderr ?? ''}`)
  let sawFeature = false
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes('image_generation')) continue
    sawFeature = true
    if (/\bstable\b/i.test(line) && /\btrue\b/i.test(line)) return { enabled: true, sawFeature }
  }
  return { enabled: false, sawFeature }
}

/**
 * Probe a resolved Codex command. Never throws; version/feature failures are
 * reported in `notes` and in the returned capability object.
 * @param {{ command: string | null, requested: string, resolved: boolean, timeoutMs: number, spawnImpl?: Function, env: Record<string, string>, notes: string[] }} input
 */
async function probeCodex({ command, requested, resolved, timeoutMs, spawnImpl, env, notes }) {
  /** @type {{available: boolean, bin?: string, version?: string, imageGeneration: boolean}} */
  const codex = { available: false, imageGeneration: false }
  if (!command) {
    notes.push(`Codex CLI "${requested}" was not found. Install Codex or set DSH_CANVAS_CODEX_BIN.`)
    return codex
  }
  codex.bin = command

  let versionProbe
  try {
    versionProbe = await runCommand(command, ['--version'], { timeoutMs, env, spawnImpl })
  } catch (error) {
    notes.push(`Could not run "${command} --version": ${messageOf(error)}.`)
    return codex
  }
  if (versionProbe.spawnError) {
    if (versionProbe.spawnError.code === 'ENOENT' && !resolved) {
      notes.push(`Codex CLI "${requested}" was not found. Install Codex or set DSH_CANVAS_CODEX_BIN.`)
    } else {
      notes.push(`Could not run "${command} --version": ${messageOf(versionProbe.spawnError)}.`)
    }
    return codex
  }
  if (versionProbe.timedOut) {
    notes.push(`"${command} --version" timed out after ${timeoutMs} ms.`)
    return codex
  }
  if (versionProbe.exitCode !== 0) {
    const tail = rawOutputTail(versionProbe.stdout, versionProbe.stderr)
    notes.push(
      `"${command} --version" exited with code ${versionProbe.exitCode}${tail ? `: ${tail}` : ''}.`,
    )
    return codex
  }

  codex.available = true
  const version = firstLine(versionProbe.stdout || versionProbe.stderr)
  if (version) codex.version = version
  else notes.push(`"${command} --version" returned no version text.`)

  let features
  try {
    features = await runCommand(command, ['features', 'list'], { timeoutMs, env, spawnImpl })
  } catch (error) {
    notes.push(`Could not read Codex features: ${messageOf(error)}. Image generation is unavailable.`)
    return codex
  }
  if (features.spawnError) {
    notes.push(
      `Could not read Codex features: ${messageOf(features.spawnError)}. Image generation is unavailable.`,
    )
    return codex
  }
  if (features.timedOut) {
    notes.push(`"${command} features list" timed out after ${timeoutMs} ms. Image generation is unavailable.`)
    return codex
  }
  if (features.exitCode !== 0) {
    const tail = rawOutputTail(features.stdout, features.stderr)
    notes.push(
      `"${command} features list" exited with code ${features.exitCode}${tail ? `: ${tail}` : ''}. Image generation is unavailable.`,
    )
    return codex
  }

  const feature = imageGenerationFeature(features.stdout, features.stderr)
  codex.imageGeneration = feature.enabled
  if (feature.enabled) notes.push('Codex reports the image_generation feature as stable and enabled.')
  else if (feature.sawFeature) {
    notes.push('Codex lists image_generation, but not as stable and enabled (expected "stable true").')
  } else notes.push('Codex does not list an image_generation feature.')
  return codex
}

/**
 * Probe the active model and the local Codex CLI. Never throws for a missing
 * binary, a failed probe or an unavailable feature.
 *
 * @param {{
 *   modelSelection?: {provider?: string, model?: string} | null,
 *   codexBin?: string,
 *   timeoutMs?: number,
 *   spawnImpl?: Function,
 *   env?: Record<string, string | undefined>
 * }} [options]
 * @returns {Promise<{model: {provider?: string, model?: string} | null, nativeImage: boolean, codex: {available: boolean, bin?: string, version?: string, imageGeneration: boolean}, recommended: 'native' | 'codex' | 'none', notes: string[]}>}
 */
export async function detectImageCapabilities(options = {}) {
  const opts = options && typeof options === 'object' ? options : {}
  const timeoutMs = normalizeTimeout(opts.timeoutMs, DEFAULT_PROBE_TIMEOUT_MS)
  const env = mergedEnv(opts.env)
  const model = normalizeModelSelection(opts.modelSelection)
  const nativeImage = model ? NATIVE_IMAGE_RE.test(`${model.provider ?? ''} ${model.model ?? ''}`.trim()) : false
  /** @type {string[]} */
  const notes = []

  if (!model) {
    notes.push('No model selection was provided; native image generation cannot be confirmed.')
  } else if (nativeImage) {
    notes.push(`Model ${describeModel(model)} looks GPT/OpenAI-like; native image generation is preferred.`)
  } else {
    notes.push(`Model ${describeModel(model)} does not look like a GPT/OpenAI model.`)
  }
  if (model && !model.model) {
    notes.push('The model selection has no model name, so native support is only a provider-level guess.')
  }

  /** @type {{available: boolean, bin?: string, version?: string, imageGeneration: boolean}} */
  let codex = { available: false, imageGeneration: false }
  try {
    const requested = requestedCodexBin(opts.codexBin, env)
    const resolved = await lookupBinary(requested, env)
    // With an injected spawner the binary may be virtual (a test double), so an
    // unresolved command is still handed to it instead of failing early.
    const command = resolved ?? (typeof opts.spawnImpl === 'function' ? requested : null)
    codex = await probeCodex({
      command,
      requested,
      resolved: Boolean(resolved),
      timeoutMs,
      spawnImpl: opts.spawnImpl,
      env,
      notes,
    })
  } catch (error) {
    notes.push(`Codex detection failed: ${messageOf(error)}.`)
  }

  const recommended = nativeImage ? 'native' : codex.available && codex.imageGeneration ? 'codex' : 'none'
  if (recommended === 'native') notes.push('Recommended: use native image generation on the active model.')
  else if (recommended === 'codex') notes.push('Recommended: use Codex image generation through codex exec.')
  else notes.push('Recommended: no host-side image generation path; import an existing image instead.')

  return { model, nativeImage, codex, recommended, notes }
}

// ───────────────────────────── Codex generation ─────────────────────────────

/**
 * @param {string} prompt
 * @param {string} outputPath
 */
function buildCodexPrompt(prompt, outputPath) {
  return [
    'Use the image_generation tool to create the requested image.',
    `Save the result as a PNG, JPEG, or WebP file at exactly this path: ${outputPath}`,
    'Then reply with the absolute path to the saved file.',
    '',
    'Request:',
    prompt.trim(),
  ].join('\n')
}

/**
 * Generate an image through Codex and store it as a canvas asset.
 *
 * Expected failures (missing binary, timeout, no image, invalid image, ...) are
 * returned as {ok:false, code, message, rawOutputTail?}; they never throw.
 * A missing/non-string prompt or assetDir throws TypeError.
 *
 * @param {{
 *   prompt?: string,
 *   outDir?: string,
 *   assetDir?: string,
 *   codexBin?: string,
 *   timeoutMs?: number,
 *   spawnImpl?: Function,
 *   env?: Record<string, string | undefined>
 * }} [options]
 * @returns {Promise<{ok: boolean, asset?: string, hostPath?: string, bytes?: number, code?: string, message?: string, rawOutputTail?: string}>}
 */
export async function generateWithCodex(options = {}) {
  const opts = options && typeof options === 'object' ? options : {}
  if (typeof opts.prompt !== 'string' || !opts.prompt.trim()) {
    throw new TypeError('generateWithCodex requires a non-empty prompt string')
  }
  if (typeof opts.assetDir !== 'string' || !opts.assetDir.trim()) {
    throw new TypeError('generateWithCodex requires an assetDir string')
  }
  if (opts.outDir != null && typeof opts.outDir !== 'string') {
    throw new TypeError('generateWithCodex outDir must be a string when provided')
  }
  if (opts.spawnImpl != null && typeof opts.spawnImpl !== 'function') {
    throw new TypeError('generateWithCodex spawnImpl must be a function when provided')
  }

  const prompt = opts.prompt.trim()
  const assetDir = opts.assetDir.trim()
  const timeoutMs = normalizeTimeout(opts.timeoutMs, DEFAULT_GENERATE_TIMEOUT_MS)
  const env = mergedEnv(opts.env)
  const requested = requestedCodexBin(opts.codexBin, env)
  const resolvedBin = await lookupBinary(requested, env)
  const command = resolvedBin ?? (typeof opts.spawnImpl === 'function' ? requested : null)
  if (!command) {
    return failure(
      'codex-not-found',
      `Codex CLI "${requested}" was not found. Install Codex or set DSH_CANVAS_CODEX_BIN.`,
    )
  }

  /** @type {string | null} */
  let tmp = null
  try {
    const base = opts.outDir ? resolve(opts.outDir) : tmpdir()
    await mkdir(base, { recursive: true })
    tmp = await mkdtemp(join(base, 'dsh-canvas-codex-'))
    const outputPath = join(tmp, 'output.png')
    const lastMessagePath = join(tmp, 'last.txt')
    const args = [
      'exec',
      '--skip-git-repo-check',
      '--ephemeral',
      '--json',
      '--sandbox',
      'workspace-write',
      '--cd',
      tmp,
      '--output-last-message',
      lastMessagePath,
      buildCodexPrompt(prompt, outputPath),
    ]
    const startedAt = Date.now()
    const run = await runCommand(command, args, { timeoutMs, env, cwd: tmp, spawnImpl: opts.spawnImpl })

    if (run.spawnError) {
      if (run.spawnError.code === 'ENOENT' && !resolvedBin) {
        return failure(
          'codex-not-found',
          `Codex CLI "${requested}" was not found. Install Codex or set DSH_CANVAS_CODEX_BIN.`,
        )
      }
      return failure('spawn-failed', `Could not start Codex: ${messageOf(run.spawnError)}`)
    }
    if (run.timedOut) {
      return failure(
        'timeout',
        `Codex image generation timed out after ${timeoutMs} ms and was stopped.`,
        run.stdout,
        run.stderr,
      )
    }
    if (run.exitCode !== 0) {
      return failure(
        'codex-failed',
        `Codex image generation failed with exit code ${run.exitCode ?? 'unknown'}${
          run.signal ? ` (signal ${run.signal})` : ''
        }.`,
        run.stdout,
        run.stderr,
      )
    }

    const candidates = await findGeneratedImages(tmp, startedAt)
    if (candidates.length === 0) {
      return failure(
        'no-output',
        'Codex finished without writing a PNG/JPEG/WebP image to its output directory.',
        run.stdout,
        run.stderr,
      )
    }

    let oversized = null
    let invalid = null
    for (const candidate of candidates) {
      let buffer
      try {
        buffer = await readFile(candidate.path)
      } catch {
        continue
      }
      if (buffer.length > LIMITS.imageBytes) {
        oversized = candidate.name
        continue
      }
      const kind = sniffImage(buffer)
      if (!kind || !GENERATED_KINDS.has(kind)) {
        invalid = candidate.name
        continue
      }
      const stored = await storeImage({
        buffer,
        assetDir,
        stem: imageStem(buffer),
        preferredExt: extname(candidate.path),
      })
      return { ok: true, asset: stored.asset, hostPath: stored.hostPath, bytes: stored.bytes }
    }

    if (oversized) {
      return failure(
        'image-too-large',
        `Codex wrote ${oversized}, which exceeds the ${IMAGE_LIMIT_MIB} MiB image limit.`,
        run.stdout,
        run.stderr,
      )
    }
    return failure(
      'invalid-image',
      `Codex wrote ${invalid ?? 'a file'}, but it is not a valid PNG/JPEG/WebP image.`,
      run.stdout,
      run.stderr,
    )
  } catch (error) {
    return failure('generation-failed', `Image generation failed: ${messageOf(error)}`)
  } finally {
    if (tmp) {
      try {
        await rm(tmp, { recursive: true, force: true })
      } catch {
        // best-effort cleanup only
      }
    }
  }
}

// ───────────────────────────── local imports ─────────────────────────────

/**
 * Validate a local PNG/JPEG/WebP/GIF file and copy it into the canvas assets
 * directory under a sanitized, unique name. Expected failures return
 * {ok:false, code, message}; missing developer arguments throw TypeError.
 *
 * @param {{ sourcePath?: string, assetDir?: string, name?: string }} [options]
 * @returns {Promise<{ok: boolean, asset?: string, hostPath?: string, bytes?: number, code?: string, message?: string}>}
 */
export async function importImage(options = {}) {
  const opts = options && typeof options === 'object' ? options : {}
  if (typeof opts.sourcePath !== 'string' || !opts.sourcePath.trim()) {
    throw new TypeError('importImage requires a sourcePath string')
  }
  if (typeof opts.assetDir !== 'string' || !opts.assetDir.trim()) {
    throw new TypeError('importImage requires an assetDir string')
  }

  const source = resolve(opts.sourcePath.trim())
  let buffer
  try {
    const info = await stat(source)
    if (!info.isFile()) {
      return { ok: false, code: 'not-file', message: `Source is not a regular file: ${opts.sourcePath}` }
    }
    if (info.size === 0) {
      return { ok: false, code: 'invalid-image', message: `Source image is empty: ${opts.sourcePath}` }
    }
    if (info.size > LIMITS.imageBytes) {
      return {
        ok: false,
        code: 'image-too-large',
        message: `Image exceeds the ${IMAGE_LIMIT_MIB} MiB limit: ${opts.sourcePath}`,
      }
    }
    buffer = await readFile(source)
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return { ok: false, code: 'not-found', message: `Image not found: ${opts.sourcePath}` }
    }
    return { ok: false, code: 'import-failed', message: `Could not read ${opts.sourcePath}: ${messageOf(error)}` }
  }

  if (buffer.length === 0) {
    return { ok: false, code: 'invalid-image', message: `Source image is empty: ${opts.sourcePath}` }
  }
  if (buffer.length > LIMITS.imageBytes) {
    return {
      ok: false,
      code: 'image-too-large',
      message: `Image exceeds the ${IMAGE_LIMIT_MIB} MiB limit: ${opts.sourcePath}`,
    }
  }
  const kind = sniffImage(buffer)
  if (!kind) {
    return {
      ok: false,
      code: 'unsupported-image',
      message: `Source is not a PNG, JPEG, WebP or GIF image: ${opts.sourcePath}`,
    }
  }

  try {
    const requestedName = typeof opts.name === 'string' && opts.name.trim() ? opts.name : basename(source)
    const stored = await storeImage({
      buffer,
      assetDir: opts.assetDir.trim(),
      stem: requestedName,
      preferredExt: extname(requestedName),
    })
    return { ok: true, asset: stored.asset, hostPath: stored.hostPath, bytes: stored.bytes }
  } catch (error) {
    return { ok: false, code: 'copy-failed', message: `Could not store the image: ${messageOf(error)}` }
  }
}
