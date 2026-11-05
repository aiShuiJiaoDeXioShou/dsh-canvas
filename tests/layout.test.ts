// @ts-nocheck
/**
 * Layout / resolve-engine tests. They inject a deterministic fake measurer so
 * expectations are exact and DOM-free:
 *
 *   every character is 1em wide, lines wrap by character at maxWidth,
 *   line height = font.size * font.lineHeight.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { normalizeDoc } from '../src/shared/format.js'

import { buildScene } from '../src/client/editor/resolve.js'
import { layoutScene } from '../src/client/editor/layout.js'
import { createTextMeasurer } from '../src/client/editor/text-measure.js'

/** @param {{text?: string, font: {size: number, lineHeight: number}, maxWidth: number}} request */
function fakeMeasure(request) {
  const size = request.font.size
  const lineHeight = size * request.font.lineHeight
  const maxWidth = request.maxWidth
  const wrap = Number.isFinite(maxWidth) && maxWidth > 0
  const perLine = wrap ? Math.max(1, Math.floor((maxWidth + 1e-9) / size)) : Infinity
  /** @type {string[]} */
  const lines = []
  for (const paragraph of String(request.text ?? '').split('\n')) {
    if (paragraph.length === 0) {
      lines.push('')
    } else if (!wrap) {
      lines.push(paragraph)
    } else {
      for (let index = 0; index < paragraph.length; index += perLine) {
        lines.push(paragraph.slice(index, index + perLine))
      }
    }
  }
  const lineObjects = lines.map((line) => ({ text: line, width: line.length * size }))
  let width = 0
  for (const line of lineObjects) width = Math.max(width, line.width)
  return { lines: lineObjects, width, height: lines.length * lineHeight }
}

/**
 * Normalize + build + lay out in one step.
 * @param {any} rawDoc
 * @param {any} [options]
 */
function layoutDoc(rawDoc, options = {}) {
  const doc = normalizeDoc(rawDoc)
  const scene = buildScene(doc, { measureText: fakeMeasure, ...options })
  layoutScene(scene)
  return scene
}

/** @param {any} scene @param {string} key */
function node(scene, key) {
  const found = scene.byKey.get(key)
  assert.ok(found, `expected scene node "${key}"`)
  return found
}

// ───────────────────────────── auto layout: vertical ─────────────────────────────

/** @param {any} [overrides] */
function verticalDoc(overrides = {}) {
  return {
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'frame',
            type: 'frame',
            width: 200,
            height: 300,
            layout: {
              direction: 'vertical',
              gap: 10,
              padding: { top: 20, right: 20, bottom: 20, left: 20 },
              alignPrimary: 'start',
              alignCounter: 'stretch',
              ...overrides,
            },
            children: [
              { id: 'a', type: 'rect', width: 50, height: 40 },
              { id: 'b', type: 'rect', width: 50, height: 30 },
            ],
          },
        ],
      },
    ],
  }
}

test('vertical auto-layout applies padding, gap and stretch alignment', () => {
  const scene = layoutDoc(verticalDoc())
  assert.deepEqual(scene.issues, [])
  const frame = node(scene, 'frame')
  const a = node(scene, 'a')
  const b = node(scene, 'b')
  assert.equal(frame.absX, 0)
  assert.equal(frame.absY, 0)
  // alignCounter stretch → inner width 200 - 40 = 160.
  assert.equal(a.width, 160)
  assert.equal(b.width, 160)
  assert.equal(a.x, 20)
  assert.equal(b.x, 20)
  assert.equal(a.y, 20)
  assert.equal(b.y, 70) // 20 + 40 + gap 10
  assert.equal(a.absX, 20)
  assert.equal(a.absY, 20)
  assert.equal(b.absY, 70)
})

test('vertical auto-layout centers/ends/space-betweens the primary axis', () => {
  const center = layoutDoc(verticalDoc({ alignPrimary: 'center', alignCounter: 'center' }))
  assert.equal(node(center, 'a').width, 50) // no stretch
  assert.equal(node(center, 'a').x, 75) // 20 + (160 - 50) / 2
  assert.equal(node(center, 'a').y, 110) // 20 + (260 - 80) / 2
  assert.equal(node(center, 'b').y, 160)

  const end = layoutDoc(verticalDoc({ alignPrimary: 'end' }))
  assert.equal(node(end, 'a').y, 200) // 20 + 180
  assert.equal(node(end, 'b').y, 250)

  const spaced = layoutDoc(verticalDoc({ alignPrimary: 'space-between' }))
  assert.equal(node(spaced, 'a').y, 20)
  assert.equal(node(spaced, 'b').y, 250) // gap becomes 10 + 180
})

