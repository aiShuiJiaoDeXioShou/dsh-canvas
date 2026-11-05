// @ts-nocheck
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { auditDoc } from '../src/shared/audit.js'
import { normalizeDoc } from '../src/shared/format.js'

const ALL_CHECKS = [
  'screenshot-boundary',
  'contrast',
  'touch-target',
  'clipped-child',
  'zero-size',
  'missing-refs',
  'unresolved-comments',
  'empty-frame',
]

const BASE_SKIPPED = ['runtime interaction', 'state coverage']

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function singlePage(children, extra = {}) {
  return normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    title: 'Audit test',
    pages: [
      {
        id: 'page-1',
        name: 'Page 1',
        background: extra.pageBackground ?? null,
        children,
      },
    ],
    components: extra.components ?? [],
    styles: extra.styles ?? [],
    comments: extra.comments ?? [],
  })
}

function frame(id, children = [], options = {}) {
  return {
    id,
    type: 'frame',
    name: options.name ?? id,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 390,
    height: options.height ?? 844,
    rotation: 0,
    opacity: options.opacity ?? 1,
    visible: options.visible ?? true,
    locked: false,
    clip: options.clip !== false,
    cornerRadius: options.cornerRadius ?? 0,
    fills: options.fills !== undefined ? options.fills : [{ type: 'solid', color: '#FFFFFF' }],
    strokes: [],
    effects: options.effects ?? [],
    ...(options.fillStyleId != null ? { fillStyleId: options.fillStyleId } : {}),
    children,
  }
}

function group(id, children = [], options = {}) {
  return {
    id,
    type: 'group',
    name: options.name ?? id,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 100,
    height: options.height ?? 100,
    rotation: 0,
    opacity: options.opacity ?? 1,
    visible: options.visible ?? true,
    locked: false,
    children,
  }
}

function text(id, options = {}) {
  return {
    id,
    type: 'text',
    name: options.name ?? id,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 200,
    height: options.height ?? 24,
    rotation: 0,
    opacity: options.opacity ?? 1,
    visible: options.visible ?? true,
    locked: false,
    text: options.text ?? 'Text',
    font: {
      family: 'system-ui',
      weight: options.weight ?? 400,
      style: 'normal',
      size: options.size ?? 14,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    align: 'left',
    verticalAlign: 'top',
    fills: options.fills !== undefined ? options.fills : [{ type: 'solid', color: '#111111' }],
    effects: options.effects ?? [],
    autoHeight: false,
  }
}

function rect(id, options = {}) {
  return {
    id,
    type: 'rect',
    name: options.name ?? id,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 120,
    height: options.height ?? 120,
    rotation: options.rotation ?? 0,
    opacity: options.opacity ?? 1,
    visible: options.visible ?? true,
    locked: false,
    cornerRadius: options.cornerRadius ?? 0,
    fills: options.fills !== undefined ? options.fills : [{ type: 'solid', color: '#D9D9D9' }],
    strokes: [],
    effects: options.effects ?? [],
  }
}

function instance(id, componentId, options = {}) {
  return {
    id,
    type: 'instance',
    name: options.name ?? id,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 100,
    height: options.height ?? 48,
    rotation: 0,
    opacity: options.opacity ?? 1,
    visible: options.visible ?? true,
    locked: false,
    componentId,
    variantProps: options.variantProps ?? {},
    overrides: options.overrides ?? {},
  }
}

function line(id, options = {}) {
  return {
    id,
    type: 'line',
    name: options.name ?? id,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 100,
    height: 0,
    rotation: 0,
    opacity: 1,
    visible: options.visible ?? true,
    locked: false,
    strokes: [{ color: '#111111', width: 1, align: 'center' }],
  }
}

function component(id, name, root) {
  return { id, name, root }
}

function byCode(result, code) {
  return result.findings.filter((finding) => finding.code === code)
}

function codes(result) {
  return result.findings.map((finding) => finding.code).sort()
}

function cleanDoc() {
  return singlePage([
    frame(
      'screen',
      [
        text('headline', {
          name: 'Headline',
          x: 24,
          y: 48,
          width: 280,
          height: 32,
          text: 'Welcome',
          size: 24,
          weight: 700,
          fills: [{ type: 'solid', color: '#111111' }],
        }),
        rect('cta', {
          name: 'Primary button',
          x: 24,
          y: 120,
          width: 200,
          height: 48,
          fills: [{ type: 'solid', color: '#2563EB' }],
        }),
      ],
      { name: 'Screen', width: 390, height: 844, fills: [{ type: 'solid', color: '#FFFFFF' }] },
    ),
  ])
}

function realisticDoc() {
  return singlePage(
    [
      frame(
        'login',
        [
          text('subtitle', {
            name: 'Subtitle',
            x: 32,
            y: 176,
            width: 326,
            height: 22,
            text: 'Sign in to your workspace',
            size: 14,
            fills: [{ type: 'solid', color: '#94A3B8' }],
          }),
          frame(
            'card',
            [
              text('card-title', {
                name: 'Card title',
                x: 20,
                y: 22,
                width: 286,
                height: 24,
                text: 'Email sign in',
                size: 18,
                weight: 600,
                fills: [{ type: 'solid', color: '#0F172A' }],
              }),
              text('email-label', {
                name: 'Email placeholder',
                x: 20,
                y: 74,
                width: 286,
                height: 20,
                text: 'you@company.com',
                size: 14,
                fills: [{ type: 'solid', color: '#94A3B8' }],
              }),
            ],
            { name: 'Form Card', x: 32, y: 248, width: 326, height: 356, fills: [{ type: 'solid', color: '#FFFFFF' }] },
          ),
        ],
        {
          name: 'Login',
          width: 390,
          height: 844,
          fills: [
            {
              type: 'linear-gradient',
              angle: 160,
              stops: [
                { position: 0, color: '#0F172A' },
                { position: 1, color: '#1E293B' },
              ],
            },
          ],
        },
      ),
    ],
    { comments: [{ id: 'comment-1', pageId: 'page-1', nodeId: 'card-title', body: 'Looks good' }] },
  )
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value)) deepFreeze(value[key])
  }
  return value
}

