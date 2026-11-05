import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'

import { loadCanvasSkill, registerCanvasSkills, SKILL_NAME } from '../lib/host/skills.js'

const skill = loadCanvasSkill()
const skillRoot = resolve(dirname(skill.path))

async function listMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await listMarkdown(full)))
    else if (entry.name.endsWith('.md')) files.push(full)
  }
  return files
}

test('the canvas UI skill has a valid frontmatter and body', () => {
  assert.equal(skill.name, SKILL_NAME)
  assert.equal(skill.name, 'canvas-ui-design')
  assert.ok(skill.description.length > 20)
  assert.ok(skill.whenToUse.length > 10)
  assert.match(skill.content, /canvas_read/)
  assert.match(skill.content, /canvas_write/)
  assert.match(skill.content, /canvas_audit/)
  assert.match(skill.content, /canvas_image/)
  assert.match(skill.content, /iPhone 16/)
  assert.equal(skill.directory, skillRoot)
})

test('the skill directory contains the adapted workflows and references', async () => {
  const required = [
    'workflows/requirements.md',
    'workflows/information-architecture.md',
    'workflows/design-system.md',
    'workflows/component-builder.md',
    'workflows/screen-designer.md',
    'workflows/design-refactor.md',
    'workflows/design-audit.md',
    'workflows/assets.md',
    'workflows/style-adaptation.md',
    'workflows/developer-handoff.md',
    'references/foundation.md',
    'references/tokens.md',
    'references/reference-fidelity.md',
    'references/canvas.md',
    'references/canvas-layout.md',
    'references/delivery.md',
    'references/asset-handoff.md',
    'assets/style-contract-template.md',
    'foundation/base.json',
    'presets/neutral.json',
  ]
  for (const relative of required) {
    const info = await stat(join(skillRoot, relative))
    assert.ok(info.isFile(), `${relative} should be a file`)
  }
  for (const preset of ['minimal', 'soft', 'compact']) {
    const info = await stat(join(skillRoot, 'presets', `${preset}.json`))
    assert.ok(info.isFile(), `preset ${preset} should exist`)
  }
})

test('all relative markdown links resolve inside the skill package', async () => {
  const files = await listMarkdown(skillRoot)
  const broken = []
  for (const file of files) {
    const text = await readFile(file, 'utf8')
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const raw = match[1].trim()
      if (!raw || raw.startsWith('#') || raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto:')) continue
      const target = raw.split('#')[0]
      if (!target) continue
      try {
        const info = await stat(resolve(dirname(file), target))
        if (!info.isFile() && !info.isDirectory()) broken.push(`${file}: ${raw}`)
      } catch {
        broken.push(`${file}: ${raw}`)
      }
    }
  }
  assert.deepEqual(broken, [])
})

test('runtime registration is optional and registers a model+user invocable skill', () => {
  const registered = []
  const disposers = []
  const ctx = {
    get(key) {
      if (key !== 'skills') return undefined
      return {
        register(input) {
          registered.push(input)
          return () => {}
        },
      }
    },
  }
  assert.equal(registerCanvasSkills(ctx, disposers), true)
  assert.equal(registered.length, 1)
  const [entry] = registered
  assert.equal(entry.name, 'canvas-ui-design')
  assert.equal(entry.source, 'dsh-canvas')
  assert.deepEqual(entry.invocation, { modelInvocable: true, userInvocable: true })
  assert.equal(entry.resourceBase.kind, 'directory')
  assert.equal(entry.resourceBase.path, skillRoot)
  assert.equal(typeof entry.content, 'string')
  assert.equal(disposers.length, 1)
  assert.equal(registerCanvasSkills({ get: () => undefined }), false)
})
