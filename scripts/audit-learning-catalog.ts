/** Offline, exhaustive quality checks over a paginated read-only export. Never mutates a service. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { buildMultipleChoiceOptions } from '../src/features/game/lib/multipleChoiceOptions'
import type { Card } from '../src/types/database.types'

type Row = Card & { level: string; is_public: boolean; pack_name: string }
const input = process.argv[2]
if (!input) throw new Error('Provide the local JSON export path; credentials are never read by this script.')
const rows = JSON.parse(readFileSync(input, 'utf8')) as Row[]
if (!Array.isArray(rows) || new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('Invalid or repeated export rows')
const normalize = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]+/gu, ' ').trim()
const phrases = new Map<string, Row[]>()
const packs = new Map<string, Row[]>()
for (const row of rows) {
  const key = normalize(row.english_phrase)
  phrases.set(key, [...(phrases.get(key) ?? []), row])
  packs.set(row.pack_id, [...(packs.get(row.pack_id) ?? []), row])
}
const results = rows.map(row => {
  const options = buildMultipleChoiceOptions(row, packs.get(row.pack_id) ?? [])
  const flags = []
  if (!row.english_phrase.trim() || !row.portuguese_translation.trim()) flags.push('empty_text')
  const peers = (phrases.get(normalize(row.english_phrase)) ?? []).filter(peer => peer.id !== row.id)
  if (peers.some(peer => peer.is_public === row.is_public)) flags.push(row.is_public ? 'duplicate_within_public_catalog' : 'duplicate_within_private_catalog')
  if (peers.some(peer => peer.is_public !== row.is_public)) flags.push('phrase_shared_across_visibility')
  if (options.filter(option => normalize(option) === normalize(row.portuguese_translation)).length !== 1) flags.push('invalid_option_key')
  if (new Set(options.map(normalize)).size !== options.length) flags.push('duplicate_options')
  if (options.length < 2) flags.push('unscored_fallback_required')
  if (!row.audio_url?.trim()) flags.push('tts_dependent')
  if (!row.accepted_translations?.length) flags.push('translation_variants_not_listed')
  if (/^C[12]$/.test(row.level)) flags.push('advanced_context_requires_editorial_review')
  return { cardId: row.id, level: row.level, public: row.is_public, flags, options: options.length,
    linguisticReview: 'pending', cefrReview: 'pending', provenance: 'not_recorded', skillObjectiveCoverage: 'not_recorded',
    audio: row.audio_url ? 'url_present_unverified' : 'tts_dependent_unverified' }
})

async function main() {
if (process.argv.includes('--verify-audio')) {
  let cursor = 0
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (cursor < rows.length) {
      const i = cursor++, row = rows[i]
      if (!row.audio_url) continue
      try {
        const url = new URL(row.audio_url)
        // Only inspect known public Supabase storage, never arbitrary content-supplied hosts or TTS endpoints.
        if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || !url.pathname.startsWith('/storage/v1/object/public/')) {
          results[i].audio = 'url_requires_manual_verification'; continue
        }
        const response = await fetch(url, { method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(10000) })
        results[i].audio = response.ok && /audio\//.test(response.headers.get('content-type') ?? '') ? 'http_audio_available_not_playback_tested' : `http_unavailable_${response.status}`
      } catch { results[i].audio = 'network_unverified' }
    }
  }))
}

const aggregate = (items: typeof results) => ({ count: items.length,
  flags: Object.fromEntries([...new Set(items.flatMap(item => item.flags))].map(flag => [flag, items.filter(item => item.flags.includes(flag)).length])),
  audio: Object.fromEntries([...new Set(items.map(item => item.audio))].map(status => [status, items.filter(item => item.audio === status).length])) })
const summary = { exportedRows: rows.length, exportedPacks: packs.size, all: aggregate(results), public: aggregate(results.filter(row => row.public)),
  levels: Object.fromEntries(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => [level, aggregate(results.filter(row => row.public && row.level === level))])),
  limitations: ['Automated checks covered every exported card; linguistic accuracy and CEFR classification remain pending for every item.', 'HEAD availability does not prove decoding or playback.', 'TTS was not invoked.', 'No license or objective provenance is recorded in the source schema.'] }
mkdirSync('output/learning-evolution', { recursive: true })
writeFileSync('output/learning-evolution/catalog-audit.json', JSON.stringify({ summary, cards: results }, null, 2))
console.log(JSON.stringify(summary, null, 2))

}
void main()
