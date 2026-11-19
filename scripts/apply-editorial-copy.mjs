/** Offline-only editorial rehearsal. Never reads credentials or contacts a database. */
import { readFile, writeFile, realpath } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
export function applyEditorialCopy(rows, patches, reverse = false) {
  if (!Array.isArray(rows) || !Array.isArray(patches)) throw new Error('Expected arrays')
  const index = new Map(rows.map(row => [row.id, row]))
  if (index.size !== rows.length) throw new Error('Duplicate source IDs')
  const seen = new Set()
  for (const patch of patches) {
    if (seen.has(patch.card_id)) throw new Error('Duplicate patch ID')
    seen.add(patch.card_id)
    if (patch.field !== 'portuguese_translation' || typeof patch.after !== 'string' || !patch.after.trim() || patch.after === patch.before) throw new Error('Invalid patch field or text')
    const row = index.get(patch.card_id)
    if (!row || row.pack_id !== patch.pack_id || row.english_phrase !== patch.english_phrase || !row.is_public || row.portuguese_translation !== (reverse ? patch.after : patch.before)) throw new Error(`Source conflict: ${patch.card_id}`)
  }
  // Validate the complete batch before changing even one copied row.
  const changes = new Map(patches.map(patch => [patch.card_id, reverse ? patch.before : patch.after]))
  return rows.map(row => changes.has(row.id) ? { ...row, portuguese_translation: changes.get(row.id) } : { ...row })
}
export async function writeEditorialCopy(sourcePath, manifestPath, destinationPath) {
  const source = await realpath(sourcePath)
  const destination = resolve(destinationPath)
  if (source === destination) throw new Error('Refusing to overwrite source')
  const raw = await readFile(source)
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (manifest.format !== 1 || manifest.source_sha256 !== createHash('sha256').update(raw).digest('hex')) throw new Error('Snapshot fingerprint mismatch')
  const result = applyEditorialCopy(JSON.parse(raw), manifest.patches)
  // Exclusive creation also refuses existing destinations and symbolic links.
  await writeFile(destination, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  return { rows: result.length, changed: manifest.patches.length, destination }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [source, manifest, destination] = process.argv.slice(2)
  if (!source || !manifest || !destination) throw new Error('Usage: node scripts/apply-editorial-copy.mjs <snapshot.json> <decisions.json> <new-copy.json>')
  console.log(JSON.stringify(await writeEditorialCopy(source, manifest, destination)))
}