// ───────────────────────────── auto layout: horizontal ─────────────────────────────

test('horizontal auto-layout gives fill children the remaining width', () => {
  const scene = layoutDoc({
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'row',
            type: 'frame',
            width: 300,
            height: 100,
            layout: {
              direction: 'horizontal',
              gap: 10,
              padding: { top: 0, right: 20, bottom: 0, left: 20 },
              alignPrimary: 'start',
              alignCounter: 'center',
            },
            children: [
              { id: 'fixed', type: 'rect', width: 60, height: 20 },
              { id: 'fill-a', type: 'rect', width: 10, height: 20, layoutSizing: { h: 'fill', v: 'fixed' } },
              { id: 'fill-b', type: 'rect', width: 10, height: 20, layoutSizing: { h: 'fill', v: 'fixed' } },
            ],
          },
        ],
      },
    ],
  })
  assert.deepEqual(scene.issues, [])
  const fixed = node(scene, 'fixed')
  const fillA = node(scene, 'fill-a')
  const fillB = node(scene, 'fill-b')
  // inner = 260, gaps = 20, fixed = 60 → 180 left for two fill children.
  assert.equal(fillA.width, 90)
  assert.equal(fillB.width, 90)
  assert.equal(fixed.x, 20)
  assert.equal(fillA.x, 90) // 20 + 60 + 10
  assert.equal(fillB.x, 190) // 90 + 90 + 10
  assert.equal(fixed.y, 40) // centered on the counter axis: (100 - 20) / 2
  assert.equal(fillA.absX, 90)
})

// ───────────────────────────── hug sizes ─────────────────────────────

test('hug auto-layout frame sizes itself from its children', () => {
  const scene = layoutDoc({
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'hug',
            type: 'frame',
            layoutSizing: { h: 'hug', v: 'hug' },
            layout: {
              direction: 'vertical',
              gap: 8,
              padding: { top: 12, right: 12, bottom: 12, left: 12 },
              alignPrimary: 'start',
              alignCounter: 'start',
            },
            children: [
              { id: 'c1', type: 'rect', width: 40, height: 20 },
              { id: 'c2', type: 'rect', width: 60, height: 30 },
            ],
          },
        ],
      },
    ],
  })
  const hug = node(scene, 'hug')
  assert.equal(hug.width, 84) // 60 + 24
  assert.equal(hug.height, 82) // 20 + 8 + 30 + 24
  assert.equal(node(scene, 'c1').x, 12)
  assert.equal(node(scene, 'c1').y, 12)
  assert.equal(node(scene, 'c2').y, 40) // 12 + 20 + 8
})

test('nested hug auto-layout propagates sizes to the parent', () => {
  const scene = layoutDoc({
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'outer',
            type: 'frame',
            layoutSizing: { h: 'hug', v: 'hug' },
            layout: {
              direction: 'vertical',
              gap: 5,
              padding: { top: 10, right: 10, bottom: 10, left: 10 },
              alignPrimary: 'start',
              alignCounter: 'start',
            },
            children: [
              {
                id: 'inner',
                type: 'frame',
                layoutSizing: { h: 'hug', v: 'hug' },
                layout: {
                  direction: 'horizontal',
                  gap: 4,
                  padding: { top: 2, right: 2, bottom: 2, left: 2 },
                  alignPrimary: 'start',
                  alignCounter: 'start',
                },
                children: [
                  { id: 'i1', type: 'rect', width: 30, height: 10 },
                  { id: 'i2', type: 'rect', width: 40, height: 14 },
                ],
              },
              { id: 'txt', type: 'text', width: 20, height: 20, text: 'hi', font: { size: 10, lineHeight: 2 }, autoHeight: true },
            ],
          },
        ],
      },
    ],
  })
  assert.deepEqual(scene.issues, [])
  const outer = node(scene, 'outer')
  const inner = node(scene, 'inner')
  // inner: 2 + 30 + 4 + 40 + 2 = 78 wide, 2 + 14 + 2 = 18 tall.
  assert.equal(inner.width, 78)
  assert.equal(inner.height, 18)
  // outer: max(78, 20) + 20 = 98 wide, 18 + 5 + 20 + 20 = 63 tall.
  assert.equal(outer.width, 98)
  assert.equal(outer.height, 63)
  assert.equal(node(scene, 'i1').x, 2)
  assert.equal(node(scene, 'i2').x, 36)
  assert.equal(node(scene, 'txt').y, 33) // 10 + 18 + 5
  assert.equal(node(scene, 'txt').absY, 33)
  assert.equal(node(scene, 'i2').absX, 46) // inner frame sits at x = 10
})