// ---------------------------------------------------------------------------
// Clean document
// ---------------------------------------------------------------------------

test('a clean document has no findings and reports every check as run', () => {
  const result = auditDoc(cleanDoc())
  assert.deepEqual(result.findings, [])
  assert.deepEqual(result.checked, ALL_CHECKS)
  assert.deepEqual(result.skipped, BASE_SKIPPED)
})

test('an empty page is audited without findings', () => {
  const result = auditDoc(singlePage([]))
  assert.deepEqual(result.findings, [])
  assert.deepEqual(result.checked, ALL_CHECKS)
  assert.deepEqual(result.skipped, BASE_SKIPPED)
})

// ---------------------------------------------------------------------------
// Contrast
// ---------------------------------------------------------------------------

test('body text below 4.5:1 is a high contrast finding', () => {
  const doc = singlePage([
    frame('screen', [
      text('low', {
        name: 'Low contrast',
        x: 20,
        y: 20,
        width: 240,
        height: 24,
        text: 'Hard to read',
        size: 14,
        weight: 400,
        fills: [{ type: 'solid', color: '#AAAAAA' }],
      }),
    ]),
  ])
  const result = auditDoc(doc)
  assert.deepEqual(codes(result), ['contrast'])
  const [finding] = byCode(result, 'contrast')
  assert.equal(finding.severity, 'high')
  assert.equal(finding.nodeId, 'low')
  assert.equal(finding.nodeName, 'Low contrast')
  assert.equal(finding.data.required, 4.5)
  assert.equal(finding.data.largeText, false)
  assert.equal(finding.data.fontSize, 14)
  assert.equal(finding.data.fontWeight, 400)
  assert.equal(finding.data.foreground, '#AAAAAA')
  assert.equal(finding.data.background, '#FFFFFF')
  assert.ok(finding.data.ratio > 2.3 && finding.data.ratio < 2.35)
  assert.match(finding.message, /2\.32:1/)
})

test('large text uses the 3:1 threshold and reports medium', () => {
  const doc = singlePage([
    frame('screen', [
      text('large', {
        name: 'Large heading',
        y: 20,
        size: 24,
        weight: 400,
        fills: [{ type: 'solid', color: '#AAAAAA' }],
      }),
      text('bold', {
        name: 'Bold small',
        y: 60,
        size: 18.66,
        weight: 700,
        fills: [{ type: 'solid', color: '#AAAAAA' }],
      }),
      text('semibold', {
        name: 'Semibold small',
        y: 100,
        size: 18.66,
        weight: 600,
        fills: [{ type: 'solid', color: '#AAAAAA' }],
      }),
    ]),
  ])
  const result = auditDoc(doc)
  const findings = byCode(result, 'contrast')
  assert.equal(findings.length, 3)
  assert.deepEqual(
    findings.map((finding) => [finding.nodeId, finding.severity, finding.data.largeText, finding.data.required]),
    [
      ['large', 'medium', true, 3],
      ['bold', 'medium', true, 3],
      ['semibold', 'high', false, 4.5],
    ],
  )
})

test('large text passes between 3:1 and 4.5:1 while body text fails', () => {
  const color = '#949494' // 3.03:1 against white
  const doc = singlePage([
    frame('screen', [
      text('large-pass', { name: 'Large pass', y: 20, size: 24, weight: 400, fills: [{ type: 'solid', color }] }),
      text('body-fail', { name: 'Body fail', y: 60, size: 14, weight: 400, fills: [{ type: 'solid', color }] }),
    ]),
  ])
  const result = auditDoc(doc)
  const findings = byCode(result, 'contrast')
  assert.equal(findings.length, 1)
  assert.equal(findings[0].nodeId, 'body-fail')
  assert.equal(findings[0].severity, 'high')
  assert.ok(findings[0].data.ratio > 3 && findings[0].data.ratio < 4.5)
})

test('a translucent text fill is composited over the background', () => {
  const doc = singlePage([
    frame('screen', [
      text('half-black', {
        name: 'Half black',
        x: 20,
        y: 20,
        width: 240,
        height: 24,
        size: 14,
        fills: [{ type: 'solid', color: '#00000080' }],
      }),
    ]),
  ])
  const result = auditDoc(doc)
  const [finding] = byCode(result, 'contrast')
  assert.ok(finding)
  assert.equal(finding.severity, 'high')
  assert.equal(finding.data.foreground, '#7F7F7F')
  assert.equal(finding.data.background, '#FFFFFF')
  assert.ok(finding.data.ratio > 3.9 && finding.data.ratio < 4.1)
})

