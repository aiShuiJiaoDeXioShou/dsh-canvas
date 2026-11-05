/**
 * Build the browser half into the single-file `__ModuleLoader__` factory the
 * DSH client module system expects. React and its JSX runtime stay external:
 * the shell owns exactly one React instance.
 *
 * Usage: node build.mjs [--watch]
 */

import { build } from 'esbuild'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const outDir = join(root, 'client')
const tmpFile = join(outDir, '.bundle.cjs')
const outFile = join(outDir, 'client.js')
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

const ID = pkg.name
const banner = `/* ${ID} v${pkg.version} — built ${new Date().toISOString()} */`

await mkdir(outDir, { recursive: true })
await build({
  entryPoints: [join(root, 'src/client/index.jsx')],
  bundle: true,
  write: true,
  outfile: tmpFile,
  format: 'cjs',
  platform: 'browser',
  target: ['chrome120'],
  jsx: 'automatic',
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  external: ['react', 'react/jsx-runtime'],
  loader: {
    '.css': 'text',
    '.svg': 'text',
    '.woff2': 'dataurl',
    '.png': 'dataurl',
  },
  logLevel: 'warning',
})

const body = await readFile(tmpFile, 'utf8')
if (body.includes('require("@deepseek-ai/')) {
  throw new Error('client bundle must not require a DSH internal Client package')
}

const wrapped = `${banner}
window.__ModuleLoader__.load({
  id: ${JSON.stringify(ID)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${body}
    return module.exports;
  },
});
`
await writeFile(outFile, wrapped, 'utf8')
await rm(tmpFile, { force: true })
const kb = (Buffer.byteLength(wrapped) / 1024).toFixed(1)
console.log(`[dsh-canvas] built ${outFile} (${kb} KiB)`)