test('free-form frames keep document child positions and absolute coordinates', () => {
  const scene = layoutDoc({
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'art',
            type: 'frame',
            x: 100,
            y: 50,
            width: 300,
            height: 200,
            children: [{ id: 'inside', type: 'rect', x: 5, y: 6, width: 10, height: 10 }],
          },
        ],
      },
    ],
  })
  assert.equal(node(scene, 'art').absX, 100)
  assert.equal(node(scene, 'art').absY, 50)
  assert.equal(node(scene, 'inside').x, 5)
  assert.equal(node(scene, 'inside').absX, 105)
  assert.equal(node(scene, 'inside').absY, 56)
})

// ───────────────────────────── text ─────────────────────────────

test('text auto height and wrapping', () => {
  const scene = layoutDoc({
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'title',
            type: 'text',
            x: 5,
            y: 6,
            width: 100,
            height: 10,
            text: 'abcdefghijklmno',
            font: { size: 10, lineHeight: 1.5 },
            autoHeight: true,
          },
        ],
      },
    ],
  })
  const title = node(scene, 'title')
  assert.equal(title.lines.length, 2)
  assert.equal(title.lines[0].text, 'abcdefghij')
  assert.equal(title.lines[1].text, 'klmno')
  assert.equal(title.height, 30) // 2 lines × 10px × 1.5
  assert.equal(title.width, 100)
  assert.equal(title.absX, 5)
  assert.equal(title.absY, 6)
})

test('fill-width text re-wraps and pushes following siblings', () => {
  const scene = layoutDoc({
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'col',
            type: 'frame',
            width: 100,
            height: 200,
            layout: {
              direction: 'vertical',
              gap: 0,
              padding: { top: 0, right: 0, bottom: 0, left: 0 },
              alignPrimary: 'start',
              alignCounter: 'start',
            },
            children: [
              {
                id: 'label',
                type: 'text',
                width: 20,
                height: 10,
                text: 'abcdefghijklmno',
                font: { size: 10, lineHeight: 1.5 },
                autoHeight: true,
                layoutSizing: { h: 'fill', v: 'hug' },
              },
              { id: 'below', type: 'rect', width: 10, height: 10 },
            ],
          },
        ],
      },
    ],
  })
  const label = node(scene, 'label')
  assert.equal(label.width, 100) // filled the vertical frame's inner width
  assert.equal(label.lines.length, 2) // wrapped at 100px, not at the declared 20px
  assert.equal(label.height, 30)
  assert.equal(node(scene, 'below').y, 30)
})

// ───────────────────────────── instances ─────────────────────────────

/** @param {any} [overrides] */
function cardDoc(overrides = {}) {
  return {
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'inst',
            type: 'instance',
            x: 30,
            y: 40,
            width: 200,
            height: 100,
            componentId: 'cmp-card',
            variantProps: {},
            overrides,
          },
        ],
      },
    ],
    components: [
      {
        id: 'cmp-card',
        name: 'Card',
        variantProps: {},
        root: {
          id: 'card-root',
          type: 'frame',
          width: 200,
          height: 100,
          layout: {
            direction: 'vertical',
            gap: 6,
            padding: { top: 10, right: 10, bottom: 10, left: 10 },
            alignPrimary: 'start',
            alignCounter: 'start',
          },
          children: [
            {
              id: 't1',
              type: 'text',
              width: 180,
              height: 20,
              text: 'Default',
              font: { size: 10, lineHeight: 1.5 },
              autoHeight: true,
            },
            { id: 'bg', type: 'rect', width: 50, height: 20 },
            { id: 'hidden', type: 'rect', width: 50, height: 20 },
          ],
        },
      },
    ],
  }
}