test('contrast uses the nearest opaque ancestor fill, not the page', () => {
  const doc = singlePage([
    frame(
      'dark',
      [
        frame(
          'card',
          [
            text('on-card', {
              name: 'On card',
              x: 16,
              y: 16,
              size: 14,
              fills: [{ type: 'solid', color: '#111111' }],
            }),
          ],
          { name: 'White card', width: 300, height: 120, fills: [{ type: 'solid', color: '#FFFFFF' }] },
        ),
        text('on-dark', {
          name: 'On dark',
          x: 16,
          y: 160,
          size: 14,
          fills: [{ type: 'solid', color: '#111111' }],
        }),
      ],
      { name: 'Dark screen', fills: [{ type: 'solid', color: '#111111' }] },
    ),
  ])
  const result = auditDoc(doc)
  const findings = byCode(result, 'contrast')
  assert.equal(findings.length, 1)
  assert.equal(findings[0].nodeId, 'on-dark')
  assert.equal(findings[0].data.background, '#111111')
})

test('contrast falls back to the page background, defaulting to white', () => {
  const whitePage = auditDoc(
    singlePage([
      text('page-text', {
        name: 'Page text',
        x: 20,
        y: 20,
        size: 14,
        fills: [{ type: 'solid', color: '#AAAAAA' }],
      }),
    ]),
  )
  const [whiteFinding] = byCode(whitePage, 'contrast')
  assert.ok(whiteFinding)
  assert.equal(whiteFinding.data.background, '#FFFFFF')

  const darkPage = auditDoc(
    singlePage(
      [
        text('dark-text', {
          name: 'Dark text',
          x: 20,
          y: 20,
          size: 14,
          fills: [{ type: 'solid', color: '#111111' }],
        }),
      ],
      { pageBackground: '#111111' },
    ),
  )
  const [darkFinding] = byCode(darkPage, 'contrast')
  assert.ok(darkFinding)
  assert.equal(darkFinding.data.background, '#111111')
  assert.equal(darkFinding.data.ratio, 1)
})

test('gradient and image backgrounds are skipped for contrast', () => {
  const doc = singlePage([
    frame(
      'gradient-screen',
      [
        text('label', {
          name: 'Label',
          x: 20,
          y: 20,
          size: 14,
          fills: [{ type: 'solid', color: '#FFFFFF' }],
        }),
      ],
      {
        name: 'Gradient screen',
        fills: [
          {
            type: 'linear-gradient',
            angle: 180,
            stops: [
              { position: 0, color: '#111111' },
              { position: 1, color: '#333333' },
            ],
          },
        ],
      },
    ),
  ])
  const result = auditDoc(doc)
  assert.deepEqual(byCode(result, 'contrast'), [])
  assert.ok(result.skipped.includes('gradient/image backgrounds'))
  assert.equal(byCode(result, 'screenshot-boundary').length, 0)
})

test('gradient text fills are skipped for contrast', () => {
  const doc = singlePage([
    frame('screen', [
      text('gradient-text', {
        name: 'Gradient text',
        x: 20,
        y: 20,
        fills: [
          {
            type: 'linear-gradient',
            angle: 90,
            stops: [
              { position: 0, color: '#111111' },
              { position: 1, color: '#AAAAAA' },
            ],
          },
        ],
      }),
    ]),
  ])
  const result = auditDoc(doc)
  assert.deepEqual(byCode(result, 'contrast'), [])
  assert.ok(result.skipped.includes('gradient/image backgrounds'))
})

test('opacity below 1 is skipped for contrast', () => {
  const nodeOpacity = singlePage([
    frame('screen', [
      group('fade', [text('faded', { name: 'Faded', x: 10, y: 10, size: 14, fills: [{ type: 'solid', color: '#111111' }] })], {
        x: 20,
        y: 20,
        width: 240,
        height: 100,
        opacity: 0.5,
      }),
    ]),
  ])
  const nodeResult = auditDoc(nodeOpacity)
  assert.deepEqual(byCode(nodeResult, 'contrast'), [])
  assert.ok(nodeResult.skipped.includes('opacity/blur'))

  const fillOpacity = singlePage([
    frame(
      'screen',
      [text('behind', { name: 'Behind', x: 20, y: 20, size: 14, fills: [{ type: 'solid', color: '#111111' }] })],
      { fills: [{ type: 'solid', color: '#FFFFFF', opacity: 0.5 }] },
    ),
  ])
  const fillResult = auditDoc(fillOpacity)
  assert.deepEqual(byCode(fillResult, 'contrast'), [])
  assert.ok(fillResult.skipped.includes('opacity/blur'))
  assert.equal(byCode(fillResult, 'screenshot-boundary').length, 1)
})

test('an effect style blur is resolved for the contrast skip', () => {
  const styles = [
    {
      id: 'style-blur',
      type: 'effect',
      name: 'Blur',
      value: [{ type: 'layer-blur', radius: 3 }],
    },
  ]
  const blurred = { ...text('styled-blur', { name: 'Styled blur', x: 20, y: 20, size: 14, fills: [{ type: 'solid', color: '#AAAAAA' }] }), effectStyleId: 'style-blur' }
  const doc = singlePage([frame('screen', [blurred])], { styles })
  const result = auditDoc(doc)
  assert.deepEqual(byCode(result, 'contrast'), [])
  assert.ok(result.skipped.includes('opacity/blur'))
  assert.deepEqual(byCode(result, 'missing-refs'), [])
})

