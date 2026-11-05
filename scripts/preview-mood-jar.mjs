import { readFile, writeFile } from 'node:fs/promises'
import { normalizeDoc } from '../lib/format.js'
import { buildScene } from '../src/client/editor/resolve.js'
import { layoutScene } from '../src/client/editor/layout.js'
import { buildSvg } from '../src/client/editor/export-svg.js'

const raw = JSON.parse(await readFile(new URL('../../canvas/main.canvas.json', import.meta.url), 'utf8'))
const doc = normalizeDoc(raw)
const frame = doc.pages[0].children.find((node) => node.id === 'mood-jar-frame')
frame.x = 0
frame.y = 0
const usePreviewFont = (node) => {
  if (node.type === 'text' && node.font) node.font.family = 'PingFang SC'
  for (const child of node.children ?? []) usePreviewFont(child)
}
usePreviewFont(frame)
const scene = buildScene(doc, { pageId: doc.pages[0].id })
layoutScene(scene)
const svg = await buildSvg(scene, { nodeKeys: ['mood-jar-frame'] })
await writeFile(new URL('../docs/mood-jar-preview.svg', import.meta.url), svg)
console.log('wrote', svg.length, 'bytes')
