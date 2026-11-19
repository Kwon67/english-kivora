import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { migrationQueue } from './queue'
import { openCoordinator } from './coordinator'
import held from '../../audio/reconciliation.json'
import { DatabaseSync } from 'node:sqlite'
import { PRACTICE_UNITS } from '../../src/features/curriculum/lib/practicePath'
import { TRAVEL_LESSONS } from '../../src/features/study/lib/travelUnit'
import { TODAY_LESSONS } from '../../src/features/study/lib/todayLesson'
import { TUTOR_SCENARIOS } from '../../src/features/tutor/lib/scenarios'
import { BLITZ_DIALOGUE_PHRASES } from '../../src/features/blitz/lib/blitzDialogue'
import { A1_PACKS } from '../content/a1'
import { A2_PACKS } from '../content/a2'
import { B1_PACKS } from '../content/b1'
import { PRONUNCIA_PACKS } from '../content/pronuncia'
import { REFORCO_PACKS } from '../content/reforco-a1a2'
import {
  ELEVENLABS_VOICES,
  lessonLines,
  practiceVoice,
  tutorVoice,
  WELCOME_TEXT,
  type AudioVoice,
} from '../../src/lib/audioRoles'
import { clipKey } from './ledger'

const rows: {
  feature: string
  text: string
  voice: AudioVoice
  currentAudio: string
  key: string
  priority: boolean
  estimatedCredits: number
  publishedPath: string | null
  voiceId: string
  state: string
}[] = []
const manifest: Record<string, { path: string }> = JSON.parse(readFileSync('audio/manifest.json', 'utf8'))
const reservations = new Set(held.map((entry) => entry.key))
if (process.env.PGSERVICEFILE && existsSync('output/elevenlabs/campaign.json')) {
  for (const key of openCoordinator().uncertainKeys()) reservations.add(key)
}
if (existsSync('output/elevenlabs/ledger.sqlite')) {
  const db = new DatabaseSync('output/elevenlabs/ledger.sqlite', { readOnly: true })
  for (const row of db.prepare('SELECT key FROM jobs WHERE audio IS NULL OR credits IS NULL').all())
    reservations.add(String(row.key))
  db.close()
}
function add(feature: string, text: string, voice: AudioVoice, currentAudio: string, priority = true) {
  const key = clipKey(text, voice)
  rows.push({
    feature,
    text,
    voice,
    currentAudio,
    key,
    priority,
    publishedPath: manifest[key]?.path ?? null,
    voiceId: ELEVENLABS_VOICES[voice],
    estimatedCredits: Math.ceil(text.length * 0.4),
    state: manifest[key] ? 'published' : reservations.has(key) ? 'reconcile' : 'pending',
  })
}
for (const voice of Object.keys(ELEVENLABS_VOICES) as AudioVoice[])
  add('Boas-vindas · escuta', WELCOME_TEXT, voice, 'Amostra MP3 existente')
