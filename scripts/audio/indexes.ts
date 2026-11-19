import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs'
import { audioPartition } from '../../src/lib/audioPartition'
import { WELCOME_TEXT } from '../../src/lib/audioRoles'

type Recording = { text: string; voice: string; sha256: string }
export function atomic(path: string, data: string | Buffer) {
  const tmp = path + '.' + randomUUID() + '.tmp'
  writeFileSync(tmp, data)
  renameSync(tmp, path)
}
export function writeIndexes(entries: Recording[]) {
  const core: Record<string, string> = {},
    partitions = new Map<string, Record<string, string>>()
  const all = Object.fromEntries(
    entries.map((entry) => [entry.voice + ':' + entry.text.trim().normalize('NFC'), entry.sha256]),
  )
  for (const [key, hash] of Object.entries(all)) {
    if (entries.length <= 48 || key.endsWith(':' + WELCOME_TEXT)) {
      core[key] = hash
      continue
    }
    const id = audioPartition(key)
    const group = partitions.get(id) ?? {}
    group[key] = hash
    partitions.set(id, group)
  }
  const shards: Record<string, string> = {}
  for (const [id, group] of partitions) {
    const data = JSON.stringify(group)
    const digest = createHash('sha256').update(data).digest('hex')
    mkdirSync('public/audio/kivora/index', { recursive: true })
    const path = 'public/audio/kivora/index/' + digest + '.json'
    if (!existsSync(path)) atomic(path, data)
    shards[id] = digest
  }
  atomic('src/lib/staticAudioIndex.json', JSON.stringify(all, null, 2) + '\n')
  atomic('src/lib/audioCatalog.json', JSON.stringify({ core, shards }) + '\n')
}
