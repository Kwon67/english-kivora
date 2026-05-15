'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AI_MODELS, createGroqChatCompletion } from '@/lib/ai/groq'

export async function previewDeckAction(topic: string, count: number = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Acesso negado: Requer privilégios de administrador')

  try {
    const prompt = `Gere um conjunto de ${count} frases em inglês e suas traduções em português focadas no tema: "${topic}".
    Retorne somente um objeto JSON com a chave "cards", contendo um array de objetos com "en" e "pt".
    As frases devem ser naturais, úteis para treino diário e adequadas para estudantes brasileiros.
    Exemplo: {"cards": [{"en": "Hello", "pt": "Olá"}]}`

    const content = await createGroqChatCompletion({
      model: AI_MODELS.deckGeneration,
      temperature: 0.7,
      jsonMode: true,
      messages: [
        {
          role: 'system',
          content: 'Você é um professor de inglês especialista em criar materiais de estudo com saída JSON válida.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const parsed = JSON.parse(content) as { cards?: { en: string; pt: string }[] }
    const cards = parsed.cards || []

    if (cards.length === 0) {
      throw new Error('Nenhum cartão foi gerado.')
    }

    return { success: true, cards }
  } catch (error) {
    console.error('Erro na geração por IA com Groq:', error)
    throw new Error('Falha ao gerar o deck. Tente novamente mais tarde.')
  }
}

export async function saveDeckAction(topic: string, cards: { en: string; pt: string }[], voice: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Acesso negado: Requer privilégios de administrador')

  // 1. Criar o Pack
  const { data: pack, error: packError } = await supabase
    .from('packs')
    .insert({
      name: `IA: ${topic.substring(0, 30)}${topic.length > 30 ? '...' : ''}`,
      description: `Deck gerado automaticamente por IA sobre o tema: ${topic}`,
      level: 'medium'
    })
    .select('id')
    .single()

  if (packError) throw new Error(`Erro ao criar pack: ${packError.message}`)

  // 2. Importar bibliotecas TTS
  const { EdgeTTS } = await import('node-edge-tts')
  const fs = await import('fs')
  const os = await import('os')
  const path = await import('path')

  const tts = new EdgeTTS({ voice: voice || 'en-US-AriaNeural' })

  // 3. Criar os Cards um por um para gerar o áudio
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i]
    
    // Inserir card sem áudio primeiro
    const { data: cardData, error: cardError } = await supabase.from('cards').insert({
      pack_id: pack.id,
      english_phrase: c.en,
      portuguese_translation: c.pt,
      order_index: i
    }).select('id').single()

    if (cardError) {
      console.error(`Erro ao criar card ${i}:`, cardError)
      continue
    }

    const cardId = cardData.id

    // Gerar e fazer upload do áudio
    try {
      const tempFileId = `${cardId}-${Date.now()}.mp3`
      const tempFilePath = path.join(os.tmpdir(), tempFileId)
      
      await tts.ttsPromise(c.en, tempFilePath)
      const audioBuffer = fs.readFileSync(tempFilePath)
      fs.unlinkSync(tempFilePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('card_audios')
        .upload(tempFileId, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        })

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('card_audios')
          .getPublicUrl(uploadData.path)

        await supabase.from('cards').update({ audio_url: publicUrl }).eq('id', cardId)
      } else {
        console.error('Upload error for card', cardId, uploadError)
      }
    } catch (ttsErr) {
      console.error('TTS Generation error for card', cardId, ttsErr)
    }
  }

  // 4. Criar a atribuição (Assignment) para o usuário
  const { error: assignmentError } = await supabase.from('assignments').insert({
    user_id: user.id,
    pack_id: pack.id,
    game_mode: 'flashcard',
    status: 'pending'
  })

  if (assignmentError) throw new Error(`Erro ao atribuir lição: ${assignmentError.message}`)

  revalidatePath('/home')
  return { success: true, packId: pack.id }
}
