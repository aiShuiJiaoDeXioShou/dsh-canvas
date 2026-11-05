// @ts-nocheck
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chmod, mkdir, mkdtemp, readFile, rm, stat, truncate, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { LIMITS } from '../src/shared/format.js'
import { detectImageCapabilities, generateWithCodex, importImage } from '../src/host/image.js'

const fakeCodex = fileURLToPath(new URL('./fixtures/fake-codex.mjs', import.meta.url))
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
const JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0xff, 0xd9,
])
const WEBP = (() => {
  const buffer = Buffer.alloc(12)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(4, 4)
  buffer.write('WEBP', 8, 'ascii')
  return buffer
})()
const GIF = Buffer.concat([Buffer.from('GIF89a', 'ascii'), Buffer.alloc(8)])

const root = await mkdtemp(join(tmpdir(), 'dsh-canvas-image-test-'))
let caseSequence = 0

after(async () => {
  await rm(root, { recursive: true, force: true })
})

/** @param {string} label */
async function caseDir(label) {
  caseSequence += 1
  const directory = join(root, `${label}-${caseSequence}`)
  await mkdir(directory, { recursive: true })
  return directory
}

/**
 * Write a tiny POSIX wrapper around the fixture so the tests exercise real
 * spawn + PATH resolution without relying on the fixture's executable bit or a
 * globally installed Codex.
 * @param {string} directory
 * @param {string} [name]
 */
async function makeFakeBin(directory, name = 'fake-codex') {
  const file = join(directory, name)
  await writeFile(file, `#!/bin/sh\nexec "${process.execPath}" "${fakeCodex}" "$@"\n`, 'utf8')
  await chmod(file, 0o755)
  return file
}

/** @param {string} logPath */
async function readCalls(logPath) {
  try {
    const text = await readFile(logPath, 'utf8')
    return text
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  } catch {
    return []
  }
}

