// @ts-nocheck
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

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
