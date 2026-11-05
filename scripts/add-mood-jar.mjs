/**
 * Adds the mood-jar mobile screen to canvas/main.canvas.json.
 * Run with: node scripts/add-mood-jar.mjs
 */

import { readFile, writeFile } from 'node:fs/promises'
import { normalizeDoc } from '../lib/format.js'
import { buildScene } from '../src/client/editor/resolve.js'
import { layoutScene } from '../src/client/editor/layout.js'
import { instantiateTemplate } from '../lib/templates.js'

const ROOT = new URL('../../canvas/main.canvas.json', import.meta.url)
const X = 480
const Y = 20

const INK = '#2E2A26'
const MUTED = '#8C8178'
const CREAM = '#FFF7EF'
const WHITE = '#FFFFFF'
const CORAL = '#FF7A59'
const CORAL_SOFT = '#FFE6DC'
const YELLOW = '#FFD166'
const PINK = '#FFB3C7'
const MINT = '#8ED1B2'
const LAVENDER = '#B9A7F5'
const SKY = '#9DB8F6'
const LINE = '#F0E5DA'
const SHADOW = [{ type: 'drop-shadow', x: 0, y: 8, blur: 24, spread: 0, color: '#7A4A3220' }]
const CARD_SHADOW = [{ type: 'drop-shadow', x: 0, y: 6, blur: 18, spread: 0, color: '#7A4A3218' }]

function text(id, name, x, y, width, value, size, weight, color, extra = {}) {
  const lineHeight = extra.lineHeight ?? 1.35
  return {
    id,
    type: 'text',
    name,
    x,
    y,
    width,
    height: extra.height ?? Math.ceil(size * lineHeight),
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: value,
    font: { family: 'system-ui', weight, style: 'normal', size, lineHeight, letterSpacing: extra.letterSpacing ?? 0 },
    align: extra.align ?? 'left',
    verticalAlign: 'top',
    fills: [{ type: 'solid', color }],
    effects: [],
    autoHeight: true,
  }
}

function rect(id, name, x, y, width, height, extra = {}) {
  return {
    id,
    type: 'rect',
    name,
    x,
    y,
    width,
    height,
    rotation: extra.rotation ?? 0,
    opacity: extra.opacity ?? 1,
    visible: true,
    locked: false,
    cornerRadius: extra.r ?? 0,
    fills: extra.fill ? [{ type: 'solid', color: extra.fill }] : [],
    strokes: extra.stroke ? [{ color: extra.stroke, width: extra.sw ?? 1, align: 'center' }] : [],
    effects: extra.effects ?? [],
  }
}

function ellipse(id, name, x, y, width, height, extra = {}) {
  return {
    id,
    type: 'ellipse',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: extra.opacity ?? 1,
    visible: true,
    locked: false,
    fills: extra.fill ? [{ type: 'solid', color: extra.fill }] : [],
    strokes: extra.stroke ? [{ color: extra.stroke, width: extra.sw ?? 1, align: 'center' }] : [],
    effects: extra.effects ?? [],
  }
}

function frame(id, name, x, y, width, height, children, extra = {}) {
  return {
    id,
    type: 'frame',
    name,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: extra.opacity ?? 1,
    visible: true,
    locked: false,
    clip: extra.clip ?? true,
    cornerRadius: extra.r ?? 0,
    fills: extra.fill ? [{ type: 'solid', color: extra.fill }] : [],
    strokes: extra.stroke ? [{ color: extra.stroke, width: extra.sw ?? 1, align: 'center' }] : [],
    effects: extra.effects ?? [],
    children,
  }
}

function statCard() {
  return frame(
    'mood-stats',
    'Weekly Stats',
    16,
    184,
    358,
    84,
    [
      text('mood-stat-left-label', 'Collected label', 20, 16, 150, '本周已收集', 11, 500, MUTED, { letterSpacing: 0.2 }),
      text('mood-stat-left-value', 'Collected value', 20, 32, 44, '12', 26, 700, INK, { lineHeight: 1.2 }),
      text('mood-stat-left-unit', 'Collected unit', 66, 43, 94, '颗心情', 12, 500, MUTED),
      rect('mood-stat-divider', 'Divider', 178, 20, 1, 44, { fill: LINE }),
      text('mood-stat-right-label', 'Streak label', 198, 16, 130, '连续记录', 11, 500, MUTED, { letterSpacing: 0.2 }),
      text('mood-stat-right-value', 'Streak value', 198, 32, 30, '7', 26, 700, INK, { lineHeight: 1.2 }),
      text('mood-stat-right-unit', 'Streak unit', 225, 43, 70, '天', 12, 500, MUTED),
      text('mood-stat-star', 'Sparkle', 322, 16, 18, '✦', 15, 700, CORAL, { align: 'center' }),
      text('mood-stat-note', 'Streak note', 198, 65, 120, '保持得不错', 10, 400, MUTED),
    ],
    { fill: WHITE, r: 18, effects: CARD_SHADOW },
  )
}