test('instances expand the component tree with overrides applied', () => {
  const scene = layoutDoc(
    cardDoc({
      t1: { text: 'Hello' },
      bg: { fills: [{ type: 'solid', color: '#00FF00' }] },
      hidden: { visible: false },
    }),
  )
  assert.deepEqual(scene.issues, [])
  const root = node(scene, 'inst')
  assert.equal(root.type, 'instance')
  assert.equal(root.isInstanceRoot, true)
  assert.equal(root.instanceId, 'inst')
  assert.equal(root.componentId, 'cmp-card')
  assert.equal(root.editable, true)
  assert.equal(root.width, 200)
  assert.equal(root.height, 100)
  assert.equal(root.absX, 30)
  assert.equal(root.absY, 40)
  assert.deepEqual(
    root.children.map((child) => child.key),
    ['inst::t1', 'inst::bg', 'inst::hidden'],
  )

  const title = node(scene, 'inst::t1')
  assert.equal(title.id, 't1')
  assert.equal(title.sourceId, 't1')
  assert.equal(title.instanceId, 'inst')
  assert.equal(title.editable, false)
  assert.equal(title.text, 'Hello')
  assert.equal(scene.bySourceId.get('t1')[0], title)

  const bg = node(scene, 'inst::bg')
  assert.equal(bg.fills[0].color, '#00FF00')
  assert.equal(node(scene, 'inst::hidden').visible, false)

  // Component root layout applies inside the instance geometry.
  assert.equal(title.absX, 40) // 30 + padding 10
  assert.equal(title.absY, 50) // 40 + padding 10
  assert.equal(title.height, 15) // 'Hello' = 1 line × 10 × 1.5
  assert.equal(bg.absY, 71) // 40 + 10 + 15 + gap 6
  assert.equal(node(scene, 'inst::hidden').absY, 97) // 71 + 20 + 6
})

test('instances fall back to their component when overrides are empty', () => {
  const scene = layoutDoc(cardDoc())
  assert.equal(node(scene, 'inst::t1').text, 'Default')
  assert.equal(node(scene, 'inst::t1').editable, false)
})

test('variant properties select the matching component', () => {
  const doc = {
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'inst',
            type: 'instance',
            width: 120,
            height: 40,
            componentId: 'cmp-default',
            variantProps: { State: 'Hover' },
          },
          {
            id: 'plain',
            type: 'instance',
            width: 120,
            height: 40,
            componentId: 'cmp-default',
            variantProps: {},
          },
        ],
      },
    ],
    components: [
      {
        id: 'cmp-default',
        name: 'Button/Default',
        variantSetId: 'vs-state',
        variantProps: { State: 'Default' },
        root: {
          id: 'root-default',
          type: 'frame',
          width: 120,
          height: 40,
          children: [{ id: 'label-default', type: 'text', width: 100, height: 20, text: 'Default', font: { size: 10 } }],
        },
      },
      {
        id: 'cmp-hover',
        name: 'Button/Hover',
        variantSetId: 'vs-state',
        variantProps: { State: 'Hover' },
        root: {
          id: 'root-hover',
          type: 'frame',
          width: 120,
          height: 40,
          children: [{ id: 'label-hover', type: 'text', width: 100, height: 20, text: 'Hover!', font: { size: 10 } }],
        },
      },
    ],
    variantSets: [
      {
        id: 'vs-state',
        name: 'State',
        properties: [{ name: 'State', values: ['Default', 'Hover'] }],
        componentIds: ['cmp-default', 'cmp-hover'],
      },
    ],
  }
  const scene = layoutDoc(doc)
  assert.deepEqual(scene.issues, [])
  const hovered = node(scene, 'inst')
  assert.equal(hovered.componentId, 'cmp-hover')
  assert.deepEqual(hovered.variantProps, { State: 'Hover' })
  assert.equal(hovered.children[0].key, 'inst::label-hover')
  assert.equal(node(scene, 'inst::label-hover').text, 'Hover!')
  // No variant props → base component.
  assert.equal(node(scene, 'plain').componentId, 'cmp-default')
  assert.equal(node(scene, 'plain::label-default').text, 'Default')
})

