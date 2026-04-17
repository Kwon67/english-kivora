import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Wraps raw L16 PCM (from Gemini) in a WAV file header so browsers can play it. */
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8)
  const blockAlign = channels * (bitsPerSample / 8)
  const dataSize = pcmBuffer.length
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)        // PCM
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)
  return Buffer.concat([header, pcmBuffer])
}

export async function POST(req: Request) {
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

    const body = await req.json()
    const { cardId, text, voice } = body

    if (!cardId || !text) {
      return NextResponse.json({ error: 'cardId e text são obrigatórios' }, { status: 400 })
    }

    let audioBuffer: Buffer
    let fileId: string

    if (voice?.startsWith('gemini:')) {
      const voiceName = voice.split(':')[1]
      const { GoogleGenAI } = await import('@google/genai')
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ role: 'user', parts: [{ text }] }],
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

      // Gemini returns raw L16 PCM — parse rate/channels and wrap in WAV
      const rateMatch = mimeType.match(/rate=(\d+)/)
      const chanMatch = mimeType.match(/channels=(\d+)/)
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000
      const channels = chanMatch ? parseInt(chanMatch[1]) : 1

      audioBuffer = pcmToWav(pcm, sampleRate, channels, 16)
      fileId = `${cardId}-${Date.now()}.wav`
    } else {
      // Call Microsoft Edge TTS
      const { EdgeTTS } = await import('node-edge-tts')
      const fs = await import('fs')
      const os = await import('os')
      const path = await import('path')
      
      // Choose a premium neural english voice
      const tts = new EdgeTTS({ voice: voice || 'en-US-AriaNeural' })
      const tempFileId = `${cardId}-${Date.now()}.mp3`
      const tempFilePath = path.join(os.tmpdir(), tempFileId)

      await tts.ttsPromise(text, tempFilePath)
      audioBuffer = fs.readFileSync(tempFilePath)
      fs.unlinkSync(tempFilePath) // Cleanup
      fileId = tempFileId
    }
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('card_audios')
      .upload(fileId, audioBuffer, {
        contentType: voice?.startsWith('gemini:') ? 'audio/wav' : 'audio/mpeg',
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
