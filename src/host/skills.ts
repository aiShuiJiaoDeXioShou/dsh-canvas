/**
 * Runtime DSH skills shipped with dsh-canvas.
 *
 * Skill bodies live in `skills/<name>/SKILL.md` so the source of truth stays
 * editable as Markdown. Registration is optional: hosts without the skill
 * service keep the canvas working.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const SKILL_NAME = 'canvas-ui-design'
export const FIGMA_SETUP_SKILL_NAME = 'canvas-figma-setup'

const BUNDLED_SKILLS = [
  { name: SKILL_NAME, dirUrl: new URL('../../skills/canvas-ui-design/', import.meta.url) },
  { name: FIGMA_SETUP_SKILL_NAME, dirUrl: new URL('../../skills/canvas-figma-setup/', import.meta.url) },
] as const

export interface LoadedCanvasSkill {
  name: string
  description: string
  whenToUse?: string
  content: string
  path: string
  directory: string
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  if (!match) throw new Error('SKILL.md is missing YAML frontmatter')
  const meta: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    if (key) meta[key] = value.replace(/^(['"])(.*)\1$/, '$2')
  }
  return { meta, body: match[2].trim() }
}

function loadSkillFromDir(expectedName: string, dirUrl: URL): LoadedCanvasSkill {
  const fileUrl = new URL('SKILL.md', dirUrl)
  const raw = readFileSync(fileUrl, 'utf8')
  const { meta, body } = parseFrontmatter(raw)
  if (meta.name !== expectedName) throw new Error(`skill name must be "${expectedName}"`)
  if (!meta.description) throw new Error(`skill "${expectedName}" requires a description`)
  if (!body) throw new Error(`skill "${expectedName}" has an empty body`)
  return {
    name: meta.name,
    description: meta.description,
    ...(meta.whenToUse ? { whenToUse: meta.whenToUse } : {}),
    content: body,
    path: fileURLToPath(fileUrl),
    directory: resolve(fileURLToPath(dirUrl)),
  }
}

export function loadCanvasSkill(): LoadedCanvasSkill {
  return loadSkillFromDir(SKILL_NAME, BUNDLED_SKILLS[0].dirUrl)
}

export function loadFigmaSetupSkill(): LoadedCanvasSkill {
  return loadSkillFromDir(FIGMA_SETUP_SKILL_NAME, BUNDLED_SKILLS[1].dirUrl)
}

export function loadAllCanvasSkills(): LoadedCanvasSkill[] {
  return BUNDLED_SKILLS.map((spec) => loadSkillFromDir(spec.name, spec.dirUrl))
}

/**
 * Register all bundled dsh-canvas skills into the current host's skill registry.
 */
export function registerCanvasSkills(
  ctx: { get?: (key: string) => unknown } | null | undefined,
  disposers?: Array<() => void>,
): boolean {
  const skills = ctx?.get?.('skills') as { register?: (entry: Record<string, unknown>) => unknown } | undefined
  if (!skills || typeof skills.register !== 'function') return false
  let registered = false
  for (const skill of loadAllCanvasSkills()) {
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
      if (typeof dispose === 'function') disposers?.push(dispose as () => void)
      registered = true
    } catch (error) {
      console.warn(
        `[dsh-canvas] could not register skill "${skill.name}":`,
        error instanceof Error ? error.message : error,
      )
    }
  }
  return registered
}