test('blur is skipped for contrast', () => {
  const doc = singlePage([
    frame('screen', [
      text('blurred', {
        name: 'Blurred',
        x: 20,
        y: 20,
        size: 14,
        fills: [{ type: 'solid', color: '#111111' }],
        effects: [{ type: 'layer-blur', radius: 4 }],
      }),
    ]),
  ])
  const result = auditDoc(doc)
  assert.deepEqual(byCode(result, 'contrast'), [])
  assert.ok(result.skipped.includes('opacity/blur'))
})

test('text style and fill style references are resolved for contrast', () => {
  const styles = [
    { id: 'style-body-fill', type: 'fill', name: 'Body fill', value: { type: 'solid', color: '#AAAAAA' } },
    {
      id: 'style-large-text',
      type: 'text',
      name: 'Large text',
      value: {
        font: { family: 'system-ui', weight: 400, style: 'normal', size: 24, lineHeight: 1.2, letterSpacing: 0 },
        fills: [{ type: 'solid', color: '#AAAAAA' }],
      },
    },
  ]
  const styled = { ...text('styled', { name: 'Styled', x: 20, y: 20, size: 14, fills: [{ type: 'solid', color: '#111111' }] }), textStyleId: 'style-large-text' }
  const filled = { ...text('filled', { name: 'Filled', x: 20, y: 60, size: 14, fills: [{ type: 'solid', color: '#111111' }] }), fillStyleId: 'style-body-fill' }
  const doc = singlePage([frame('screen', [styled, filled])], { styles })
  const result = auditDoc(doc)
  const findings = byCode(result, 'contrast')
  assert.deepEqual(
    findings.map((finding) => [finding.nodeId, finding.severity, finding.data.fontSize, finding.data.foreground]),
    [
      ['styled', 'medium', 24, '#AAAAAA'],
      ['filled', 'high', 14, '#AAAAAA'],
    ],
  )
})

// ---------------------------------------------------------------------------
// Screenshot boundary
// ---------------------------------------------------------------------------

test('a rounded top-level frame fails the screenshot boundary check', () => {
  const doc = singlePage([frame('rounded', [rect('child')], { name: 'Rounded', cornerRadius: 18 })])
  const result = auditDoc(doc)
  const findings = byCode(result, 'screenshot-boundary')
  assert.equal(findings.length, 1)
  assert.equal(findings[0].severity, 'high')
  assert.equal(findings[0].nodeId, 'rounded')
  assert.equal(findings[0].data.rounded, true)
  assert.equal(findings[0].data.opaque, true)
  assert.equal(findings[0].data.cornerRadius, 18)
  assert.match(findings[0].message, /corner radius 18/)
})

test('a transparent top-level frame fails the screenshot boundary check', () => {
  const doc = singlePage([frame('transparent', [rect('child')], { name: 'Transparent', fills: [] })])
  const result = auditDoc(doc)
  const [finding] = byCode(result, 'screenshot-boundary')
  assert.ok(finding)
  assert.equal(finding.severity, 'high')
  assert.equal(finding.data.opaque, false)
  assert.equal(finding.data.fillType, null)
  assert.match(finding.message, /no first fill/)
})

test('an opaque gradient passes while a translucent first fill fails the screenshot boundary check', () => {
  const gradient = singlePage([
    frame('gradient', [rect('child')], {
      name: 'Gradient',
      fills: [
        {
          type: 'linear-gradient',
          angle: 180,
          stops: [
            { position: 0, color: '#111111' },
            { position: 1, color: '#333333' },
          ],
        },
      ],
    }),
  ])
  const gradientResult = auditDoc(gradient)
  assert.equal(byCode(gradientResult, 'screenshot-boundary').length, 0)

  const translucent = singlePage([
    frame('translucent', [rect('child')], {
      name: 'Translucent',
      fills: [{ type: 'solid', color: '#FFFFFF', opacity: 0.5 }],
    }),
  ])
  const [translucentFinding] = byCode(auditDoc(translucent), 'screenshot-boundary')
  assert.equal(translucentFinding.severity, 'high')
  assert.equal(translucentFinding.data.opaque, false)
  assert.equal(translucentFinding.data.alpha, 0.5)
})

test('each top-level frame is checked and non-frame roots are ignored', () => {
  const doc = singlePage([
    frame('bad', [rect('bad-child')], { name: 'Bad', cornerRadius: 8 }),
    frame('good', [rect('good-child')], { name: 'Good' }),
    rect('loose', { name: 'Loose rect', x: 20, y: 20, width: 100, height: 100, cornerRadius: 12 }),
  ])
  const result = auditDoc(doc)
  const findings = byCode(result, 'screenshot-boundary')
  assert.equal(findings.length, 1)
  assert.equal(findings[0].nodeId, 'bad')
})

test('fill style references override literal fills for the screenshot boundary', () => {
  const styles = [
    { id: 'style-solid-white', type: 'fill', name: 'White', value: { type: 'solid', color: '#FFFFFF' } },
  ]
  const doc = singlePage(
    [
      frame('styled', [rect('styled-child')], {
        name: 'Styled',
        fills: [
          {
            type: 'linear-gradient',
            angle: 180,
            stops: [
              { position: 0, color: '#111111' },
              { position: 1, color: '#333333' },
            ],
          },
        ],
        fillStyleId: 'style-solid-white',
      }),
    ],
    { styles },
  )
  const result = auditDoc(doc)
  assert.deepEqual(byCode(result, 'screenshot-boundary'), [])
})

// ---------------------------------------------------------------------------
// Touch targets
// ---------------------------------------------------------------------------

