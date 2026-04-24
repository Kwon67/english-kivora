import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new NextResponse('Não autenticado', { status: 401 })
    }

    const url = new URL(req.url)
    const text = url.searchParams.get('text') || 'Hello! this is a preview of the english voice.'
    const voice = url.searchParams.get('voice') || 'en-US-AriaNeural'

    const contentType = 'audio/mpeg'

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

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Preview error:', message, err)
    return new NextResponse(`Internal error: ${message}`, { status: 500 })
  }
}