/** @param {Buffer} buffer @param {string} kind */
function assertMagic(buffer, kind) {
  if (kind === 'png') assert.deepEqual([...buffer.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (kind === 'jpeg') assert.deepEqual([...buffer.subarray(0, 3)], [0xff, 0xd8, 0xff])
  if (kind === 'webp') {
    assert.equal(buffer.toString('ascii', 0, 4), 'RIFF')
    assert.equal(buffer.toString('ascii', 8, 12), 'WEBP')
  }
  if (kind === 'gif') assert.match(buffer.toString('ascii', 0, 6), /^GIF8[79]a$/)
}

// ───────────────────────────── capability detection ─────────────────────────────

test('detects GPT/OpenAI provider and model names case-insensitively', async () => {
  const missing = join(root, 'definitely-not-codex')
  const cases = [
    [{ provider: 'openai', model: 'gpt-5.1' }, true],
    [{ provider: 'azure', model: 'gpt-4o-mini' }, true],
    [{ provider: 'openai-compatible', model: 'some-model' }, true],
    [{ provider: 'anthropic', model: 'o3-mini' }, true],
    [{ provider: 'local', model: 'gpt4' }, true],
    [{ provider: 'OPENAI', model: 'GPT-4.1' }, true],
    [{ provider: 'anthropic', model: 'claude-sonnet-4' }, false],
    [{ provider: 'google', model: 'gemini-2.5' }, false],
    [{ provider: 'local', model: 'gptx' }, false],
    [{ provider: 'local', model: 'foo1' }, false],
  ]
  for (const [modelSelection, expected] of cases) {
    const caps = await detectImageCapabilities({ modelSelection, codexBin: missing, timeoutMs: 2_000 })
    assert.equal(caps.nativeImage, expected, JSON.stringify(modelSelection))
    assert.equal(caps.recommended, expected ? 'native' : 'none', JSON.stringify(modelSelection))
    assert.equal(caps.codex.available, false)
    assert.equal(caps.codex.imageGeneration, false)
  }
})

test('reports an unknown model and missing Codex without throwing', async () => {
  const caps = await detectImageCapabilities({
    modelSelection: null,
    codexBin: join(root, 'missing-codex'),
    timeoutMs: 2_000,
  })
  assert.equal(caps.model, null)
  assert.equal(caps.nativeImage, false)
  assert.equal(caps.recommended, 'none')
  assert.ok(Array.isArray(caps.notes))
  assert.ok(caps.notes.some((note) => /No model selection/i.test(note)))
  assert.ok(caps.notes.some((note) => /not found/i.test(note)))
})

test('detects Codex and its stable image_generation feature', async () => {
  const directory = await caseDir('capabilities')
  const bin = await makeFakeBin(directory)
  const caps = await detectImageCapabilities({
    modelSelection: { provider: 'anthropic', model: 'claude-sonnet' },
    codexBin: bin,
    timeoutMs: 5_000,
  })
  assert.equal(caps.codex.available, true)
  assert.equal(caps.codex.bin, bin)
  assert.match(caps.codex.version, /9\.9\.9/)
  assert.equal(caps.codex.imageGeneration, true)
  assert.equal(caps.recommended, 'codex')
  assert.ok(caps.notes.some((note) => /image_generation/i.test(note)))

  const native = await detectImageCapabilities({
    modelSelection: { provider: 'openai', model: 'gpt-5.1' },
    codexBin: bin,
    timeoutMs: 5_000,
  })
  assert.equal(native.nativeImage, true)
  assert.equal(native.recommended, 'native')
})

test('requires image_generation on a stable true feature row', async () => {
  const directory = await caseDir('features')
  const bin = await makeFakeBin(directory)

  const off = await detectImageCapabilities({
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'features-off' },
    timeoutMs: 5_000,
  })
  assert.equal(off.codex.available, true)
  assert.equal(off.codex.imageGeneration, false)
  assert.equal(off.recommended, 'none')

  const failed = await detectImageCapabilities({
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'features-fail' },
    timeoutMs: 5_000,
  })
  assert.equal(failed.codex.available, true)
  assert.equal(failed.codex.imageGeneration, false)
  assert.ok(failed.notes.some((note) => /features list/i.test(note)))

  const whitespace = await detectImageCapabilities({
    codexBin: bin,
    env: { FAKE_CODEX_FEATURES: 'name\tstage\tstatus\nimage_generation\t stable \t true \n' },
    timeoutMs: 5_000,
  })
  assert.equal(whitespace.codex.imageGeneration, true)
})

test('finds Codex through PATH and defaults from DSH_CANVAS_CODEX_BIN', async () => {
  const directory = await caseDir('path-lookup')
  const binDirectory = join(directory, 'bin')
  await mkdir(binDirectory)
  const bin = await makeFakeBin(binDirectory, 'codex')

  const viaPath = await detectImageCapabilities({
    codexBin: 'codex',
    env: { PATH: binDirectory },
    timeoutMs: 5_000,
  })
  assert.equal(viaPath.codex.available, true)
  assert.equal(viaPath.codex.bin, bin)

  const viaEnvironment = await detectImageCapabilities({
    env: { PATH: binDirectory, DSH_CANVAS_CODEX_BIN: 'codex' },
    timeoutMs: 5_000,
  })
  assert.equal(viaEnvironment.codex.available, true)
  assert.equal(viaEnvironment.codex.bin, bin)
})

test('a failed version probe leaves Codex unavailable but still reports its bin', async () => {
  const directory = await caseDir('version-fail')
  const bin = await makeFakeBin(directory)
  const caps = await detectImageCapabilities({
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'version-fail' },
    timeoutMs: 5_000,
  })
  assert.equal(caps.codex.available, false)
  assert.equal(caps.codex.imageGeneration, false)
  assert.equal(caps.codex.bin, bin)
  assert.equal(caps.recommended, 'none')
  assert.ok(caps.notes.some((note) => /version/i.test(note)))
})

