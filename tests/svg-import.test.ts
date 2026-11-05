// @ts-nocheck
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { importSvgPaths } from '../src/shared/path/svg-import.js'

test('imports path elements and basic paint', () => {
  const result = importSvgPaths('<svg viewBox="0 0 24 24"><path id="star" d="M0 0h24v24H0z" fill="#123456" stroke="#FFFFFF" stroke-width="2"/></svg>')
  assert.equal(result.paths.length, 1)
  assert.equal(result.paths[0].name, 'star')
  assert.deepEqual(result.paths[0].viewBox, { x: 0, y: 0, width: 24, height: 24 })
  assert.equal(result.paths[0].fills[0].color, '#123456')
  assert.equal(result.paths[0].strokes[0].color, '#FFFFFF')
  assert.equal(result.paths[0].strokes[0].width, 2)
  assert.deepEqual(result.warnings, [])
})

test('reports unsupported content without throwing', () => {
  const result = importSvgPaths('<svg><g transform="translate(1 2)"><text>Hi</text><path d="M0 0h10v10z"/></g></svg>')
  assert.equal(result.paths.length, 1)
  assert.ok(result.warnings.some((warning) => warning.includes('transform')))
  assert.ok(result.warnings.some((warning) => warning.includes('text')))
})

test('imports basic geometric shapes as paths', () => {
  const result = importSvgPaths('<svg viewBox="0 0 40 40"><rect x="1" y="2" width="10" height="8" fill="#111111"/><circle cx="20" cy="20" r="5"/><line x1="0" y1="0" x2="10" y2="10" stroke="#FF0000"/><polygon points="1,1 10,1 5,9" fill="#00FF00"/></svg>')
  assert.equal(result.paths.length, 4)
  assert.match(result.paths[0].d, /^M1 2h10v8h-10z$/)
  assert.match(result.paths[1].d, /a5 5/)
  assert.match(result.paths[2].d, /^M0 0L10 10$/)
  assert.match(result.paths[3].d, /Z$/)
})
