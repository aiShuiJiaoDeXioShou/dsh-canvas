/**
 * Runtime DSH skills shipped with dsh-canvas.
 *
 * The skill body is read from the package `skills/` directory so the source of
 * truth stays editable as Markdown. Registration is optional: hosts without the
 * skill service keep the canvas working.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR_URL = new URL('../../skills/canvas-ui-design/', import.meta.url)
const SKILL_FILE_URL = new URL('SKILL.md', SKILL_DIR_URL)
export const SKILL_NAME = 'canvas-ui-design'

function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  if (!match) throw new Error('SKILL.md is missing YAML frontmatter')
  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    if (key) meta[key] = value.replace(/^(['"])(.*)\1$/, '$2')
  }
  return { meta, body: match[2].trim() }
}

/** @returns {{ name: string, description: string, whenToUse?: string, content: string, path: string, directory: string }} */
export function loadCanvasSkill() {
  const raw = readFileSync(SKILL_FILE_URL, 'utf8')
  const { meta, body } = parseFrontmatter(raw)
  if (meta.name !== SKILL_NAME) throw new Error(`skill name must be "${SKILL_NAME}"`)
  if (!meta.description) throw new Error(`skill "${SKILL_NAME}" requires a description`)
  if (!body) throw new Error(`skill "${SKILL_NAME}" has an empty body`)
  return {
    name: meta.name,
    description: meta.description,
    ...(meta.whenToUse ? { whenToUse: meta.whenToUse } : {}),
    content: body,
    path: fileURLToPath(SKILL_FILE_URL),
    directory: resolve(fileURLToPath(SKILL_DIR_URL)),
  }
}

/**
 * Register the canvas UI skill into the current host's skill registry.
 * @param {{ get: (key: string) => any }} ctx
 * @param {Array<() => void>} [disposers]
 * @returns {boolean} whether a skill was registered
 */
export function registerCanvasSkills(ctx, disposers) {
  const skills = ctx?.get?.('skills')
  if (!skills || typeof skills.register !== 'function') return false
  const skill = loadCanvasSkill()
  try {
    const dispose = skills.register({
      name: skill.name,
      description: skill.description,
      ...(skill.whenToUse ? { whenToUse: skill.whenToUse } : {}),
      source: 'dsh-canvas',
      content: skill.content,
      path: skill.path,
      resourceBase: { kind: 'directory', path: skill.directory },
      invocation: { modelInvocable: true, userInvocable: true },
    })
    if (typeof dispose === 'function') disposers?.push(dispose)
    return true
  } catch (error) {
    console.warn(`[dsh-canvas] could not register skill "${skill.name}":`, error?.message ?? error)
    return false
  }
}
