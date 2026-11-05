#!/usr/bin/env node
/**
 * Test double for the Codex CLI used by tests/image.test.mjs.
 *
 * The scenario is selected with FAKE_CODEX_SCENARIO:
 *   ok (default), no-output, nonzero, hang, invalid-image, webp, jpeg, two-images
 *   version-fail, features-fail, features-off
 *
 * FAKE_CODEX_VERSION overrides the `--version` output and
 * FAKE_CODEX_FEATURES overrides the `features list` output.
 *
 * When FAKE_CODEX_LOG is set, every invocation appends one JSON line with
 * { argv, cwd, scenario }. This keeps the tests independent of the real CLI.
 */

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const argv = process.argv.slice(2)
const scenario = process.env.FAKE_CODEX_SCENARIO ?? 'ok'
const logPath = process.env.FAKE_CODEX_LOG

if (logPath) {
  try {
    mkdirSync(dirname(logPath), { recursive: true })
    appendFileSync(logPath, JSON.stringify({ argv, cwd: process.cwd(), scenario }) + '\n')
  } catch {
    // The log is a test convenience; never fail because of it.
  }
}

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

/**
 * Find the value of a `--flag value` pair in argv.
 * @param {string} flag
 * @returns {string | undefined}
 */
function flagValue(flag) {
  const index = argv.indexOf(flag)
  return index === -1 ? undefined : argv[index + 1]
}

/**
 * Write the file Codex would mention in --output-last-message.
 * @param {string | undefined} lastMessagePath
 * @param {string} text
 */
function writeLastMessage(lastMessagePath, text) {
  if (!lastMessagePath) return
  mkdirSync(dirname(lastMessagePath), { recursive: true })
  writeFileSync(lastMessagePath, text)
}

/** @param {string} path @param {Buffer} bytes */
function writeImage(path, bytes) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, bytes)
}

/** @param {string} imagePath */
function succeed(imagePath) {
  const lastMessagePath = flagValue('--output-last-message')
  writeLastMessage(lastMessagePath, `${imagePath}\n`)
  process.stdout.write(JSON.stringify({ type: 'message', image: imagePath }) + '\n')
}

const command = argv[0]

if (command === '--version' || command === '-V') {
  if (scenario === 'version-fail') {
    process.stderr.write('fake-codex: version probe failed\n')
    process.exit(1)
  }
  process.stdout.write(`${process.env.FAKE_CODEX_VERSION ?? 'codex-cli 9.9.9'}\n`)
  process.exit(0)
}

if (command === 'features' && (argv[1] === 'list' || argv[1] === 'ls')) {
  if (scenario === 'features-fail') {
    process.stderr.write('fake-codex: could not list features\n')
    process.exit(1)
  }
  if (process.env.FAKE_CODEX_FEATURES != null) {
    process.stdout.write(process.env.FAKE_CODEX_FEATURES)
    process.exit(0)
  }
  const enabled = scenario !== 'features-off'
  process.stdout.write(
    [
      'Codex features:',
      `  image_generation    stable    ${enabled ? 'true' : 'false'}`,
      '  remote_compaction   beta      false',
      '',
    ].join('\n'),
  )
  process.exit(0)
}

if (command === 'exec') {
  const cd = flagValue('--cd')
  const outputDir = cd ? resolve(cd) : process.cwd()
  mkdirSync(outputDir, { recursive: true })
  const lastMessagePath = flagValue('--output-last-message')
  const prompt = argv[argv.length - 1] ?? ''

  if (scenario === 'nonzero') {
    process.stderr.write('fake-codex: image generation failed (exit 7)\n')
    process.exit(7)
  }

  if (scenario === 'hang') {
    process.stdout.write('fake-codex: waiting forever\n')
    // Keep the process alive until the caller kills it. Awaiting forever also
    // stops module evaluation here, so the unsupported-command fallback below
    // cannot run.
    await new Promise(() => {
      setInterval(() => {}, 1000)
    })
  } else if (scenario === 'no-output') {
    writeLastMessage(lastMessagePath, 'No image was generated.\n')
    process.stdout.write('codex: no image was generated for this request\n')
    process.exit(0)
  } else if (scenario === 'invalid-image') {
    const outputPath = resolve(outputDir, 'output.png')
    writeImage(outputPath, Buffer.from('this is not an image'))
    succeed(outputPath)
    process.exit(0)
  } else if (scenario === 'webp') {
    const outputPath = resolve(outputDir, 'art.webp')
    writeImage(outputPath, WEBP)
    succeed(outputPath)
    process.exit(0)
  } else if (scenario === 'jpeg') {
    const outputPath = resolve(outputDir, 'render.jpeg')
    writeImage(outputPath, JPEG)
    succeed(outputPath)
    process.exit(0)
  } else if (scenario === 'oversized') {
    const outputPath = resolve(outputDir, 'output.png')
    // One byte over the 20 MiB image limit in lib/format.js.
    const oversized = Buffer.alloc(20 * 1024 * 1024 + 1)
    PNG.copy(oversized)
    writeImage(outputPath, oversized)
    succeed(outputPath)
    process.exit(0)
  } else if (scenario === 'two-images') {
    const invalidPath = resolve(outputDir, 'output.png')
    const validPath = resolve(outputDir, 'second.png')
    writeImage(invalidPath, Buffer.from('not a png either'))
    writeImage(validPath, PNG)
    succeed(validPath)
    process.exit(0)
  } else {
    const outputPath = resolve(outputDir, 'output.png')
    writeImage(outputPath, PNG)
    succeed(outputPath)
    process.stdout.write(JSON.stringify({ type: 'message', promptLength: prompt.length }) + '\n')
    process.exit(0)
  }
}

process.stderr.write(`fake-codex: unsupported command ${JSON.stringify(argv)}\n`)
process.exit(2)