for (const lesson of [...TRAVEL_LESSONS, ...Object.values(TODAY_LESSONS)]) {
  for (const line of lessonLines(lesson.id, lesson.text))
    add(lesson.id + ' · contexto', line.text, line.voice, 'Texto')
  add(lesson.id + ' · exemplo', lesson.example, practiceVoice(lesson.id), 'Texto')
  add(lesson.id + ' · shadowing', lesson.shadowing, practiceVoice(lesson.id), 'Síntese local do navegador')
}
for (const unit of PRACTICE_UNITS) {
  const lesson = unit.lesson
  for (const line of lessonLines(lesson.id, lesson.text))
    add('Trilha · ' + lesson.id + ' · contexto', line.text, line.voice, 'Texto', false)
  add('Trilha · ' + lesson.id + ' · exemplo', lesson.example, practiceVoice(lesson.id), 'Texto', false)
  add(
    'Trilha · ' + lesson.id + ' · shadowing',
    lesson.shadowing,
    practiceVoice(lesson.id),
    'Síntese local do navegador',
    false,
  )
  for (const text of [unit.turn, ...unit.turns])
    add('Trilha · ' + lesson.id + ' · réplica', text, 'lauren', 'Texto', false)
  add('Trilha · ' + lesson.id + ' · transferência', unit.transfer.text, 'siren', 'Texto', false)
}
for (const s of TUTOR_SCENARIOS) add('Tutor · ' + s.id, s.initialMessage, tutorVoice(s.id), 'Prévia TTS')
for (const text of BLITZ_DIALOGUE_PHRASES) add('Blitz · diálogo', text, 'lauren', 'Card / prévia TTS', false)
for (const pack of [...PRONUNCIA_PACKS, ...A1_PACKS, ...A2_PACKS, ...B1_PACKS, ...REFORCO_PACKS]) {
  for (const [text] of pack.cards)
    add(
      'Catálogo · ' + pack.name,
      text,
      'lauren',
      'Card / prévia TTS',
      pack === PRONUNCIA_PACKS[0] || pack === A1_PACKS[0],
    )
}
// Optional offline export. Never contact the database or publish private/custom packs.
const snapshot = 'output/learning-evolution/catalog-readonly.json'
mkdirSync('output/elevenlabs', { recursive: true })
if (existsSync(snapshot)) {
  const cards: { is_public: boolean; english_phrase: string; pack_name: string; audio_url: string | null }[] =
    JSON.parse(readFileSync(snapshot, 'utf8'))
  // This local appendix is never an input to the publisher.
  writeFileSync(
    'output/elevenlabs/private-inventory.json',
    JSON.stringify(
      cards
        .filter((c) => !c.is_public)
        .map((c) => ({
          feature: c.pack_name,
          text: c.english_phrase,
          currentAudio: c.audio_url?.split('?')[0] || 'Prévia TTS',
          migration: 'excluded-private',
        })),
      null,
      2,
    ) + '\n',
  )
  for (const card of cards.filter((c) => c.is_public))
    add(
      'Snapshot · ' + card.pack_name,
      card.english_phrase,
      'lauren',
      card.audio_url?.split('?')[0] || 'Prévia TTS',
      false,
    )
}
mkdirSync('output/elevenlabs', { recursive: true })
writeFileSync('output/elevenlabs/inventory.json', JSON.stringify(rows, null, 2) + '\n')
const unique = [...new Map(rows.map((row) => [row.key, row])).values()]
const priority = [...new Map(rows.filter((r) => r.priority).map((r) => [r.key, r])).values()]
const totals = (clips: typeof rows) =>
  clips.filter((r) => r.state === 'pending').reduce((n, r) => n + r.estimatedCredits, 0)
console.log({
  estimatedRemainingCredits: totals(unique),
  pending: unique.filter((r) => r.state === 'pending').length,
  reconcile: unique.filter((r) => r.state === 'reconcile').length,
  references: rows.length,
  unique: unique.length,
  priority: priority.length,
  priorityPending: priority.filter((r) => r.state === 'pending').length,
  estimatedPriorityCredits: priority
    .filter((r) => r.state === 'pending')
    .reduce((n, r) => n + r.estimatedCredits, 0),
})

const queue = migrationQueue(rows)
writeFileSync('output/elevenlabs/queue.json', JSON.stringify(queue, null, 2) + '\n')
console.log(
  'Fila elegível',
  queue.length,
  'pendentes por prioridade',
  Array.from({ length: 5 }, (_, rank) => {
    const items = queue.filter((r) => r.rank === rank && r.state === 'pending')
    return {
      rank,
      clips: items.length,
      estimatedCredits: items.reduce((n, r) => n + Math.ceil(r.text.length * 0.4), 0),
    }
  }),
)

if (existsSync(snapshot)) {
  writeFileSync(
    'audio/queue.json',
    JSON.stringify(
      queue.map(({ key, text, voice, rank, state }) => ({ key, text, voice, rank, state })),
      null,
      2,
    ) + '\n',
  )
}