test('component cycles are reported and degrade to empty instances', () => {
  const doc = {
    pages: [
      {
        id: 'p1',
        children: [{ id: 'inst-a', type: 'instance', componentId: 'cmp-a', width: 100, height: 100 }],
      },
    ],
    components: [
      {
        id: 'cmp-a',
        name: 'A',
        variantProps: {},
        root: {
          id: 'a-root',
          type: 'frame',
          width: 100,
          height: 100,
          children: [{ id: 'i-ab', type: 'instance', componentId: 'cmp-b', width: 100, height: 40 }],
        },
      },
      {
        id: 'cmp-b',
        name: 'B',
        variantProps: {},
        root: {
          id: 'b-root',
          type: 'frame',
          width: 100,
          height: 40,
          children: [{ id: 'i-ba', type: 'instance', componentId: 'cmp-a', width: 100, height: 20 }],
        },
      },
    ],
  }
  const normalized = normalizeDoc(doc)
  const scene = buildScene(normalized, { measureText: fakeMeasure })
  assert.doesNotThrow(() => layoutScene(scene))
  assert.ok(scene.issues.some((issue) => /component cycle/.test(issue)), scene.issues.join('\n'))
  assert.ok(node(scene, 'inst-a'))
  assert.ok(node(scene, 'inst-a::i-ab'))
  // Nested instance keys keep the full expansion path.
  const cyclic = node(scene, 'inst-a::i-ab::i-ba')
  assert.equal(cyclic.type, 'instance')
  assert.deepEqual(cyclic.children, [])
})

test('component mode resolves the component root as an editable tree', () => {
  const doc = {
    pages: [{ id: 'p1', children: [] }],
    components: [
      {
        id: 'cmp-card',
        name: 'Card',
        variantProps: {},
        root: {
          id: 'card-root',
          type: 'frame',
          width: 200,
          height: 100,
          layout: {
            direction: 'vertical',
            gap: 6,
            padding: { top: 10, right: 10, bottom: 10, left: 10 },
            alignPrimary: 'start',
            alignCounter: 'start',
          },
          children: [{ id: 'card-title', type: 'text', width: 180, height: 20, text: 'Hi', font: { size: 10 } }],
        },
      },
    ],
  }
  const scene = buildScene(normalizeDoc(doc), {
    mode: 'component',
    componentId: 'cmp-card',
    measureText: fakeMeasure,
  })
  layoutScene(scene)
  assert.equal(scene.mode, 'component')
  assert.equal(scene.componentId, 'cmp-card')
  assert.equal(scene.pageId, null)
  const root = node(scene, 'card-root')
  assert.equal(root.type, 'frame')
  assert.equal(root.editable, true)
  assert.equal(root.absX, 0)
  assert.equal(root.absY, 0)
  const title = node(scene, 'card-title')
  assert.equal(title.editable, true)
  assert.equal(title.absX, 10)
  assert.equal(title.absY, 10)
  assert.equal(title.height, 14) // 10px × default lineHeight 1.4
  assert.equal(scene.bySourceId.get('card-title')[0], title)
})

// ───────────────────────────── styles ─────────────────────────────

