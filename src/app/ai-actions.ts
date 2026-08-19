'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isCefrLevel, type CefrLevel, type GeneratedCard } from '@/features/ai/lib/deckGeneration'
import { generateFreshCards } from '@/features/ai/lib/generateFreshCards'
import { fetchPhrasesToAvoid } from '@/features/ai/lib/coverageSource'
import { splitByCoverage } from '@/features/ai/lib/phraseCoverage'
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

export async function previewDeckAction(
  topic: string,
  count: number = 10,
  customPrompt: string = '',
  level?: string
): Promise<PreviewDeckResult> {
  const cleanTopic = topic.replace(/\s+/g, ' ').trim()
  const cleanPrompt = customPrompt.replace(/\s+/g, ' ').trim()
  const safeCount = Math.min(Math.max(Math.trunc(count) || 10, 1), 50)
  // Nível inválido vira ausência de nível: gerar sem calibragem é melhor do que gerar errado.
  const safeLevel: CefrLevel | undefined = isCefrLevel(level) ? level : undefined

  if (!cleanTopic) {
    return { success: false, error: 'Informe um tema para gerar a prévia.' }
  }

  const admin = await getAdminAccess()
  if (isActionFailure(admin)) return admin

  try {
    const avoidPhrases = await fetchPhrasesToAvoid(
      admin.supabase as unknown as Parameters<typeof fetchPhrasesToAvoid>[0],
      cleanTopic
    )

    const { cards, discarded } = await generateFreshCards({
      topic: cleanTopic,
      count: safeCount,
      customPrompt: cleanPrompt,
      avoidPhrases,
      level: safeLevel,
    })

    if (cards.length === 0) {
      return {
        success: false,
        error: discarded > 0
          ? 'Tudo que a IA gerou já existe no acervo. Escolha um tema mais específico ou outro ângulo do mesmo assunto.'
          : 'Nenhuma frase válida foi gerada. Tente detalhar melhor o tema.',
      }
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
  visibility: 'private' | 'public' = 'public',
  level?: string
): Promise<SaveDeckResult> {
  const cleanTopic = topic.replace(/\s+/g, ' ').trim()
  const safeLevel: CefrLevel | null = isCefrLevel(level) ? level : null
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

  // Última barreira contra duplicata: a prévia já filtrou, mas os cards chegam do cliente e
  // podem ter sido editados ou vir de uma prévia antiga.
  const jaNoAcervo = await fetchPhrasesToAvoid(
    supabase as unknown as Parameters<typeof fetchPhrasesToAvoid>[0],
    cleanTopic,
    { limit: 5000 }
  )
  const coverage = splitByCoverage(importAnalysis.validCards, jaNoAcervo)

  if (coverage.fresh.length === 0) {
    return {
      success: false,
      error: 'Todas essas frases já existem no acervo. Nada seria acrescentado por este pack.',
    }
  }

  // 1. Criar o Pack
  const packPayload = {
    name: `IA: ${cleanTopic.substring(0, 30)}${cleanTopic.length > 30 ? '...' : ''}`,
    description: `Deck gerado automaticamente por IA sobre o tema: ${cleanTopic}`,
    level: safeLevel,
    is_public: visibility === 'public',
    owner_id: visibility === 'private' ? userId : null,
  }

  const { data: pack, error: packError } = await supabase
    .from('packs')
    .insert(packPayload)
    .select('id')
    .single()

  if (packError || !pack) {
    console.error('Erro ao criar pack por IA:', packError)
    return { success: false, error: 'Erro ao criar o pack. Verifique as configurações do banco e tente novamente.' }
  }

  // 2. Criar os Cards um por um para gerar o áudio
  for (let i = 0; i < coverage.fresh.length; i++) {
    const card = coverage.fresh[i]
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
  //
  // `assigned_by: 'self'` não é decorativo: a coluna tem default 'admin' e a política RLS de
  // INSERT em assignments exige 'self'. Omitir o campo fazia o insert ser recusado, e como o
  // tratamento de erro apaga o pack recém-criado, todo pack salvo por esta tela era destruído
  // logo depois de ter o áudio gerado — com o motivo só no log do servidor. Aqui o admin está
  // atribuindo o pack a si mesmo (user_id = userId), então 'self' é o valor correto.
  const { error: assignmentError } = await supabase.from('assignments').insert({
    user_id: userId,
    pack_id: pack.id,
    game_mode: 'flashcard',
    status: 'pending',
    assigned_by: 'self',
  })

  if (assignmentError) {
    console.error('Erro ao atribuir pack gerado por IA:', assignmentError)
    await supabase.from('packs').delete().eq('id', pack.id)
    return { success: false, error: 'O pack foi criado, mas não pôde ser atribuído. Nenhum pack incompleto foi mantido.' }
  }

  revalidatePath('/home')
  revalidatePath('/admin/packs')
  revalidatePath('/blitz')
  return { success: true, packId: pack.id, cardCount: coverage.fresh.length }
}
