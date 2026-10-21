import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Script } from 'node:vm'

// An offline, double-clickable dashboard. The two-site relay remains optional.
const root = resolve('dist')
let html = await readFile(resolve(root, 'index.html'), 'utf8')
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)]
const stylesheet = html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/)
if (!scripts.length || !stylesheet) throw new Error('Built dashboard assets were not found')
for (const script of scripts) {
  const js = await readFile(resolve(root, script[1].replace(/^\/+/, '')), 'utf8')
  new Script(js)
  html = html.replace(script[0], () => `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`)
}
const cssPath = resolve(root, stylesheet[1])
let css = await readFile(cssPath, 'utf8')
const fonts = [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/^['"]|['"]$/g, '')))]
for (const file of fonts) {
  if (/^data:|^https?:/.test(file)) continue
  const font = await readFile(resolve(cssPath, '..', file))
  css = css.split(file).join(`data:font/${file.endsWith('woff2') ? 'woff2' : 'woff'};base64,${font.toString('base64')}`)
}
html = html.replace(stylesheet[0], () => `<style>${css}</style>`)
for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(script[1])
await writeFile(resolve(root, 'trustladder-offline.html'), html)
console.log('Offline dashboard: dist/trustladder-offline.html')
