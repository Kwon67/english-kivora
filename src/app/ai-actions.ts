'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AI_MODELS, createGroqChatCompletion } from '@/features/ai/lib/groq'
import { buildDeckGenerationPrompt, parseGeneratedCards, type GeneratedCard } from '@/features/ai/lib/deckGeneration'
import { splitPrimaryAndAcceptedTranslations, mergeAcceptedTranslations } from '@/features/cards/lib/cardTranslations'
import { analyzeImportCards } from '@/features/cards/lib/importCards'
import { randomUUID } from 'crypto'
import { synthesizeSpeechToBuffer, TTS_DEFAULT_VOICE, TtsVoiceSchema } from '@/lib/tts'

type ActionFailure = {
  success: false
  error: string
}

type PreviewDeckResult = ActionFailure | {
  success: true
  cards: GeneratedCard[]
}

type SaveDeckResult = ActionFailure | {
  success: true
  packId: string
  cardCount: number
}

type AdminAccess = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
}

function isActionFailure(result: AdminAccess | ActionFailure): result is ActionFailure {
  return 'success' in result && result.success === false
}

function isPackLevelCheckError(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string' &&
      (error as { message: string }).message.includes('packs_level_check')
  )
}

async function getAdminAccess(): Promise<AdminAccess | ActionFailure> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error('Erro ao verificar usuário na action de IA:', userError)
    return { success: false, error: 'Não foi possível confirmar sua sessão. Entre novamente e tente de novo.' }
  }

  if (!user) {
    return { success: false, error: 'Não autenticado.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Erro ao consultar perfil na action de IA:', profileError)
    return { success: false, error: 'Não foi possível validar suas permissões.' }
  }

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Acesso negado: requer privilégios de administrador.' }
  }

  return { supabase, userId: user.id }
}

export async function previewDeckAction(topic: string, count: number = 10, customPrompt: string = ''): Promise<PreviewDeckResult> {
  const cleanTopic = topic.replace(/\s+/g, ' ').trim()
  const cleanPrompt = customPrompt.replace(/\s+/g, ' ').trim()
  const safeCount = Math.min(Math.max(Math.trunc(count) || 10, 1), 50)

  if (!cleanTopic) {
    return { success: false, error: 'Informe um tema para gerar a prévia.' }
  }

  const admin = await getAdminAccess()
  if (isActionFailure(admin)) return admin

  try {
    const prompt = buildDeckGenerationPrompt(cleanTopic, safeCount, cleanPrompt)

    const content = await createGroqChatCompletion({
      model: AI_MODELS.deckGeneration,
      temperature: 0.7,
      jsonMode: true,
      messages: [
        {
          role: 'system',
          content: 'Você é um professor de inglês especialista em criar materiais de estudo para brasileiros. Sempre gere traduções 100% naturais em português brasileiro (pt-BR), nunca literais. Retorne apenas JSON válido.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const cards = parseGeneratedCards(content)

    if (cards.length === 0) {
      return { success: false, error: 'Nenhuma frase válida foi gerada. Tente detalhar melhor o tema.' }
    }

    return { success: true, cards }
  } catch (error) {
    console.error('Erro na geração por IA com Groq:', error)
    return { success: false, error: 'Falha ao gerar o deck. Tente novamente mais tarde.' }
  }
}

export async function saveDeckAction(
  topic: string,
  cards: GeneratedCard[],
  voice: string,
  visibility: 'private' | 'public' = 'public'
): Promise<SaveDeckResult> {
  const cleanTopic = topic.replace(/\s+/g, ' ').trim()
  const importAnalysis = analyzeImportCards(cards)
  const parsedVoice = TtsVoiceSchema.safeParse(voice)
  const selectedVoice = parsedVoice.success ? parsedVoice.data : TTS_DEFAULT_VOICE

  if (!cleanTopic) {
    return { success: false, error: 'Informe um tema antes de salvar o pack.' }
  }

  if (importAnalysis.validCards.length === 0) {
    return { success: false, error: 'Nenhuma frase válida restou para salvar.' }
  }

  const admin = await getAdminAccess()
  if (isActionFailure(admin)) return admin

  const { supabase, userId } = admin

  // 1. Criar o Pack
  const packPayload = {
    name: `IA: ${cleanTopic.substring(0, 30)}${cleanTopic.length > 30 ? '...' : ''}`,
    description: `Deck gerado automaticamente por IA sobre o tema: ${cleanTopic}`,
    level: 'medium',
    is_public: visibility === 'public',
    owner_id: visibility === 'private' ? userId : null,
  }

  let { data: pack, error: packError } = await supabase
    .from('packs')
    .insert(packPayload)
    .select('id')
    .single()

  if (isPackLevelCheckError(packError)) {
    ;({ data: pack, error: packError } = await supabase
      .from('packs')
      .insert({ ...packPayload, level: null })
      .select('id')
      .single())
  }

  if (packError || !pack) {
    console.error('Erro ao criar pack por IA:', packError)
    return { success: false, error: 'Erro ao criar o pack. Verifique as configurações do banco e tente novamente.' }
  }

  // 2. Criar os Cards um por um para gerar o áudio
  for (let i = 0; i < importAnalysis.validCards.length; i++) {
    const card = importAnalysis.validCards[i]
    const parsedPrimary = splitPrimaryAndAcceptedTranslations(card.pt)
    const primaryTranslation = parsedPrimary.primary || card.pt.trim()

    // Inserir card sem áudio primeiro
    const { data: cardData, error: cardError } = await supabase.from('cards').insert({
      pack_id: pack.id,
      english_phrase: card.en,
      portuguese_translation: primaryTranslation,
      accepted_translations: mergeAcceptedTranslations(primaryTranslation, parsedPrimary.accepted),
    }).select('id').single()

    if (cardError) {
      console.error(`Erro ao criar card ${i}:`, cardError)
      await supabase.from('packs').delete().eq('id', pack.id)
      return { success: false, error: 'Erro ao criar os cards do pack. Nenhum pack incompleto foi mantido.' }
    }

    const cardId = cardData.id

    // Gerar e fazer upload do áudio
    try {
      const tempFileId = `${cardId}/${randomUUID()}.mp3`
      const audioBuffer = await synthesizeSpeechToBuffer(card.en, selectedVoice, 'kivora-ai-tts')

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
    user_id: userId,
    pack_id: pack.id,
    game_mode: 'flashcard',
    status: 'pending'
  })

  if (assignmentError) {
    console.error('Erro ao atribuir pack gerado por IA:', assignmentError)
    await supabase.from('packs').delete().eq('id', pack.id)
    return { success: false, error: 'O pack foi criado, mas não pôde ser atribuído. Nenhum pack incompleto foi mantido.' }
  }

  revalidatePath('/home')
  revalidatePath('/admin/packs')
  revalidatePath('/blitz')
  return { success: true, packId: pack.id, cardCount: importAnalysis.validCards.length }
}
