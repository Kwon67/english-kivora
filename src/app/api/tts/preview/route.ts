import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new NextResponse('Não autenticado', { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new NextResponse('Acesso negado: Requer privilégios de administrador', { status: 403 })
    }

    const url = new URL(req.url)
    const text = url.searchParams.get('text') || 'Hello! this is a preview of the english voice.'
    const voice = url.searchParams.get('voice') || 'en-US-AriaNeural'

    const { EdgeTTS } = await import('node-edge-tts')
    const fs = await import('fs')
    const os = await import('os')
    const path = await import('path')
    
    const tts = new EdgeTTS({ voice })
    const tempFileId = `preview-${Date.now()}.mp3`
    const tempFilePath = path.join(os.tmpdir(), tempFileId)

    await tts.ttsPromise(text, tempFilePath)
    const audioBuffer = fs.readFileSync(tempFilePath)
    fs.unlinkSync(tempFilePath)

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (err) {
    console.error('Preview error:', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}
