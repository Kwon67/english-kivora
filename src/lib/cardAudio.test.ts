import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Database } from '@/types/database.types'

vi.mock('server-only', () => ({}))
vi.mock('./tts', async (importOriginal) => ({
  ...await importOriginal<typeof import('./tts')>(),
  getTtsProviderConfig: () => ({ provider: 'edge' as const }),
  synthesizeSpeechToBuffer: vi.fn(),
}))

import { generateAndStoreCardAudio, generateAndUploadCardAudio, generatePackCardAudio } from './cardAudio'
import { synthesizeSpeechToBuffer, TtsError } from './tts'

const synthesize = vi.mocked(synthesizeSpeechToBuffer)
const card = { id: '5eededa0-fdaa-4d49-ad77-6ac72d1e64ed', english_phrase: 'I can learn English.', audio_url: null }

function client() {
  const bucket = {
    exists: vi.fn().mockResolvedValue({ data: false, error: null }),
    upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
    getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://storage.example/${path}` } })),
  }
  const query = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: card.id }, error: null }),
  }
  const raw = { storage: { from: vi.fn(() => bucket) }, from: vi.fn(() => query) }
  return { bucket, query, raw, supabase: raw as unknown as SupabaseClient<Database> }
}

beforeEach(() => {
  vi.clearAllMocks()
  synthesize.mockResolvedValue(Buffer.from('test mp3'))
})

describe('automatic card audio storage', () => {
  it('uploads draft audio without publishing a card, using immutable content paths', async () => {
    const { supabase, bucket, raw } = client()
    const result = await generateAndUploadCardAudio({ supabase, card })
    expect(result.storagePath).toMatch(new RegExp(`^${card.id}/[a-f0-9]{64}\\.mp3$`))
    expect(result.audioUrl).toBe(`https://storage.example/${result.storagePath}`)
    expect(result.reused).toBe(false)
    expect(bucket.upload).toHaveBeenCalledWith(result.storagePath, expect.any(Buffer), {
      contentType: 'audio/mpeg', cacheControl: '31536000', upsert: false,
    })
    expect(raw.from).not.toHaveBeenCalled()
  })

  it('reuses previously uploaded assets on retries without paying for synthesis', async () => {
    const { supabase, bucket } = client()
    bucket.exists.mockResolvedValue({ data: true, error: null })
    expect(await generateAndUploadCardAudio({ supabase, card })).toMatchObject({ reused: true })
    expect(synthesize).not.toHaveBeenCalled()
    expect(bucket.upload).not.toHaveBeenCalled()
  })

  it('uses distinct content keys when the phrase or voice changes', async () => {
    const { supabase } = client()
    const original = await generateAndUploadCardAudio({ supabase, card })
    const newText = await generateAndUploadCardAudio({ supabase, card: { ...card, english_phrase: 'I can speak English.' } })
    const newVoice = await generateAndUploadCardAudio({ supabase, card, voice: 'en-US-AriaNeural' })
    expect(new Set([original.storagePath, newText.storagePath, newVoice.storagePath]).size).toBe(3)
  })

  it('keeps existing audio unless regeneration is requested', async () => {
    const { supabase, bucket } = client()
    const existing = { ...card, audio_url: 'https://storage.example/legacy.mp3' }
    expect(await generateAndUploadCardAudio({ supabase, card: existing })).toEqual({
      audioUrl: existing.audio_url, storagePath: null, reused: true,
    })
    expect(bucket.exists).not.toHaveBeenCalled()
    expect((await generateAndUploadCardAudio({ supabase, card: existing, force: true })).audioUrl).not.toBe(existing.audio_url)
  })

  it('treats a verified concurrent upload as success, but rejects a missing asset', async () => {
    const { supabase, bucket } = client()
    bucket.exists.mockResolvedValueOnce({ data: false, error: null }).mockResolvedValueOnce({ data: true, error: null })
    bucket.upload.mockResolvedValue({ data: null, error: { status: 400 } })
    expect(await generateAndUploadCardAudio({ supabase, card })).toMatchObject({ reused: true })
    await expect(generateAndUploadCardAudio({ supabase, card })).rejects.toMatchObject({ code: 'storage', retryable: true })
  })

  it('does not pay for synthesis when Storage is unavailable', async () => {
    const { supabase, bucket } = client()
    bucket.exists.mockResolvedValue({ data: false, error: { status: 503 } })
    await expect(generateAndUploadCardAudio({ supabase, card })).rejects.toMatchObject({ code: 'storage' })
    expect(synthesize).not.toHaveBeenCalled()
  })

  it('requires an actual updated row and refuses to attach audio after a phrase changes', async () => {
    const { supabase, query } = client()
    query.maybeSingle.mockResolvedValue({ data: null, error: null })
    await expect(generateAndStoreCardAudio({ supabase, card })).rejects.toMatchObject({ code: 'card_changed' })
    expect(query.eq).toHaveBeenCalledWith('id', card.id)
    expect(query.eq).toHaveBeenCalledWith('english_phrase', card.english_phrase)
  })

  it('completes a batch with bounded concurrency and preserves individual failures', async () => {
    const { supabase, raw } = client()
    let active = 0
    let peak = 0
    synthesize.mockImplementation(async (text) => {
      active++
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active--
      if (text === 'Fail.') throw new TtsError('Provider unavailable.', 'provider', true)
      return Buffer.from('test mp3')
    })
    const cards = Array.from({ length: 8 }, (_, index) => ({
      ...card, id: `5eededa0-fdaa-4d49-ad77-6ac72d1e64e${index}`, english_phrase: index === 2 ? 'Fail.' : `Phrase ${index}.`,
    }))
    const result = await generatePackCardAudio({ supabase, cards, concurrency: 2, persistCard: false })
    expect(peak).toBe(2)
    expect(result).toMatchObject({ generated: 7, reused: 0, failed: 1 })
    expect(result.results[2]).toMatchObject({ cardId: cards[2].id, success: false, retryable: true })
    expect(result.results.map((item) => item.cardId)).toEqual(cards.map((item) => item.id))
    expect(raw.from).not.toHaveBeenCalled()
  })
})
