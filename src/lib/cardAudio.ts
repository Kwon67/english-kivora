import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import type { Database } from '@/types/database.types'
import {
  getTtsProviderConfig,
  synthesizeSpeechToBuffer,
  TTS_DEFAULT_VOICE,
  TtsError,
  TtsTextSchema,
  TtsVoiceSchema,
  ttsContentKey,
} from './tts'

type AudioClient = Pick<SupabaseClient<Database>, 'storage' | 'from'>

export type AudioCard = {
  id: string
  english_phrase: string
  audio_url?: string | null
}

export type CardAudioResult = {
  audioUrl: string
  storagePath: string | null
  reused: boolean
}

type CardAudioOptions = {
  /** Supply an authorized server client; this helper is never a public API. */
  supabase: AudioClient
  card: AudioCard
  voice?: string
  /** Re-evaluate existing audio against the requested text and voice. */
  force?: boolean
}

/** Upload audio for a draft card before atomically publishing a complete pack. */
export async function generateAndUploadCardAudio({ supabase, card, voice, force = false }: CardAudioOptions): Promise<CardAudioResult> {
  const id = z.string().uuid().parse(card.id)
  const text = TtsTextSchema.parse(card.english_phrase)
  const chosenVoice = TtsVoiceSchema.parse(voice ?? TTS_DEFAULT_VOICE)
  if (card.audio_url && !force) {
    return { audioUrl: card.audio_url, storagePath: null, reused: true }
  }

  const { provider } = getTtsProviderConfig()
  const storagePath = `${id}/${ttsContentKey(text, chosenVoice, provider)}.mp3`
  const bucket = supabase.storage.from('card_audios')
  const { data: { publicUrl } } = bucket.getPublicUrl(storagePath)
  const { data: exists, error: existenceError } = await bucket.exists(storagePath)
  // Storage uses 400/404 for a missing object. Other failures must not trigger
  // repeated paid synthesis when the storage service itself is unavailable.
  if (existenceError && ![400, 404].includes(Number('status' in existenceError ? existenceError.status : NaN))) {
    throw new TtsError('Não foi possível consultar o armazenamento de áudio.', 'storage', true)
  }
  if (exists) return { audioUrl: publicUrl, storagePath, reused: true }

  const buffer = await synthesizeSpeechToBuffer(text, chosenVoice, 'kivora-card-tts')
  const { error: uploadError } = await bucket.upload(storagePath, buffer, {
    contentType: 'audio/mpeg',
    cacheControl: '31536000',
    upsert: false,
  })
  if (uploadError) {
    // Another worker may have completed the exact same deterministic asset.
    // Verify the file exists rather than interpreting every 400 as a conflict.
    const { data: nowExists } = await bucket.exists(storagePath)
    if (!nowExists) throw new TtsError('Não foi possível armazenar o áudio do card.', 'storage', true)
    return { audioUrl: publicUrl, storagePath, reused: true }
  }
  return { audioUrl: publicUrl, storagePath, reused: false }
}

/** Persist only if the card still contains the exact phrase that was spoken. */
export async function generateAndStoreCardAudio(options: CardAudioOptions): Promise<CardAudioResult> {
  const result = await generateAndUploadCardAudio(options)
  if (options.card.audio_url === result.audioUrl) return result
  const { data, error } = await options.supabase
    .from('cards')
    .update({ audio_url: result.audioUrl })
    .eq('id', options.card.id)
    .eq('english_phrase', options.card.english_phrase)
    .select('id')
    .maybeSingle()
  if (error || !data) {
    // Keep the content-addressed asset for retries; deleting here could break
    // another worker that has just published the same audio successfully.
    throw new TtsError('O card mudou ou não está disponível para salvar o áudio.', 'card_changed')
  }
  return result
}

export type PackCardAudioResult =
  | ({ cardId: string; success: true } & CardAudioResult)
  | { cardId: string; success: false; error: string; retryable: boolean }

/** Bounded workers; a transient failure on one card does not lose completed work. */
export async function generatePackCardAudio({
  supabase,
  cards,
  voice,
  concurrency = 3,
  persistCard = true,
}: {
  supabase: AudioClient
  cards: AudioCard[]
  voice?: string
  concurrency?: number
  persistCard?: boolean
}) {
  const results = new Array<PackCardAudioResult>(cards.length)
  const workerCount = Number.isFinite(concurrency) ? Math.max(1, Math.min(4, Math.floor(concurrency))) : 3
  const generate = persistCard ? generateAndStoreCardAudio : generateAndUploadCardAudio
  let next = 0
  async function worker() {
    while (next < cards.length) {
      const index = next++
      const card = cards[index]
      try {
        results[index] = { cardId: card.id, success: true, ...await generate({ supabase, card, voice }) }
      } catch (error) {
        results[index] = {
          cardId: card.id,
          success: false,
          error: error instanceof TtsError ? error.message : 'Não foi possível preparar o áudio deste card.',
          retryable: error instanceof TtsError ? error.retryable : true,
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(workerCount, cards.length) }, () => worker()))
  return {
    results,
    generated: results.filter((result) => result.success && !result.reused).length,
    reused: results.filter((result) => result.success && result.reused).length,
    failed: results.filter((result) => !result.success).length,
  }
}
