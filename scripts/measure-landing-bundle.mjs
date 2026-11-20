import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const html = await readFile('.next/server/app/index.html', 'utf8')
const urls = [...html.matchAll(/<script\b[^>]* src="([^"]+)"/g)].map(match => match[1])
const chunks = [...new Set(urls.filter(url => url.startsWith('/_next/static/') && url.endsWith('.js')))]
if (!chunks.length || !html.includes('hero-title')) throw new Error('Build de produção da landing ausente')
let bytes = 0
let gzip = 0
for (const url of chunks) {
  const chunk = await readFile(resolve('.next', url.slice('/_next/'.length)))
  bytes += chunk.length
  gzip += gzipSync(chunk).length
}
const reference = JSON.parse(await readFile(new URL('../tests/visual/metrics.json', import.meta.url), 'utf8')).before.initialJs
const growth = (current, initial) => Number(((current / initial - 1) * 100).toFixed(2))
console.log(JSON.stringify({
  route: '/', scripts: chunks.length, bytes, gzip,
  growthPercent: { bytes: growth(bytes, reference.bytes), gzip: growth(gzip, reference.gzip) },
}, null, 2))
if (bytes > reference.bytes * 1.3 || gzip > reference.gzip * 1.3) {
  throw new Error('JavaScript inicial de / excede a linha de base em mais de 30%')
}
