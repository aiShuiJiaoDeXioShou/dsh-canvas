import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { TEMPLATE_LIST } from '../src/shared/templates.js'
import { variantChipLabel } from '../src/client/ui/variant-label.js'
import {
  STYLE_DRAG_MIME,
  clearActiveCanvasDrag,
  getActiveCanvasDrag,
  getComponentPreview,
  getTemplatePreview,
  setActiveCanvasDrag,
} from '../src/client/ui/template-preview.js'

const root = new URL('../', import.meta.url)

test('layer rows keep their icons and name size on hover and selection', async () => {
  const css = await readFile(new URL('src/client/styles.css', root), 'utf8')
  assert.doesNotMatch(css, /^"\./m, 'a stray quote would invalidate the following rule')
  assert.match(css, /\.dshc-root svg \{\s*flex: 0 0 auto;/, 'icons must not shrink inside flex rows')
  const actions = css.slice(css.indexOf('.dshc-layer-actions'))
  assert.match(actions, /position: absolute/, 'row actions overlay instead of taking layout space')
  assert.doesNotMatch(actions.split('}')[0], /display: none/, 'actions must not be removed from layout on hover')
})

test('icon buttons expose hover labels through data-tip', async () => {
  const common = await readFile(new URL('src/client/ui/common.tsx', root), 'utf8')
  const start = common.indexOf('export function IconButton')
  const block = common.slice(start, common.indexOf('export function ContextMenu', start))
  assert.match(block, /'data-tip': title/)
  assert.doesNotMatch(block, /^ {6}title,/m, 'the native title tooltip would duplicate the custom label')
  const css = await readFile(new URL('src/client/styles.css', root), 'utf8')
  assert.match(css, /\.dshc-tooltip \{/)
})

test('variant chip labels follow set.properties order and strip set prefix on fallback', () => {
  const singlePropSet = {
    name: 'StampCam/Camera Top Bar',
    properties: [{ name: 'Style', values: ['Solid', 'Translucent', 'MoreOpen'] }],
  }
  assert.equal(
    variantChipLabel(singlePropSet, {
      name: 'StampCam/Camera Top Bar/Translucent',
      variantProps: { Style: 'Translucent' },
    }),
    'Translucent',
  )

  const multiPropSet = {
    name: 'StampCam/Button',
    properties: [
      { name: 'Tone', values: ['Light', 'Dark'] },
      { name: 'Size', values: ['SM', 'MD'] },
    ],
  }
  assert.equal(
    variantChipLabel(multiPropSet, {
      name: 'StampCam/Button/Dark/MD',
      variantProps: { Size: 'MD', Tone: 'Dark' },
    }),
    'Dark / MD',
  )

  // When variantProps is empty, strip `${set.name}/` prefix cleanly
  assert.equal(
    variantChipLabel(singlePropSet, {
      name: 'StampCam/Camera Top Bar/MoreOpen',
      variantProps: {},
    }),
    'MoreOpen',
  )
})

test('variant set, template list, and style dot classes are styled in styles.css', async () => {
  const css = await readFile(new URL('src/client/styles.css', root), 'utf8')
  for (const selector of [
    '.dshc-set-card',
    '.dshc-set-name',
    '.dshc-set-variants',
    '.dshc-variant-chip',
    '.dshc-component-card',
    '.dshc-component-thumb',
    '.dshc-component-bar',
    '.dshc-template-list',
    '.dshc-template-grid',
    '.dshc-template-card',
    '.dshc-template-thumb',
    '.dshc-template-foot',
    '.dshc-template-row',
    '.dshc-template-info',
    '.dshc-template-name',
    '.dshc-template-meta',
    '.dshc-style-dot',
    '.dshc-style-fill',
    '.dshc-style-text',
    '.dshc-style-effect',
  ]) {
    assert.ok(css.includes(selector), `expected ${selector} in styles.css`)
  }
})

test('template previews render cached miniature SVGs for every built-in template', () => {
  for (const template of TEMPLATE_LIST) {
    const first = getTemplatePreview(template.id, 'iphone16')
    const second = getTemplatePreview(template.id, 'iphone16')
    assert.equal(first, second, 'preview should be cached by (templateId, deviceId)')
    assert.ok(first.width > 0 && first.height > 0)
    assert.match(first.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+"/)
    assert.ok(first.dataUri.startsWith('data:image/svg+xml;charset=utf-8,'))
  }
})

test('component previews render cached miniature SVGs for document components', () => {
  const component = {
    id: 'comp-bar',
    name: 'StampCam/Camera Top Bar/Light',
    root: {
      id: 'root-bar',
      type: 'frame',
      name: 'Top Bar',
      x: 0,
      y: 0,
      width: 393,
      height: 44,
      fills: [{ type: 'solid', color: '#FFFFFF' }],
      children: [{ id: 't1', type: 'text', name: 'Title', x: 16, y: 12, width: 100, height: 20, text: 'StampCam' }],
    },
  }
  const doc = { format: 'dsh.canvas', version: 1, id: 'd1', title: 'T', pages: [], components: [component], styles: [] }
  const p1 = getComponentPreview(doc, component)
  const p2 = getComponentPreview(doc, component)
  assert.equal(p1, p2)
  assert.equal(p1.width, 393)
  assert.equal(p1.height, 44)
  assert.match(p1.svg, /StampCam/)
  assert.ok(p1.dataUri.startsWith('data:image/svg+xml;charset=utf-8,'))
})

test('style drag MIME and active canvas drag bridge support kind: style', () => {
  assert.equal(STYLE_DRAG_MIME, 'application/x-dshc-style')
  clearActiveCanvasDrag()
  assert.equal(getActiveCanvasDrag(), null)

  setActiveCanvasDrag({
    kind: 'style',
    id: 'style-brand',
    name: 'Brand/Primary',
    styleType: 'fill',
  })
  assert.deepEqual(getActiveCanvasDrag(), {
    kind: 'style',
    id: 'style-brand',
    name: 'Brand/Primary',
    styleType: 'fill',
    width: 0,
    height: 0,
  })

  clearActiveCanvasDrag()
  assert.equal(getActiveCanvasDrag(), null)
})

test('interactive refactor CSS classes are styled in styles.css', async () => {
  const css = await readFile(new URL('src/client/styles.css', root), 'utf8')
  for (const selector of [
    '.dshc-input',
    '.dshc-figma-btn',
    '.dshc-frame-label-input',
    '.dshc-canvas-drop-overlay',
    '.dshc-layer-row.is-hidden',
    '.dshc-layer-row.is-locked',
    '.dshc-layer-status',
    '.dshc-layer-row.is-drop-before',
    '.dshc-layer-row.is-drop-after',
    '.dshc-layer-row.is-drop-inside',
    '.dshc-style-row',
    '.dshc-style-swatch',
    '.dshc-style-meta',
    '.dshc-set-body',
    '.dshc-set-header',
    '.dshc-variant-chip.is-active',
    '.dshc-collapse-toggle',
    '.dshc-search-input',
    '.dshc-style-bound-bar',
  ]) {
    assert.ok(css.includes(selector), `expected ${selector} in styles.css`)
  }
})

test('variant chips switch active preview instead of inserting immediately on click', async () => {
  const panels = await readFile(new URL('src/client/ui/panels.tsx', root), 'utf8')
  const start = panels.indexOf('function VariantSetCard')
  const end = panels.indexOf('export function ComponentsPanel', start)
  assert.ok(start !== -1 && end > start, 'VariantSetCard should be defined')
  const block = panels.slice(start, end)
  const chipStart = block.indexOf('dshc-variant-chip')
  const chipBlock = block.slice(chipStart)
  assert.match(chipBlock, /onClick=[\s\S]*setActiveId\(component\.id\)/)
  assert.doesNotMatch(chipBlock, /insertInstance/)
})

test('toolbar merges fit canvas and fit selection into one contextual button', async () => {
  const toolbar = await readFile(new URL('src/client/ui/Toolbar.tsx', root), 'utf8')
  assert.doesNotMatch(toolbar, /icon: 'reset'/, 'fit selection should no longer use a separate reset button')
  assert.match(toolbar, /selectionCount \? '适应选区 \(2\)' : '适应画布 \(1\)'/)
})

test('toolbar separates Import and Export buttons with direct Copy-to-Figma guidance', async () => {
  const toolbar = await readFile(new URL('src/client/ui/Toolbar.tsx', root), 'utf8')
  assert.doesNotMatch(toolbar, /导入 SVG path/, 'unlabeled path icon should be consolidated into the Import modal')
  assert.match(toolbar, /'导入'/)
  assert.match(toolbar, /'导出'/)
  assert.match(toolbar, /复制到 Figma（免插件 · 直接 ⌘V 粘贴）/)
  const css = await readFile(new URL('src/client/styles.css', root), 'utf8')
  assert.ok(css.includes('.dshc-io-card'))
  assert.ok(css.includes('.dshc-io-card-primary'))
})

test('canvas scene surface resets host corner-shape to round so circles are never squircles', async () => {
  const css = await readFile(new URL('src/client/styles.css', root), 'utf8')
  assert.match(
    css,
    /\.dshc-scene-surface,\s*\.dshc-scene-surface \* \{\s*corner-shape: round !important;\s*\}/,
    'scene surface and descendants must override host squircle corner-shape',
  )
})
