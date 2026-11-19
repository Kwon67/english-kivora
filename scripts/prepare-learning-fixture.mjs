/** Materialize an isolated Next app without reading/copying any .env file. */
import { readFile, writeFile, mkdir, symlink, lstat } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destination = resolve(root, 'output/learning-evolution/fixture')
const manifest = JSON.parse(await readFile(resolve(root, 'e2e/learning-fixture.json'), 'utf8'))
if (manifest.format !== 1) throw new Error('Unknown fixture format')
await mkdir(destination, { recursive: true })
for (const [name, contents] of Object.entries(manifest.files)) {
  const path = resolve(destination, name)
  if (!path.startsWith(destination + sep) || name.split('/').some(part => part.startsWith('.env'))) throw new Error('Unsafe fixture path')
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, contents)
}
for (const name of ['src', 'public', 'node_modules']) {
  const path = resolve(destination, name)
  try { await lstat(path) } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await symlink(resolve(root, name), path)
  }
}
await writeFile(resolve(destination, 'next.config.ts'), `export default {turbopack:{root:${JSON.stringify(root)}},devIndicators:false}\n`)
console.log(`Prepared ${Object.keys(manifest.files).length} synthetic fixture files in ${destination}`)
