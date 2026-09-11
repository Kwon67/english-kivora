import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitRequest } from '@/lib/rateLimit'
import { parseTtsVoice, synthesizeSpeechToBuffer, TtsError, TtsPreviewTextSchema } from '@/lib/tts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const DEFAULT_PREVIEW_TEXT = 'Hello! this is a preview of the english voice.'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new NextResponse('Não autenticado', { status: 401 })
    }

    const limited = rateLimitRequest(req, { keyPrefix: `api:tts:preview:${user.id}`, limit: 90, windowMs: 60_000 })
    if (limited) return limited

    const url = new URL(req.url)
    const text = TtsPreviewTextSchema.safeParse(url.searchParams.get('text') || DEFAULT_PREVIEW_TEXT)
    const voice = parseTtsVoice(url.searchParams.get('voice'))

    if (!text.success) {
      return new NextResponse(text.error.issues[0]?.message || 'Texto inválido', { status: 400 })
    }

    const audioBuffer = await synthesizeSpeechToBuffer(text.data, voice, 'kivora-tts-preview')

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      }
    })

  } catch (err) {
    console.error('Preview error:', err instanceof TtsError ? err.code : 'unexpected')
    return new NextResponse('Não foi possível preparar o áudio. Tente novamente.', { status: err instanceof TtsError ? 503 : 500 })
  }
}