function bead(id, color, x, y, size) {
  return [
    ellipse(id, 'Mood bead', x, y, size, size, { fill: color }),
    ellipse(`${id}-shine`, 'Bead shine', x + size * 0.2, y + size * 0.16, size * 0.26, size * 0.26, { fill: '#FFFFFF99' }),
  ]
}

function jar() {
  const jarChildren = [
    rect('mood-jar-shine', 'Glass shine', 22, 32, 30, 154, { fill: '#FFFFFF8C', r: 15 }),
    rect('mood-jar-shine-small', 'Glass shine small', 58, 50, 10, 74, { fill: '#FFFFFF66', r: 5 }),
    frame('mood-jar-tag', 'Jar Label', 22, 18, 92, 24, [
      text('mood-jar-tag-text', 'Label', 0, 5, 92, 'MOOD JAR', 8, 700, CORAL, { align: 'center', letterSpacing: 1.4 }),
    ], { fill: '#FFF4E8', r: 12 }),
    ...bead('mood-bead-yellow', YELLOW, 30, 140, 54),
    ...bead('mood-bead-coral', CORAL_SOFT, 92, 156, 42),
    ...bead('mood-bead-mint', MINT, 136, 138, 48),
    ...bead('mood-bead-lavender', LAVENDER, 164, 92, 38),
    ...bead('mood-bead-sky', SKY, 82, 94, 42),
    ...bead('mood-bead-pink', PINK, 34, 90, 36),
    ...bead('mood-bead-yellow-small', YELLOW, 124, 72, 24),
    ...bead('mood-bead-pink-small', PINK, 148, 182, 28),
    ...bead('mood-bead-mint-small', MINT, 44, 58, 22),
    ...bead('mood-bead-blue', SKY, 170, 174, 30),
    ...bead('mood-bead-coral-small', CORAL, 110, 206, 18),
    ...bead('mood-bead-lavender-small', LAVENDER, 64, 206, 20),
  ]
  return {
    shadow: ellipse('mood-jar-shadow', 'Jar Shadow', 95, 560, 200, 16, { fill: '#E7D9CC66' }),
    lid: [
      rect('mood-jar-knob', 'Jar knob', 177, 282, 36, 10, { fill: '#F6C56B', stroke: '#E8B45A', r: 5 }),
      rect('mood-jar-lid', 'Jar lid', 120, 290, 150, 26, { fill: '#F6C56B', stroke: '#E8B45A', r: 13 }),
      rect('mood-jar-lid-line', 'Jar lid line', 132, 297, 126, 2, { fill: '#E8B45A66', r: 1 }),
    ],
    body: frame('mood-jar', 'Glass Jar', 85, 314, 220, 244, jarChildren, {
      fill: '#FFFFFFB8',
      stroke: '#EADFD3',
      sw: 2,
      r: 44,
      effects: SHADOW,
    }),
  }
}

function moodOption(id, label, color, centerX, selected) {
  const children = []
  if (selected) {
    children.push(ellipse(`${id}-ring`, 'Selected ring', centerX - 26, 8, 52, 52, { fill: '#FFF1D4' }))
  }
  children.push(
    ellipse(`${id}-circle`, `${label} mood`, centerX - 22, 12, 44, 44, { fill: color }),
    ellipse(`${id}-shine`, 'Mood shine', centerX - 12, 20, 12, 12, { fill: '#FFFFFFB3' }),
    text(`${id}-label`, label, centerX - 30, 66, 60, label, 11, selected ? 600 : 500, selected ? INK : MUTED, { align: 'center' }),
  )
  if (selected) {
    children.push(
      ellipse(`${id}-check`, 'Selected check', centerX + 8, 8, 14, 14, { fill: CORAL }),
      text(`${id}-checkmark`, 'Check', centerX + 8, 10, 14, '✓', 9, 700, WHITE, { align: 'center' }),
    )
  }
  return children
}