test('small interactive nodes fail the touch-target heuristic', () => {
  const doc = singlePage([frame('screen', [rect('close', { name: 'Close', x: 20, y: 20, width: 40, height: 40 })])])
  const result = auditDoc(doc)
  const findings = byCode(result, 'touch-target')
  assert.equal(findings.length, 1)
  const [finding] = findings
  assert.equal(finding.severity, 'medium')
  assert.equal(finding.nodeId, 'close')
  assert.equal(finding.data.system, 'material3')
  assert.equal(finding.data.minSize, 48)
  assert.equal(finding.data.width, 40)
  assert.equal(finding.data.height, 40)
  assert.equal(finding.data.matchedOn, 'name')
  assert.equal(finding.data.matchedText, 'Close')
  assert.equal(finding.data.matchedKeyword, 'Close')
  assert.equal(finding.data.heuristic, true)
  assert.match(finding.data.note, /Heuristic/)
  assert.match(finding.message, /48x48/)
})

test('iOS uses a 44pt minimum while Material 3 uses 48dp', () => {
  const doc = singlePage([frame('screen', [rect('button', { name: 'Button', x: 20, y: 20, width: 46, height: 46 })])])
  assert.deepEqual(byCode(auditDoc(doc, { system: 'ios' }), 'touch-target'), [])
  const material = byCode(auditDoc(doc, { system: 'material3' }), 'touch-target')
  assert.equal(material.length, 1)
  assert.equal(material[0].data.minSize, 48)

  const exact = singlePage([frame('screen', [rect('button', { name: 'Button', x: 20, y: 20, width: 44, height: 44 })])])
  assert.deepEqual(byCode(auditDoc(exact, { system: 'ios' }), 'touch-target'), [])
  assert.equal(byCode(auditDoc(exact, { system: 'material3' }), 'touch-target').length, 1)
})

test('the source component name also drives the touch-target heuristic', () => {
  const doc = singlePage(
    [
      frame('screen', [
        instance('glyph', 'cmp-search-icon', { name: 'Glyph', x: 20, y: 20, width: 20, height: 20 }),
      ]),
    ],
    {
      components: [
        component('cmp-search-icon', 'Icon/Search', frame('cmp-search-icon-root', [], { name: 'Root', width: 24, height: 24 })),
      ],
    },
  )
  const result = auditDoc(doc)
  const findings = byCode(result, 'touch-target')
  assert.equal(findings.length, 1)
  assert.equal(findings[0].nodeId, 'glyph')
  assert.equal(findings[0].data.matchedOn, 'componentName')
  assert.equal(findings[0].data.matchedText, 'Icon/Search')
  assert.equal(findings[0].data.matchedKeyword, 'Icon')
  assert.ok(result.skipped.includes('component instance contents'))
})

test('non-interactive and invisible nodes are ignored by the touch-target heuristic', () => {
  const doc = singlePage([
    frame('screen', [
      rect('avatar', { name: 'Avatar', x: 20, y: 20, width: 20, height: 20 }),
      rect('hidden', { name: 'Close', x: 20, y: 60, width: 20, height: 20, visible: false }),
    ]),
  ])
  assert.deepEqual(byCode(auditDoc(doc), 'touch-target'), [])
})

// ---------------------------------------------------------------------------
// Clipped children
// ---------------------------------------------------------------------------

test('a visible child overflowing a clipping frame is a low finding', () => {
  const doc = singlePage([
    frame('card', [rect('chip', { name: 'Chip', x: 180, y: 10, width: 40, height: 20 })], {
      name: 'Card',
      width: 200,
      height: 100,
    }),
  ])
  const result = auditDoc(doc)
  const findings = byCode(result, 'clipped-child')
  assert.equal(findings.length, 1)
  const [finding] = findings
  assert.equal(finding.severity, 'low')
  assert.equal(finding.nodeId, 'chip')
  assert.equal(finding.nodeName, 'Chip')
  assert.equal(finding.data.frameId, 'card')
  assert.equal(finding.data.frameName, 'Card')
  assert.deepEqual(finding.data.overflow, { left: 0, top: 0, right: 20, bottom: 0 })
  assert.match(finding.message, /right 20/)
})

test('non-clipping frames, exact fits and hidden children are not clipped', () => {
  const cases = [
    frame('card', [rect('chip', { name: 'Chip', x: 180, y: 10, width: 40, height: 20 })], {
      width: 200,
      height: 100,
      clip: false,
    }),
    frame('card', [rect('chip', { name: 'Chip', x: 0, y: 0, width: 200, height: 100 })], {
      width: 200,
      height: 100,
    }),
    frame('card', [rect('chip', { name: 'Chip', x: 180, y: 10, width: 40, height: 20, visible: false })], {
      width: 200,
      height: 100,
    }),
  ]
  for (const root of cases) {
    const result = auditDoc(singlePage([root]))
    assert.deepEqual(byCode(result, 'clipped-child'), [], root.name)
  }
})

test('overflow on the top or left edge is reported too', () => {
  const doc = singlePage([
    frame('card', [rect('chip', { name: 'Chip', x: -10, y: -5, width: 50, height: 20 })], {
      width: 200,
      height: 100,
    }),
  ])
  const [finding] = byCode(auditDoc(doc), 'clipped-child')
  assert.ok(finding)
  assert.deepEqual(finding.data.overflow, { left: 10, top: 5, right: 0, bottom: 0 })
})

// ---------------------------------------------------------------------------
// Zero size
// ---------------------------------------------------------------------------

