import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { protectJsonPost, rateLimitRequest } from '@/lib/rateLimit'
import { generateAndStoreCardAudio } from '@/lib/cardAudio'
import {
  synthesizeSpeechToBuffer,
  TTS_DEFAULT_VOICE,
  TtsTextSchema,
  TtsVoiceSchema,
  parseTtsVoice,
  TtsError,
} from '@/lib/tts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CardAudioSchema = z.object({
  cardId: z.string().uuid(),
  // Legacy admin callers still send text. It must match the canonical card.
  text: TtsTextSchema.optional(),
  voice: TtsVoiceSchema.optional().default(TTS_DEFAULT_VOICE),
})

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new NextResponse('Não autenticado', { status: 401 })
    }

    const limited = rateLimitRequest(req, { keyPrefix: `api:tts:get:${user.id}`, limit: 90, windowMs: 60_000 })
    if (limited) return limited

    const url = new URL(req.url)
    const text = TtsTextSchema.safeParse(url.searchParams.get('text'))
    const voice = parseTtsVoice(url.searchParams.get('voice'))

    if (!text.success) {
      return new NextResponse(text.error.issues[0]?.message || 'Texto inválido', { status: 400 })
    }

    const audioBuffer = await synthesizeSpeechToBuffer(text.data, voice, 'kivora-tts')

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      }
    })
  } catch (err: unknown) {
    console.error('TTS GET Error:', err instanceof TtsError ? err.code : 'unexpected')
    return new NextResponse('Não foi possível preparar o áudio. Tente novamente.', { status: err instanceof TtsError ? 503 : 500 })
  }
}

export async function POST(req: Request) {
  const protectionResponse = protectJsonPost(req, {
    keyPrefix: 'api:tts',
    limit: 30,
    windowMs: 60_000,
  })
  if (protectionResponse) return protectionResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const parsed = CardAudioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Entrada inválida' }, { status: 400 })
    }

    const { cardId, text, voice } = parsed.data
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id,pack_id,english_phrase,audio_url')
      .eq('id', cardId)
      .maybeSingle()
    if (cardError) {
      return NextResponse.json({ error: 'Não foi possível consultar o card.' }, { status: 500 })
    }
    if (!card) {
      return NextResponse.json({ error: 'Card não encontrado.' }, { status: 404 })
    }

    const [{ data: profile }, { data: pack }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('packs').select('owner_id,is_public').eq('id', card.pack_id).maybeSingle(),
    ])
    const isAdmin = profile?.role === 'admin'
    const ownsPrivatePack = pack?.owner_id === user.id && pack?.is_public === false
    if (!isAdmin && !ownsPrivatePack) {
      return NextResponse.json({ error: 'Você não pode alterar o áudio deste card.' }, { status: 403 })
    }
    if (text !== undefined && text !== card.english_phrase.trim()) {
      return NextResponse.json({ error: 'A frase mudou. Atualize o card antes de gerar o áudio.' }, { status: 409 })
    }

    // Storage may require service credentials, while card updates deliberately
    // retain the authenticated client's RLS (including ownership rechecks).
    const storageClient = createAdminClient() ?? supabase
    const result = await generateAndStoreCardAudio({
      supabase: { storage: storageClient.storage, from: supabase.from.bind(supabase) },
      card,
      voice,
      force: true,
    })
    return NextResponse.json({ success: true, audio_url: result.audioUrl, reused: result.reused })
  } catch (err: unknown) {
    console.error('TTS Route Error:', err instanceof TtsError ? err.code : 'unexpected')
    return NextResponse.json(
      { error: 'Não foi possível preparar o áudio. Tente novamente.' },
      { status: err instanceof TtsError ? (err.code === 'card_changed' ? 409 : 503) : 500 },
    )
  }
}