test('supports an injected spawner and virtual binary names', async () => {
  const calls = []
  const spawnImpl = (command, args, options) => {
    calls.push({ command, args })
    return spawn(process.execPath, [fakeCodex, ...args], options)
  }
  const caps = await detectImageCapabilities({
    modelSelection: { provider: 'anthropic', model: 'claude-sonnet' },
    codexBin: 'virtual-codex',
    spawnImpl,
    env: { PATH: '' },
    timeoutMs: 5_000,
  })
  assert.equal(caps.codex.available, true)
  assert.equal(caps.codex.bin, 'virtual-codex')
  assert.equal(caps.codex.imageGeneration, true)
  assert.ok(calls.length >= 2)
  assert.equal(calls[0].command, 'virtual-codex')
})

test('accepts a promise-returning spawnImpl', async () => {
  const spawnImpl = async (_command, args) => {
    if (args[0] === '--version') return { code: 0, stdout: 'codex-cli 1.2.3\n' }
    return { code: 0, stdout: 'image_generation   stable   true\n' }
  }
  const caps = await detectImageCapabilities({
    codexBin: 'codex-virtual',
    spawnImpl,
    env: { PATH: '' },
    timeoutMs: 5_000,
  })
  assert.equal(caps.codex.available, true)
  assert.equal(caps.codex.version, 'codex-cli 1.2.3')
  assert.equal(caps.codex.imageGeneration, true)
  assert.equal(caps.recommended, 'codex')
})

// ───────────────────────────── Codex generation ─────────────────────────────

test('generates with codex exec and stores a valid image asset', async () => {
  const directory = await caseDir('generate-ok')
  const outDir = join(directory, 'tmp')
  const assetDir = join(directory, 'canvas', 'assets')
  const logPath = join(directory, 'calls.log')
  const bin = await makeFakeBin(directory)

  const result = await generateWithCodex({
    prompt: 'A cat astronaut floating in space',
    outDir,
    assetDir,
    codexBin: bin,
    timeoutMs: 10_000,
    env: { FAKE_CODEX_LOG: logPath },
  })

  assert.equal(result.ok, true)
  assert.match(result.asset, /^assets\/image-[0-9a-f]{16}\.png$/)
  assert.ok(isAbsolute(result.hostPath))
  assert.equal(result.hostPath, join(resolve(assetDir), result.asset.slice('assets/'.length)))
  assert.equal(result.bytes, PNG.length)
  const stored = await readFile(result.hostPath)
  assert.deepEqual(stored, PNG)
  assertMagic(stored, 'png')

  const calls = await readCalls(logPath)
  const execCall = calls.find((call) => call.argv[0] === 'exec')
  assert.ok(execCall)
  const cdIndex = execCall.argv.indexOf('--cd')
  assert.ok(cdIndex > 0)
  const tmpDir = execCall.argv[cdIndex + 1]
  assert.ok(tmpDir.startsWith(resolve(outDir)))
  // macOS reports /private/var for the resolved /var path. The temp directory
  // is already removed by now, so compare the paths textually.
  assert.equal(execCall.cwd.replace(/^\/private(?=\/var\/)/, ''), tmpDir)
  assert.deepEqual(execCall.argv.slice(0, 8), [
    'exec',
    '--skip-git-repo-check',
    '--ephemeral',
    '--json',
    '--sandbox',
    'workspace-write',
    '--cd',
    tmpDir,
  ])
  const lastMessageIndex = execCall.argv.indexOf('--output-last-message')
  assert.equal(execCall.argv[lastMessageIndex + 1], join(tmpDir, 'last.txt'))
  const prompt = execCall.argv[execCall.argv.length - 1]
  assert.match(prompt, /image_generation/)
  assert.match(prompt, /output\.png/)
  assert.match(prompt, /A cat astronaut floating in space/)
  assert.equal(execCall.argv.length, 11)

  // The temporary Codex work directory is cleaned up after the asset is copied.
  await assert.rejects(stat(tmpDir), (error) => error.code === 'ENOENT')
})

