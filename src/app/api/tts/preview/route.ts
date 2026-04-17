import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Wraps raw L16 PCM bytes (from Gemini) in a WAV file header.
 * Browsers can play WAV natively; they cannot play raw L16.
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8)
  const blockAlign = channels * (bitsPerSample / 8)
  const dataSize = pcmBuffer.length
  const header = Buffer.alloc(44)

  header.write('RIFF', 0)                          // ChunkID
  header.writeUInt32LE(36 + dataSize, 4)            // ChunkSize
  header.write('WAVE', 8)                           // Format
  header.write('fmt ', 12)                          // Subchunk1ID
  header.writeUInt32LE(16, 16)                      // Subchunk1Size (PCM)
  header.writeUInt16LE(1, 20)                       // AudioFormat (1 = PCM)
  header.writeUInt16LE(channels, 22)                // NumChannels
  header.writeUInt32LE(sampleRate, 24)              // SampleRate
  header.writeUInt32LE(byteRate, 28)                // ByteRate
  header.writeUInt16LE(blockAlign, 32)              // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34)           // BitsPerSample
  header.write('data', 36)                          // Subchunk2ID
  header.writeUInt32LE(dataSize, 40)                // Subchunk2Size

  return Buffer.concat([header, pcmBuffer])
}

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
      
      const mimeType = audioPart.inlineData.mimeType || ''
      const pcm = Buffer.from(audioPart.inlineData.data, 'base64')

      // Gemini returns raw L16 PCM — parse rate/channels from mime type and wrap in WAV
      const rateMatch = mimeType.match(/rate=(\d+)/)
      const chanMatch = mimeType.match(/channels=(\d+)/)
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000
      const channels = chanMatch ? parseInt(chanMatch[1]) : 1

      audioBuffer = pcmToWav(pcm, sampleRate, channels, 16)
      contentType = 'audio/wav'
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