function moodPicker() {
  const options = [
    ['mood-happy', '开心', YELLOW, 45, true],
    ['mood-calm', '平静', MINT, 111, false],
    ['mood-okay', '一般', '#FFE0B2', 177, false],
    ['mood-tired', '疲惫', '#D7CCF4', 243, false],
    ['mood-sad', '难过', '#BFD5F6', 309, false],
  ]
  return frame(
    'mood-picker',
    'Mood Picker',
    16,
    624,
    358,
    104,
    options.flatMap(([id, label, color, centerX, selected]) => moodOption(id, label, color, centerX, selected)),
    { fill: WHITE, r: 20, effects: CARD_SHADOW },
  )
}

function builtInStatusBar() {
  const { node } = instantiateTemplate('ios-status-bar')
  node.x = 0
  node.y = 0
  node.fills = []
  return node
}

function buildMoodFrame() {
  const jarParts = jar()
  return frame(
    'mood-jar-frame',
    '心情罐子 · Mood Jar',
    X,
    Y,
    390,
    844,
    [
      builtInStatusBar(),
      text('mood-eyebrow', 'Eyebrow', 24, 72, 200, 'MOOD JAR', 11, 700, CORAL, { letterSpacing: 2 }),
      text('mood-title', 'Title', 24, 90, 280, '心情罐子', 34, 700, INK, { lineHeight: 1.18 }),
      text('mood-subtitle', 'Subtitle', 24, 142, 320, '把今天的心情，轻轻放进罐子里', 14, 400, MUTED),
      text('mood-date', 'Date', 24, 164, 220, '6月12日 · 周三', 11, 500, MUTED, { letterSpacing: 0.2 }),
      ellipse('mood-avatar', 'Avatar', 330, 80, 44, 44, { fill: '#FFE7D8' }),
      text('mood-avatar-text', 'Avatar label', 330, 92, 44, '你', 15, 600, CORAL, { align: 'center' }),
      statCard(),
      jarParts.shadow,
      ...jarParts.lid,
      jarParts.body,
      text('mood-jar-caption', 'Jar caption', 16, 578, 358, '12 颗心情正在罐子里发光 ✦', 13, 500, MUTED, { align: 'center' }),
      text('mood-section-label', 'Section label', 24, 606, 180, '此刻心情', 12, 600, MUTED, { letterSpacing: 0.4 }),
      text('mood-section-hint', 'Section hint', 220, 607, 154, '选一个放进罐子', 11, 400, MUTED, { align: 'right' }),
      moodPicker(),
      rect('mood-cta', 'Mood CTA', 16, 742, 358, 52, { fill: CORAL, r: 18, effects: [{ type: 'drop-shadow', x: 0, y: 8, blur: 20, spread: 0, color: '#FF7A5938' }] }),
      text('mood-cta-text', 'CTA label', 16, 758, 358, '放入一颗心情', 16, 600, WHITE, { align: 'center' }),
      text('mood-note', 'Footnote', 16, 802, 358, '今天还没有记录，先选一个心情吧', 11, 400, MUTED, { align: 'center' }),
      rect('mood-home-indicator', 'Home Indicator', 128, 826, 134, 5, { fill: INK, r: 3, opacity: 0.22 }),
      text('mood-sparkle-1', 'Sparkle', 318, 286, 24, '✦', 18, 700, CORAL, { align: 'center' }),
      text('mood-heart-1', 'Heart', 46, 352, 24, '♥', 18, 700, PINK, { align: 'center' }),
      text('mood-sparkle-2', 'Sparkle', 320, 454, 20, '✦', 14, 700, MINT, { align: 'center' }),
      text('mood-heart-2', 'Heart', 54, 520, 20, '♥', 14, 700, SKY, { align: 'center' }),
    ],
    { fill: CREAM, clip: true },
  )
}

const raw = JSON.parse(await readFile(ROOT, 'utf8'))
const page = raw.pages[0]
page.children = (page.children ?? []).filter((node) => node.id !== 'mood-jar-frame')
page.children.push(buildMoodFrame())
const doc = normalizeDoc(raw)
const scene = buildScene(doc, { pageId: page.id })
layoutScene(scene)
if (scene.issues.length) {
  console.error(scene.issues)
  process.exit(1)
}
await writeFile(ROOT, `${JSON.stringify(doc, null, 2)}\n`)
const mood = doc.pages[0].children.find((node) => node.id === 'mood-jar-frame')
const total = (() => {
  const walk = (node) => 1 + (node.children ?? []).reduce((sum, child) => sum + walk(child), 0)
  return walk(mood)
})()
console.log(JSON.stringify({ ok: true, root: mood.id, name: mood.name, width: mood.width, height: mood.height, nodes: total, issues: scene.issues.length }, null, 2))