test('accepts WebP/JPEG output and skips an invalid output.png', async () => {
  const directory = await caseDir('generate-alt')
  const assetDir = join(directory, 'assets')
  const bin = await makeFakeBin(directory)

  const webp = await generateWithCodex({
    prompt: 'abstract shapes',
    assetDir,
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'webp' },
  })
  assert.equal(webp.ok, true)
  assert.match(webp.asset, /^assets\/image-[0-9a-f]{16}\.webp$/)
  const webpBytes = await readFile(webp.hostPath)
  assert.deepEqual(webpBytes, WEBP)
  assertMagic(webpBytes, 'webp')

  const jpeg = await generateWithCodex({
    prompt: 'abstract shapes',
    assetDir,
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'jpeg' },
  })
  assert.equal(jpeg.ok, true)
  assert.match(jpeg.asset, /^assets\/image-[0-9a-f]{16}\.jpeg$/)
  const jpegBytes = await readFile(jpeg.hostPath)
  assert.deepEqual(jpegBytes, JPEG)
  assertMagic(jpegBytes, 'jpeg')

  const two = await generateWithCodex({
    prompt: 'abstract shapes',
    assetDir,
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'two-images' },
  })
  assert.equal(two.ok, true)
  assert.match(two.asset, /^assets\/image-[0-9a-f]{16}\.png$/)
  assert.deepEqual(await readFile(two.hostPath), PNG)
})

test('reports no output with a clear code and output tail', async () => {
  const directory = await caseDir('generate-none')
  const bin = await makeFakeBin(directory)
  const result = await generateWithCodex({
    prompt: 'a lighthouse at night',
    assetDir: join(directory, 'assets'),
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'no-output' },
  })
  assert.equal(result.ok, false)
  assert.equal(result.code, 'no-output')
  assert.match(result.message, /without writing/i)
  assert.match(result.rawOutputTail, /no image/i)
  assert.equal(result.asset, undefined)
})

test('reports a non-zero Codex exit with stderr in the tail', async () => {
  const directory = await caseDir('generate-nonzero')
  const bin = await makeFakeBin(directory)
  const result = await generateWithCodex({
    prompt: 'a lighthouse at night',
    assetDir: join(directory, 'assets'),
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'nonzero' },
  })
  assert.equal(result.ok, false)
  assert.equal(result.code, 'codex-failed')
  assert.match(result.message, /exit code 7/i)
  assert.match(result.rawOutputTail, /image generation failed/i)
})

test('times out and kills a hanging Codex process', async () => {
  const directory = await caseDir('generate-timeout')
  const bin = await makeFakeBin(directory)
  const startedAt = Date.now()
  const result = await generateWithCodex({
    prompt: 'a lighthouse at night',
    assetDir: join(directory, 'assets'),
    codexBin: bin,
    timeoutMs: 300,
    env: { FAKE_CODEX_SCENARIO: 'hang' },
  })
  assert.equal(result.ok, false)
  assert.equal(result.code, 'timeout')
  assert.match(result.message, /300 ms/i)
  assert.ok(Date.now() - startedAt < 5_000)
})

test('rejects an output file with invalid magic bytes', async () => {
  const directory = await caseDir('generate-invalid')
  const bin = await makeFakeBin(directory)
  const result = await generateWithCodex({
    prompt: 'a lighthouse at night',
    assetDir: join(directory, 'assets'),
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'invalid-image' },
  })
  assert.equal(result.ok, false)
  assert.equal(result.code, 'invalid-image')
  assert.match(result.message, /not a valid/i)
})

test('rejects a generated image over the 20 MiB limit', async () => {
  const directory = await caseDir('generate-oversized')
  const bin = await makeFakeBin(directory)
  const result = await generateWithCodex({
    prompt: 'a lighthouse at night',
    assetDir: join(directory, 'assets'),
    codexBin: bin,
    env: { FAKE_CODEX_SCENARIO: 'oversized' },
  })
  assert.equal(result.ok, false)
  assert.equal(result.code, 'image-too-large')
  assert.match(result.message, /20 MiB/i)
})

test('validates developer arguments and a missing Codex binary', async () => {
  const directory = await caseDir('generate-args')
  await assert.rejects(generateWithCodex({ assetDir: join(directory, 'assets') }), TypeError)
  await assert.rejects(generateWithCodex({ prompt: 'x' }), TypeError)
  const missing = await generateWithCodex({
    prompt: 'x',
    assetDir: join(directory, 'assets'),
    codexBin: join(directory, 'missing-codex'),
  })
  assert.equal(missing.ok, false)
  assert.equal(missing.code, 'codex-not-found')
  assert.match(missing.message, /not found/i)
})

