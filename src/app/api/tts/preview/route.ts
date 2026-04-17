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

    let audioBuffer: Buffer
    let contentType = 'audio/mpeg'

    if (voice.startsWith('gemini:')) {
      const voiceName = voice.split(':')[1]
      const { GoogleGenAI } = await import('@google/genai')
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: text,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName
              }
            }
          }
        }
      })

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('audio/'))
      if (!audioPart?.inlineData?.data) {
        throw new Error('No audio generated from Gemini')
      }
      
      audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64')
      contentType = audioPart.inlineData.mimeType || 'audio/wav'
    } else {
      const { EdgeTTS } = await import('node-edge-tts')
      const fs = await import('fs')
      const os = await import('os')
      const path = await import('path')
      
      const tts = new EdgeTTS({ voice })
      const tempFileId = `preview-${Date.now()}.mp3`
      const tempFilePath = path.join(os.tmpdir(), tempFileId)

      await tts.ttsPromise(text, tempFilePath)
      audioBuffer = fs.readFileSync(tempFilePath)
      fs.unlinkSync(tempFilePath)
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (err) {
    console.error('Preview error:', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}
