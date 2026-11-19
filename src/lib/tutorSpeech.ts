import 'server-only'
import { createHash } from 'node:crypto'
import { consumeRateLimit } from '@/features/security/lib/security'
import { ELEVENLABS_MODEL, ELEVENLABS_VOICES, type AudioVoice } from './audioRoles'
import { synthesizeElevenLabs } from './elevenlabs'

const SLOT = 320
const cache = new Map<string, { until: number; audio: Buffer }>()
const pending = new Map<string, Promise<Buffer | null>>()

async function readAccount(path: string) {
  const response = await fetch('https://api.elevenlabs.io/v1/' + path, {
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
    signal: AbortSignal.timeout(3000),
    cache: 'no-store',
    redirect: 'error',
  })
  if (!response.ok) throw Error('Tarifa indisponível')
  return response.json()
}

async function persistentSlot(action: string, id: string, limit: number, seconds: number) {
  const result = await consumeRateLimit(action, id, limit, seconds)
  return result.allowed && result.source === 'persistent'
}

async function generate(
  user: string,
  text: string,
  voice: AudioVoice,
  key: string,
  signal: AbortSignal,
  cap: number,
  session: string,
  onChunk?: (chunk: Uint8Array) => void,
) {
  // Charge every attempt against both allowances, even after a timeout/crash.
  // Stable keys and atomic PostgreSQL counters coordinate all serving instances.
  if (!(await persistentSlot('tutor_voice_user', user, 4, 86400))) return null
  if (!(await persistentSlot('tutor_voice_session', user + ':' + session, 3, 3600))) return null
  if (!(await persistentSlot('tutor_voice_clip', key, 1, 86400))) return null
  const [sub, modelList, speaker] = await Promise.all([
    readAccount('user/subscription'),
    readAccount('models'),
    readAccount('voices/' + ELEVENLABS_VOICES[voice]),
  ])
  const until = sub.next_character_count_reset_unix
  const ttl = until - Math.floor(Date.now() / 1000)
  if (
    !Number.isSafeInteger(until) ||
    ttl <= 0 ||
    !Number.isSafeInteger(sub.character_limit) ||
    !Number.isSafeInteger(sub.character_count) ||
    sub.character_count < 0 ||
    speaker.voice_id !== ELEVENLABS_VOICES[voice] ||
    speaker.sharing?.rate !== 1 ||
    !Array.isArray(modelList) ||
    !modelList.some((m) => m.model_id === ELEVENLABS_MODEL && m.token_cost_factor === 1)
  )
    return null
  const slots = Math.floor(Math.min(cap, (sub.character_limit - sub.character_count) * 0.6) / SLOT)
  if (
    signal.aborted ||
    slots < 1 ||
    !(await persistentSlot('tutor_voice_budget', String(until), slots, ttl + 60)) ||
    signal.aborted
  )
    return null
  const result = await synthesizeElevenLabs({ text, voice }, { signal, onChunk })
  if (cache.size >= 8) cache.delete(cache.keys().next().value!)
  cache.set(key, { until: Date.now() + 900000, audio: result.audio })
  return result.audio
}

/** Separate from public previews and static publishing. Only authenticated Tutor playback calls this. */
export async function tutorPremiumAudio(
  user: string,
  text: string,
  voice: AudioVoice,
  signal: AbortSignal,
  session = 'tutor',
  onChunk?: (chunk: Uint8Array) => void,
) {
  const cap = Number(process.env.ELEVENLABS_TUTOR_CREDITS)
  if (
    process.env.ELEVENLABS_TUTOR_ENABLED !== 'true' ||
    !process.env.ELEVENLABS_API_KEY ||
    !Number.isSafeInteger(cap) ||
    cap < SLOT ||
    cap > 20000 ||
    text.length > SLOT ||
    signal.aborted
  )
    return null
  const key = createHash('sha256')
    .update(JSON.stringify([user, ELEVENLABS_MODEL, voice, text]))
    .digest('hex')
  const hit = cache.get(key)
  if (hit && hit.until > Date.now()) return hit.audio
  const running = pending.get(key)
  if (running) return running
  if (pending.size >= 4) return null
  const task = generate(user, text, voice, key, signal, cap, session, onChunk).catch(() => {
    console.warn('Tutor: voz premium indisponível.')
    return null
  })
  pending.set(key, task)
  try {
    return await task
  } finally {
    pending.delete(key)
  }
}
