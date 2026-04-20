import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
