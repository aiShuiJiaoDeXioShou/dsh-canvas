import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)

test('the packaged icon is a compact RGBA PNG shared by the SVG export', async () => {
  const png = await readFile(new URL('icon.png', root))
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  assert.equal(png.readUInt32BE(16), 256)
  assert.equal(png.readUInt32BE(20), 256)
  assert.equal(png[25], 6, 'PNG must retain RGBA transparency')
  assert.ok(png.length < 100_000, 'keep the inlined icon under 100 KB')
  const svg = await readFile(new URL('icon.svg', root), 'utf8')
  const embedded = svg.match(/href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/)
  assert.ok(embedded, 'SVG export must embed the artwork without a network request')
  assert.deepEqual(Buffer.from(embedded[1], 'base64'), png)
})

test('package exports and the browser use the updated icon assets', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
  assert.equal(pkg.icon, 'icon.svg')
  assert.equal(pkg.exports['./icon'], './icon.svg')
  assert.ok(pkg.files.includes('icon.svg'))
  assert.ok(pkg.files.includes('icon.png'))
  const client = await readFile(new URL('src/client/index.tsx', root), 'utf8')
  assert.match(client, /import canvasIcon from '\.\.\/\.\.\/icon\.png'/)
  assert.match(client, /src: canvasIcon/)
})

test('Drafi branding preserves the package and document integration identifiers', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
  assert.equal(pkg.name, '@local/dsh-canvas')
  assert.match(pkg.description, /^Drafi:/)
  for (const language of ['zh', 'en']) {
    const locale = JSON.parse(await readFile(new URL(`locale/${language}.json`, root), 'utf8'))
    assert.equal(locale.meta.title, 'Drafi')
  }
  const client = await readFile(new URL('src/client/index.tsx', root), 'utf8')
  assert.equal([...client.matchAll(/'tab\.title': 'Drafi'/g)].length, 2)
  assert.equal([...client.matchAll(/'guide\.title': 'Drafi'/g)].length, 2)
  assert.match(client, /const ID = '@local\/dsh-canvas'/)
  assert.match(client, /const NS = 'dsh-canvas'/)
  const readme = await readFile(new URL('README.md', root), 'utf8')
  assert.match(readme, /^# Drafi\n/)
  assert.match(readme, /dsh\.canvas@1/)
})

test('the right sidebar is the only plugin entry point', async () => {
  const client = await readFile(new URL('src/client/index.tsx', root), 'utf8')
  assert.doesNotMatch(client, /conversation\.input\.right/)
  assert.doesNotMatch(client, /composer\.open/)
  assert.doesNotMatch(client, /ComposerCanvasButton/)
  assert.match(client, /sidebar\.right\.pane\.tab/)
  assert.match(client, /conversation\.input\.dock/)
  const readme = await readFile(new URL('README.md', root), 'utf8')
  assert.doesNotMatch(readme, /composer "打开 Drafi" button/)
})
