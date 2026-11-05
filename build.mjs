/**
 * Build both halves:
 *   - src/client/index.tsx -> client/client.js (DSH __ModuleLoader__ factory)
 *   - src/host/main.ts     -> dist/host/main.js (Node ESM bundle)
 */

import { build } from 'esbuild'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const ID = pkg.name
const banner = `/* ${ID} v${pkg.version} */`

async function buildClient() {
  const outDir = join(root, 'client')
  const tmpFile = join(outDir, '.bundle.cjs')
  const outFile = join(outDir, 'client.js')
  await mkdir(outDir, { recursive: true })
  await build({
    entryPoints: [join(root, 'src/client/index.tsx')],
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
  return outFile
}

async function buildHost() {
  const outFile = join(root, 'dist/host/main.js')
  await mkdir(dirname(outFile), { recursive: true })
  await build({
    entryPoints: [join(root, 'src/host/main.ts')],
    bundle: true,
    write: true,
    outfile: outFile,
    format: 'esm',
    platform: 'node',
    target: ['node22'],
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'warning',
  })
  return outFile
}

const clientFile = await buildClient()
const hostFile = await buildHost()
const clientKb = (Buffer.byteLength(await readFile(clientFile)) / 1024).toFixed(1)
const hostKb = (Buffer.byteLength(await readFile(hostFile)) / 1024).toFixed(1)
console.log(`[dsh-canvas] built ${clientFile} (${clientKb} KiB)`)
console.log(`[dsh-canvas] built ${hostFile} (${hostKb} KiB)`)