// ───────────────────────────── local imports ─────────────────────────────

test('imports a local PNG into assets', async () => {
  const directory = await caseDir('import-ok')
  const sourcePath = join(directory, 'photo.png')
  await writeFile(sourcePath, PNG)
  const assetDir = join(directory, 'canvas', 'assets')

  const result = await importImage({ sourcePath, assetDir })
  assert.equal(result.ok, true)
  assert.equal(result.asset, 'assets/photo.png')
  assert.equal(result.hostPath, join(resolve(assetDir), 'photo.png'))
  assert.equal(result.bytes, PNG.length)
  assert.deepEqual(await readFile(result.hostPath), PNG)
})

test('sanitizes imported names and never overwrites an existing asset', async () => {
  const directory = await caseDir('import-name')
  const sourcePath = join(directory, 'photo.png')
  await writeFile(sourcePath, PNG)
  const assetDir = join(directory, 'assets')

  const first = await importImage({ sourcePath, assetDir, name: 'My Photo! (1).PNG' })
  assert.equal(first.ok, true)
  assert.equal(first.asset, 'assets/My-Photo-1.png')

  const second = await importImage({ sourcePath, assetDir, name: 'My Photo! (1).PNG' })
  assert.equal(second.ok, true)
  assert.equal(second.asset, 'assets/My-Photo-1-1.png')
  assert.notEqual(first.hostPath, second.hostPath)
  assert.deepEqual(await readFile(second.hostPath), PNG)

  const traversal = await importImage({ sourcePath, assetDir, name: '../../evil.png' })
  assert.equal(traversal.ok, true)
  assert.equal(traversal.asset, 'assets/evil.png')
  assert.equal(traversal.hostPath, join(resolve(assetDir), 'evil.png'))
})

test('imports GIF and preserves a matching JPEG extension', async () => {
  const directory = await caseDir('import-formats')
  const assetDir = join(directory, 'assets')
  const gifPath = join(directory, 'animation.gif')
  const jpegPath = join(directory, 'photo.jpeg')
  await writeFile(gifPath, GIF)
  await writeFile(jpegPath, JPEG)

  const gif = await importImage({ sourcePath: gifPath, assetDir })
  assert.equal(gif.ok, true)
  assert.equal(gif.asset, 'assets/animation.gif')
  assertMagic(await readFile(gif.hostPath), 'gif')

  const jpeg = await importImage({ sourcePath: jpegPath, assetDir })
  assert.equal(jpeg.ok, true)
  assert.equal(jpeg.asset, 'assets/photo.jpeg')
  assertMagic(await readFile(jpeg.hostPath), 'jpeg')
})

test('returns structured failures for missing, non-file, unsupported and oversized sources', async () => {
  const directory = await caseDir('import-fail')
  const assetDir = join(directory, 'assets')

  const missing = await importImage({ sourcePath: join(directory, 'nope.png'), assetDir })
  assert.equal(missing.ok, false)
  assert.equal(missing.code, 'not-found')

  const folder = join(directory, 'folder')
  await mkdir(folder)
  const notFile = await importImage({ sourcePath: folder, assetDir })
  assert.equal(notFile.ok, false)
  assert.equal(notFile.code, 'not-file')

  const textPath = join(directory, 'note.txt')
  await writeFile(textPath, 'plain text, not an image')
  const unsupported = await importImage({ sourcePath: textPath, assetDir })
  assert.equal(unsupported.ok, false)
  assert.equal(unsupported.code, 'unsupported-image')

  const oversizedPath = join(directory, 'oversized.png')
  await writeFile(oversizedPath, PNG)
  await truncate(oversizedPath, LIMITS.imageBytes + 1)
  const oversized = await importImage({ sourcePath: oversizedPath, assetDir })
  assert.equal(oversized.ok, false)
  assert.equal(oversized.code, 'image-too-large')

  await assert.rejects(importImage({ assetDir }), TypeError)
  await assert.rejects(importImage({ sourcePath: textPath }), TypeError)
})