test('visible zero-width and zero-height nodes are medium findings', () => {
  const doc = singlePage([
    frame('screen', [
      rect('zero-width', { name: 'Zero width', x: 20, y: 20, width: 0, height: 20 }),
      rect('zero-height', { name: 'Zero height', x: 20, y: 60, width: 20, height: 0 }),
      rect('zero-both', { name: 'Zero both', x: 20, y: 100, width: 0, height: 0 }),
      rect('hidden-zero', { name: 'Hidden zero', x: 20, y: 140, width: 0, height: 20, visible: false }),
      line('divider', { name: 'Divider', x: 20, y: 180, width: 100 }),
      line('zero-line', { name: 'Zero line', x: 20, y: 220, width: 0 }),
    ]),
  ])
  const findings = byCode(auditDoc(doc), 'zero-size')
  assert.deepEqual(
    findings.map((finding) => [finding.nodeId, finding.severity, finding.data.axis]),
    [
      ['zero-width', 'medium', 'width'],
      ['zero-height', 'medium', 'height'],
      ['zero-both', 'medium', 'both'],
      ['zero-line', 'medium', 'both'],
    ],
  )
})

// ---------------------------------------------------------------------------
// Missing references
// ---------------------------------------------------------------------------

test('an instance with a missing component is a high finding', () => {
  const doc = singlePage(
    [frame('screen', [instance('ghost', 'cmp-ghost', { name: 'Ghost', x: 20, y: 20, width: 20, height: 20 })])],
    {
      components: [
        component('cmp-ghost', 'Ghost component', frame('cmp-ghost-root', [], { name: 'Ghost root', width: 20, height: 20 })),
      ],
    },
  )
  doc.components = []
  const before = JSON.stringify(doc)
  const result = auditDoc(doc)
  assert.equal(JSON.stringify(doc), before)
  const findings = byCode(result, 'missing-refs')
  assert.equal(findings.length, 1)
  assert.equal(findings[0].severity, 'high')
  assert.equal(findings[0].nodeId, 'ghost')
  assert.deepEqual(findings[0].data, {
    reference: 'componentId',
    componentId: 'cmp-ghost',
    reason: 'unknown',
  })
})

test('missing fill, text and effect style references are high findings', () => {
  const styles = [
    { id: 'style-fill', type: 'fill', name: 'Fill', value: { type: 'solid', color: '#111111' } },
    {
      id: 'style-text',
      type: 'text',
      name: 'Text',
      value: {
        font: { family: 'system-ui', weight: 400, style: 'normal', size: 14, lineHeight: 1.4, letterSpacing: 0 },
        fills: [{ type: 'solid', color: '#111111' }],
      },
    },
    {
      id: 'style-effect',
      type: 'effect',
      name: 'Effect',
      value: [{ type: 'drop-shadow', x: 0, y: 1, blur: 2, spread: 0, color: '#00000033' }],
    },
  ]
  const styled = {
    ...text('styled', { name: 'Styled', x: 20, y: 20, size: 14 }),
    fillStyleId: 'style-fill',
    textStyleId: 'style-text',
    effectStyleId: 'style-effect',
  }
  const doc = singlePage([frame('screen', [styled])], { styles })
  doc.styles = []
  const result = auditDoc(doc)
  const findings = byCode(result, 'missing-refs')
  assert.equal(findings.length, 3)
  assert.ok(findings.every((finding) => finding.severity === 'high' && finding.nodeId === 'styled'))
  assert.deepEqual(
    findings.map((finding) => [finding.data.reference, finding.data.expectedType]),
    [
      ['fillStyleId', 'fill'],
      ['textStyleId', 'text'],
      ['effectStyleId', 'effect'],
    ],
  )
})

test('missing and invalid image fill assets are high findings', () => {
  const doc = singlePage([
    frame('screen', [
      rect('missing', {
        name: 'Missing image',
        x: 20,
        y: 20,
        width: 100,
        height: 100,
        fills: [{ type: 'image', asset: 'assets/missing.png', fit: 'cover' }],
      }),
      rect('invalid', {
        name: 'Invalid image',
        x: 140,
        y: 20,
        width: 100,
        height: 100,
        fills: [{ type: 'image', asset: 'assets/invalid.png', fit: 'cover' }],
      }),
    ]),
  ])
  const screen = doc.pages[0].children[0]
  delete screen.children[0].fills[0].asset
  screen.children[1].fills[0].asset = '../invalid.png'
  const before = JSON.stringify(doc)
  const result = auditDoc(doc)
  assert.equal(JSON.stringify(doc), before)
  const findings = byCode(result, 'missing-refs')
  assert.equal(findings.length, 2)
  assert.deepEqual(
    findings.map((finding) => [finding.nodeId, finding.data.reference, finding.data.reason]),
    [
      ['missing', 'image.asset', 'missing'],
      ['invalid', 'image.asset', 'invalid'],
    ],
  )
})

test('a valid image fill with an asset reference is accepted', () => {
  const doc = singlePage([
    frame('screen', [
      rect('image', {
        name: 'Hero image',
        x: 20,
        y: 20,
        width: 100,
        height: 100,
        fills: [{ type: 'image', asset: 'assets/hero.png', fit: 'cover' }],
      }),
    ]),
  ])
  const result = auditDoc(doc)
  assert.deepEqual(byCode(result, 'missing-refs'), [])
})

// ---------------------------------------------------------------------------
// Unresolved comments
// ---------------------------------------------------------------------------

