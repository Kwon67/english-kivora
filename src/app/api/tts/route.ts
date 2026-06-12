import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { protectJsonPost } from '@/lib/rateLimit'
import {
  synthesizeSpeechToBuffer,
  TTS_DEFAULT_VOICE,
  TtsTextSchema,
  TtsVoiceSchema,
  parseTtsVoice,
} from '@/lib/tts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CardAudioSchema = z.object({
  cardId: z.string().uuid(),
  text: TtsTextSchema,
  voice: TtsVoiceSchema.optional().default(TTS_DEFAULT_VOICE),
})

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new NextResponse('Não autenticado', { status: 401 })
    }

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
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (err: unknown) {
    console.error('TTS GET Error:', err)
    return new NextResponse('Erro interno no servidor', { status: 500 })
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado: Requer privilégios de administrador' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const parsed = CardAudioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Entrada inválida' }, { status: 400 })
    }

    const { cardId, text, voice } = parsed.data
    const audioBuffer = await synthesizeSpeechToBuffer(text, voice, 'kivora-card-tts')
    const fileId = `${cardId}/${randomUUID()}.mp3`
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('card_audios')
      .upload(fileId, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload do áudio' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('card_audios')
      .getPublicUrl(uploadData.path)

    // Update card with the audio URL
    const { error: updateError } = await supabase
      .from('cards')
      .update({ audio_url: publicUrl })
      .eq('id', cardId)

    if (updateError) {
      console.error('Card update error:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar card com a URL do áudio' }, { status: 500 })
    }

    return NextResponse.json({ success: true, audio_url: publicUrl })
  } catch (err: unknown) {
    console.error('TTS Route Error:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