test('style references override literal fills/fonts/effects', () => {
  const scene = layoutDoc({
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'styled-rect',
            type: 'rect',
            width: 100,
            height: 50,
            fills: [{ type: 'solid', color: '#00FF00' }],
            fillStyleId: 's-fill',
          },
          {
            id: 'styled-text',
            type: 'text',
            width: 200,
            height: 20,
            text: 'Hi',
            font: { size: 10, family: 'Arial' },
            fills: [{ type: 'solid', color: '#00FF00' }],
            textStyleId: 's-text',
          },
          { id: 'styled-effects', type: 'ellipse', width: 40, height: 40, effectStyleId: 's-effect' },
        ],
      },
    ],
    styles: [
      { id: 's-fill', type: 'fill', name: 'Brand', value: { type: 'solid', color: '#2563EB' } },
      {
        id: 's-text',
        type: 'text',
        name: 'Heading',
        value: { font: { size: 20, weight: 700 }, fills: [{ type: 'solid', color: '#FF0000' }] },
      },
      {
        id: 's-effect',
        type: 'effect',
        name: 'Shadow',
        value: [{ type: 'drop-shadow', x: 0, y: 2, blur: 4, color: '#00000033' }],
      },
    ],
  })
  assert.deepEqual(scene.issues, [])
  assert.equal(node(scene, 'styled-rect').fills[0].color, '#2563EB')
  assert.equal(node(scene, 'styled-rect').fill, node(scene, 'styled-rect').fills)
  const text = node(scene, 'styled-text')
  assert.equal(text.font.size, 20)
  assert.equal(text.font.weight, 700)
  assert.equal(text.fills[0].color, '#FF0000')
  const effects = node(scene, 'styled-effects').effects
  assert.equal(effects.length, 1)
  assert.equal(effects[0].type, 'drop-shadow')
  assert.equal(effects[0].blur, 4)
})

test('missing style references keep literals and record an issue', () => {
  // Raw (not normalized) document: normalizeDoc would reject the dangling ref.
  const scene = buildScene(
    {
      title: 'Raw',
      pages: [
        {
          id: 'p1',
          children: [
            {
              id: 'r',
              type: 'rect',
              width: 10,
              height: 10,
              fills: [{ type: 'solid', color: '#123456' }],
              fillStyleId: 'missing',
            },
          ],
        },
      ],
    },
    { measureText: fakeMeasure },
  )
  layoutScene(scene)
  const rect = node(scene, 'r')
  assert.equal(rect.fills[0].color, '#123456')
  assert.ok(scene.issues.some((issue) => /unknown fill style/.test(issue)), scene.issues.join('\n'))
})

// ───────────────────────────── text measurer / rebuild ─────────────────────────────

test('createTextMeasurer works without a DOM (deterministic fallback)', () => {
  const measure = createTextMeasurer()
  assert.equal(typeof measure.clearCache, 'function')
  const ascii = measure({ text: 'abcd', font: { size: 10, lineHeight: 2 }, maxWidth: Infinity })
  assert.equal(ascii.width, 22) // 4 × 0.55em
  assert.equal(ascii.height, 20)
  const cjk = measure({ text: '你好', font: { size: 20, lineHeight: 1 }, maxWidth: Infinity })
  assert.equal(cjk.width, 40)
  const wrapped = measure({ text: 'abcdefgh', font: { size: 10, lineHeight: 1 }, maxWidth: 20 })
  assert.deepEqual(
    wrapped.lines.map((line) => line.text),
    ['abc', 'def', 'gh'],
  )
  assert.equal(wrapped.lines[0].width, 16.5)
})

test('scene.rebuild re-measures text after metrics change', () => {
  const doc = normalizeDoc({
    pages: [
      {
        id: 'p1',
        children: [
          {
            id: 'title',
            type: 'text',
            width: 100,
            height: 10,
            text: 'abcdefghijklmno',
            font: { size: 10, lineHeight: 1.5 },
            autoHeight: true,
          },
        ],
      },
    ],
  })
  let charWidth = 10
  /** @type {(request: any) => any} */
  const measure = ({ text, font, maxWidth }) => {
    const perLine = Number.isFinite(maxWidth) && maxWidth > 0 ? Math.max(1, Math.floor(maxWidth / charWidth)) : 1e9
    /** @type {string[]} */
    const lines = []
    for (let index = 0; index < String(text).length; index += perLine) {
      lines.push(String(text).slice(index, index + perLine))
    }
    const objects = lines.map((line) => ({ text: line, width: line.length * charWidth }))
    let width = 0
    for (const line of objects) width = Math.max(width, line.width)
    return { lines: objects, width, height: lines.length * font.size * font.lineHeight }
  }
  const scene = buildScene(doc, { measureText: measure })
  layoutScene(scene)
  assert.equal(node(scene, 'title').height, 30) // 15 chars at 10px/char → 2 lines
  // Pretend a webfont loaded and characters became narrower.
  charWidth = 5
  scene.rebuild()
  assert.equal(node(scene, 'title').lines.length, 1)
  assert.equal(node(scene, 'title').height, 15)
  assert.equal(scene.rebuild(), scene)
})