function commentedDoc() {
  return singlePage(
    [
      frame('screen', [
        text('a', { name: 'Alpha', x: 20, y: 20, size: 14 }),
        text('b', { name: 'Beta', x: 20, y: 60, size: 14 }),
      ]),
    ],
    {
      comments: [
        { id: 'c1', pageId: 'page-1', nodeId: 'a', body: 'First' },
        { id: 'c2', pageId: 'page-1', body: 'Page note' },
        { id: 'c3', pageId: 'page-1', nodeId: 'b', body: 'Resolved note', resolved: true },
      ],
    },
  )
}

test('unresolved comments are counted once per page scope', () => {
  const result = auditDoc(commentedDoc())
  const findings = byCode(result, 'unresolved-comments')
  assert.equal(findings.length, 1)
  const [finding] = findings
  assert.equal(finding.severity, 'low')
  assert.equal(finding.nodeId, 'page-1')
  assert.equal(finding.nodeName, 'Page 1')
  assert.deepEqual(finding.data, { count: 2, commentIds: ['c1', 'c2'], scope: 'page' })
  assert.match(finding.message, /2 unresolved comments/)
})

test('resolved comments are ignored', () => {
  const doc = singlePage([frame('screen', [text('a', { name: 'Alpha', size: 14 })])], {
    comments: [{ id: 'c1', pageId: 'page-1', nodeId: 'a', body: 'Fixed', resolved: true }],
  })
  assert.deepEqual(byCode(auditDoc(doc), 'unresolved-comments'), [])
})

test('node-scoped audits only count comments in the selected subtree', () => {
  const doc = commentedDoc()
  const result = auditDoc(doc, { nodeId: 'a' })
  const findings = byCode(result, 'unresolved-comments')
  assert.equal(findings.length, 1)
  assert.equal(findings[0].nodeId, 'a')
  assert.equal(findings[0].data.scope, 'node')
  assert.equal(findings[0].data.count, 1)
  assert.deepEqual(findings[0].data.commentIds, ['c1'])
})

// ---------------------------------------------------------------------------
// Empty frames
// ---------------------------------------------------------------------------

test('visible top-level frames without visible children are low findings', () => {
  const doc = singlePage([
    frame('empty', [], { name: 'Empty' }),
    frame('invisible-child', [rect('hidden', { visible: false })], { name: 'Only hidden' }),
    frame('visible-child', [rect('shown')], { name: 'Has child' }),
    frame('nested-parent', [frame('nested-empty', [], { name: 'Nested empty', width: 100, height: 100 })], {
      name: 'Nested parent',
    }),
  ])
  const findings = byCode(auditDoc(doc), 'empty-frame')
  assert.deepEqual(
    findings.map((finding) => [finding.nodeId, finding.severity, finding.data.visibleChildCount]),
    [
      ['empty', 'low', 0],
      ['invisible-child', 'low', 0],
    ],
  )
  assert.equal(findings[1].data.childCount, 1)
})

test('empty-frame applies to a selected frame but not to non-frame selections', () => {
  const doc = singlePage([
    frame('empty', [], { name: 'Empty' }),
    frame('full', [rect('child')], { name: 'Full' }),
  ])
  assert.equal(byCode(auditDoc(doc, { nodeId: 'empty' }), 'empty-frame').length, 1)
  assert.deepEqual(byCode(auditDoc(doc, { nodeId: 'full' }), 'empty-frame'), [])
  const child = auditDoc(doc, { nodeId: 'child' })
  assert.deepEqual(child.findings, [])
  assert.deepEqual(child.checked, ALL_CHECKS)
})

// ---------------------------------------------------------------------------
// Node scope
// ---------------------------------------------------------------------------

function scopedDoc() {
  return singlePage([
    frame(
      'clean-frame',
      [text('clean-text', { name: 'Clean text', x: 20, y: 20, size: 14, fills: [{ type: 'solid', color: '#111111' }] })],
      { name: 'Clean frame' },
    ),
    frame(
      'bad-frame',
      [
        text('low-text', { name: 'Low text', x: 20, y: 20, size: 14, fills: [{ type: 'solid', color: '#AAAAAA' }] }),
        rect('zero', { name: 'Zero box', x: 20, y: 60, width: 0, height: 10 }),
      ],
      { name: 'Bad frame', cornerRadius: 12 },
    ),
  ])
}

test('node-scoped audits limit every check to the selected subtree', () => {
  const doc = scopedDoc()

  const clean = auditDoc(doc, { nodeId: 'clean-frame' })
  assert.deepEqual(clean.findings, [])
  assert.deepEqual(clean.checked, ALL_CHECKS)

  const bad = auditDoc(doc, { nodeId: 'bad-frame' })
  assert.deepEqual(
    bad.findings.map((finding) => [finding.code, finding.nodeId]).sort(),
    [
      ['contrast', 'low-text'],
      ['screenshot-boundary', 'bad-frame'],
      ['zero-size', 'zero'],
    ],
  )

  const lowText = auditDoc(doc, { nodeId: 'low-text' })
  assert.deepEqual(lowText.findings.map((finding) => finding.code), ['contrast'])

  const zero = auditDoc(doc, { nodeId: 'zero' })
  assert.deepEqual(zero.findings.map((finding) => finding.code), ['zero-size'])
})

