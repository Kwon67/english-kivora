import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseTtsVoice, synthesizeSpeechToBuffer, TtsPreviewTextSchema } from '@/lib/tts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_PREVIEW_TEXT = 'Hello! this is a preview of the english voice.'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new NextResponse('Não autenticado', { status: 401 })
    }

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
        'Cache-Control': 'no-cache'
      }
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Preview error:', message, err)
    return new NextResponse('Erro interno no servidor', { status: 500 })
  }
}