test('node-scoped contrast still sees the real ancestor background', () => {
  const doc = singlePage([
    frame('dark', [text('inverse', { name: 'Inverse', x: 20, y: 20, size: 14, fills: [{ type: 'solid', color: '#FFFFFF' }] })], {
      name: 'Dark',
      fills: [{ type: 'solid', color: '#111111' }],
    }),
  ])
  const result = auditDoc(doc, { nodeId: 'inverse' })
  assert.deepEqual(result.findings, [])
})

test('unknown page and node targets are rejected', () => {
  const doc = scopedDoc()
  assert.throws(() => auditDoc(doc, { pageId: 'nope' }), /unknown page/)
  assert.throws(() => auditDoc(doc, { nodeId: 'nope' }), /unknown node/)
  assert.throws(() => auditDoc(doc, { pageId: 'page-1', nodeId: 'nope' }), /unknown node/)
  assert.throws(() => auditDoc(null), /document object/)
  assert.throws(() => auditDoc(doc, []), /options must be an object/)
  assert.throws(() => auditDoc({ pages: [] }), /no pages/)
})

// ---------------------------------------------------------------------------
// Page selection
// ---------------------------------------------------------------------------

test('pageId selects the audited page and its comments', () => {
  const doc = normalizeDoc({
    format: 'dsh.canvas',
    version: 1,
    title: 'Two pages',
    pages: [
      {
        id: 'page-1',
        name: 'One',
        background: null,
        children: [
          frame('p1-frame', [
            text('p1-text', { name: 'P1 text', x: 20, y: 20, size: 14, fills: [{ type: 'solid', color: '#AAAAAA' }] }),
          ]),
        ],
      },
      { id: 'page-2', name: 'Two', background: null, children: [frame('p2-empty', [], { name: 'Second empty' })] },
    ],
    comments: [{ id: 'c-page2', pageId: 'page-2', body: 'Second page note' }],
  })

  const defaultPage = auditDoc(doc)
  assert.deepEqual(defaultPage.findings.map((finding) => finding.nodeId).sort(), ['p1-text'])

  const secondPage = auditDoc(doc, { pageId: 'page-2' })
  assert.deepEqual(
    secondPage.findings.map((finding) => [finding.code, finding.nodeId]).sort(),
    [
      ['empty-frame', 'p2-empty'],
      ['unresolved-comments', 'page-2'],
    ],
  )

  assert.equal(byCode(auditDoc(doc, { pageId: 'page-1', nodeId: 'p1-text' }), 'contrast').length, 1)
  assert.throws(() => auditDoc(doc, { pageId: 'page-2', nodeId: 'p1-text' }), /unknown node/)
})

// ---------------------------------------------------------------------------
// Purity, determinism and finding shape
// ---------------------------------------------------------------------------

test('auditDoc never mutates the document and is deterministic', () => {
  const doc = deepFreeze(realisticDoc())
  const before = JSON.stringify(doc)
  const first = auditDoc(doc)
  const second = auditDoc(doc)
  assert.equal(JSON.stringify(doc), before)
  assert.deepEqual(first, second)
})

test('all eight checks can fire on one document with well-formed findings', () => {
  const doc = singlePage(
    [
      frame(
        'hero',
        [
          text('low-text', { name: 'Low contrast', x: 20, y: 20, size: 14, fills: [{ type: 'solid', color: '#AAAAAA' }] }),
          rect('small-button', { name: 'Button', x: 20, y: 60, width: 30, height: 30 }),
          rect('clipped', { name: 'Clipped chip', x: 380, y: 10, width: 40, height: 20 }),
          rect('zero', { name: 'Zero box', x: 20, y: 100, width: 0, height: 10 }),
          instance('orphan', 'cmp-orphan', { name: 'Glyph', x: 20, y: 140, width: 20, height: 20 }),
        ],
        { name: 'Hero', cornerRadius: 12 },
      ),
      frame('blank', [], { name: 'Blank' }),
    ],
    {
      components: [
        component('cmp-orphan', 'Plain component', frame('cmp-orphan-root', [], { name: 'Root', width: 20, height: 20 })),
      ],
      comments: [{ id: 'comment-1', pageId: 'page-1', nodeId: 'low-text', body: 'Please fix' }],
    },
  )
  doc.components = []

  const result = auditDoc(doc)
  assert.deepEqual([...new Set(codes(result))], [...ALL_CHECKS].sort())
  for (const finding of result.findings) {
    assert.ok(['high', 'medium', 'low'].includes(finding.severity), finding.severity)
    assert.equal(typeof finding.code, 'string')
    assert.equal(typeof finding.nodeId, 'string')
    assert.equal(typeof finding.nodeName, 'string')
    assert.equal(typeof finding.message, 'string')
    assert.ok(finding.message.length > 0)
    if ('data' in finding) {
      assert.equal(typeof finding.data, 'object')
      assert.ok(finding.data !== null)
    }
  }
})

test('a realistic gradient screen reports boundary, contrast and comment issues', () => {
  const result = auditDoc(realisticDoc())
  const boundary = byCode(result, 'screenshot-boundary')
  assert.equal(boundary.length, 0)

  const contrast = byCode(result, 'contrast')
  assert.equal(contrast.length, 1)
  assert.equal(contrast[0].nodeId, 'email-label')
  assert.equal(contrast[0].severity, 'high')
  assert.equal(contrast[0].data.background, '#FFFFFF')

  const comments = byCode(result, 'unresolved-comments')
  assert.equal(comments.length, 1)
  assert.equal(comments[0].data.count, 1)
  assert.ok(result.skipped.includes('gradient/image backgrounds'))
  assert.deepEqual(result.checked, ALL_CHECKS)
})
