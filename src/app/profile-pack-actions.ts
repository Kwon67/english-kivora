'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AI_MODELS, createGroqChatCompletion } from '@/features/ai/lib/groq'
import {
  buildDeckGenerationPrompt,
  parseGeneratedCards,
  type GeneratedCard,
} from '@/features/ai/lib/deckGeneration'
import {
  mergeAcceptedTranslations,
  splitPrimaryAndAcceptedTranslations,
} from '@/features/cards/lib/cardTranslations'
import { analyzeImportCards } from '@/features/cards/lib/importCards'
import { isRateLimited } from '@/features/security/lib/security'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAppDateString } from '@/lib/timezone'
import { parseTtsVoice, synthesizeSpeechToBuffer, TTS_DEFAULT_VOICE } from '@/lib/tts'

type ActionFailure = {
  success: false
  error: string
}

type UserAccess = {
  userId: string
  adminSupabase: NonNullable<ReturnType<typeof createAdminClient>>
}

type UserPackSuccess = {
  success: true
  packId: string
  cardCount: number
}

type PreviewUserDeckResult = ActionFailure | {
  success: true
  cards: GeneratedCard[]
}

const RawCardSchema = z.object({
  en: z.string().min(1).max(200),
  pt: z.string().min(1).max(240),
})

const UserCardsSchema = z.array(RawCardSchema).min(1).max(50)

const FolderNameSchema = z
  .string()
  .trim()
  .min(1, 'Digite um nome para a pasta.')
  .max(60, 'O nome da pasta deve ter no máximo 60 caracteres.')

const ManualPackSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres').max(80, 'Nome muito longo'),
  description: z.string().trim().max(280, 'Descrição muito longa').optional(),
  cards: UserCardsSchema,
  voice: z.string().optional(),
  folderName: FolderNameSchema.optional().nullable(),
})

const AppendCardsSchema = z.object({
  packId: z.string().uuid('Pack inválido'),
  cards: UserCardsSchema,
  voice: z.string().optional(),
})

function isActionFailure(result: UserAccess | ActionFailure): result is ActionFailure {
  return 'success' in result && result.success === false
}

async function getUserAccess(): Promise<UserAccess | ActionFailure> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error('Erro ao confirmar usuário para pack próprio:', userError)
    return { success: false, error: 'Não foi possível confirmar sua sessão. Entre novamente e tente de novo.' }
  }

  if (!user) {
    return { success: false, error: 'Não autenticado.' }
  }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return { success: false, error: 'Admin client indisponível.' }
  }

  return { userId: user.id, adminSupabase }
}

function getPackNameFromTopic(topic: string) {
  return `Meu pack: ${topic.substring(0, 48)}${topic.length > 48 ? '...' : ''}`
}

function revalidateUserPackPaths() {
  revalidatePath('/profile')
  revalidatePath('/home')
  revalidatePath('/study')
  revalidatePath('/review')
  revalidatePath('/blitz')
}

async function insertCardsWithAudio(
  adminSupabase: UserAccess['adminSupabase'],
  packId: string,
  cards: GeneratedCard[],
  voice = TTS_DEFAULT_VOICE
) {
  const selectedVoice = parseTtsVoice(voice)
  let insertedCount = 0

  for (const card of cards) {
    const parsedPrimary = splitPrimaryAndAcceptedTranslations(card.pt)
    const primaryTranslation = parsedPrimary.primary || card.pt.trim()

    const { data: cardData, error: cardError } = await adminSupabase
      .from('cards')
      .insert({
        pack_id: packId,
        english_phrase: card.en,
        portuguese_translation: primaryTranslation,
        accepted_translations: mergeAcceptedTranslations(primaryTranslation, parsedPrimary.accepted),
      })
      .select('id')
      .single()

    if (cardError || !cardData) {
      console.error('Erro ao inserir card de pack próprio:', cardError)
      return {
        success: false as const,
        error: 'Erro ao criar os cards do pack. Tente novamente.',
        insertedCount,
      }
    }

    insertedCount += 1

    try {
      const storagePath = `${cardData.id}/${randomUUID()}.mp3`
      const audioBuffer = await synthesizeSpeechToBuffer(card.en, selectedVoice, 'kivora-user-pack-tts')

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('card_audios')
        .upload(storagePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        })

      if (uploadError || !uploadData) {
        console.error('Erro ao subir áudio de card próprio:', uploadError)
        continue
      }

      const { data: { publicUrl } } = adminSupabase.storage
        .from('card_audios')
        .getPublicUrl(uploadData.path)

      await adminSupabase.from('cards').update({ audio_url: publicUrl }).eq('id', cardData.id)
    } catch (error) {
      console.error('Erro ao gerar áudio de card próprio:', error)
    }
  }

  return { success: true as const, insertedCount }
}

function normalizeUserFolderName(folderName?: string | null) {
  const trimmed = folderName?.trim()
  return trimmed ? trimmed : null
}

async function createOwnedPack(
  adminSupabase: UserAccess['adminSupabase'],
  userId: string,
  name: string,
  description: string | null,
  folderName?: string | null
) {
  const { data: pack, error } = await adminSupabase
    .from('packs')
    .insert({
      name,
      description,
      level: null,
      owner_id: userId,
      is_public: false,
      category: normalizeUserFolderName(folderName),
    })
    .select('id')
    .single()

  if (error || !pack) {
    console.error('Erro ao criar pack próprio:', error)
    return { success: false as const, error: 'Erro ao criar o pack. Tente novamente.' }
  }

  return { success: true as const, packId: pack.id }
}

async function assignOwnedPack(
  adminSupabase: UserAccess['adminSupabase'],
  userId: string,
  packId: string
) {
  const { error } = await adminSupabase.from('assignments').insert({
    user_id: userId,
    pack_id: packId,
    game_mode: 'flashcard',
    status: 'pending',
    assigned_date: getAppDateString(),
    assigned_by: 'self',
  })

  if (error) {
    console.error('Erro ao atribuir pack próprio:', error)
    return { success: false as const, error: 'O pack foi criado, mas não pôde ser adicionado à sua rotina.' }
  }

  return { success: true as const }
}

export async function previewUserDeckAction(
  topic: string,
  count = 10,
  customPrompt = ''
): Promise<PreviewUserDeckResult> {
  const access = await getUserAccess()
  if (isActionFailure(access)) return access

  const cleanTopic = topic.replace(/\s+/g, ' ').trim()
  const cleanPrompt = customPrompt.replace(/\s+/g, ' ').trim()
  const safeCount = Math.min(Math.max(Math.trunc(count) || 10, 1), 30)

  if (!cleanTopic) {
    return { success: false, error: 'Informe um tema para gerar a prévia.' }
  }

  const limited = await isRateLimited('ai_pack_generation', access.userId, 5, 24 * 60 * 60)
  if (limited) {
    return { success: false, error: 'Limite diário de geração por IA atingido. Tente novamente amanhã.' }
  }

  try {
    const content = await createGroqChatCompletion({
      model: AI_MODELS.deckGeneration,
      temperature: 0.7,
      jsonMode: true,
      messages: [
        {
          role: 'system',
          content: 'Você é um professor de inglês especialista em criar materiais de estudo para brasileiros. Sempre gere traduções 100% naturais em português brasileiro (pt-BR), nunca literais. Retorne apenas JSON válido.',
        },
        { role: 'user', content: buildDeckGenerationPrompt(cleanTopic, safeCount, cleanPrompt) },
      ],
    })

    const cards = parseGeneratedCards(content)

    if (cards.length === 0) {
      return { success: false, error: 'Nenhuma frase válida foi gerada. Tente detalhar melhor o tema.' }
    }

    return { success: true, cards }
  } catch (error) {
    console.error('Erro na geração de pack próprio por IA:', error)
    return { success: false, error: 'Falha ao gerar a prévia. Tente novamente mais tarde.' }
  }
}

export async function saveUserDeckAction(
  topic: string,
  cards: GeneratedCard[],
  voice?: string,
  folderName?: string | null
): Promise<ActionFailure | UserPackSuccess> {
  const access = await getUserAccess()
  if (isActionFailure(access)) return access

  const cleanTopic = topic.replace(/\s+/g, ' ').trim()
  if (!cleanTopic) {
    return { success: false, error: 'Informe um tema antes de salvar o pack.' }
  }

  const validatedCards = UserCardsSchema.safeParse(cards)
  if (!validatedCards.success) {
    return { success: false, error: 'Revise os cards antes de salvar.' }
  }

  const importAnalysis = analyzeImportCards(validatedCards.data)
  if (importAnalysis.validCards.length === 0) {
    return { success: false, error: 'Nenhuma frase válida restou para salvar.' }
  }

  const normalizedFolder = folderName ? FolderNameSchema.safeParse(folderName) : null
  if (normalizedFolder && !normalizedFolder.success) {
    return { success: false, error: normalizedFolder.error.issues[0]?.message || 'Nome de pasta inválido.' }
  }

  const packResult = await createOwnedPack(
    access.adminSupabase,
    access.userId,
    getPackNameFromTopic(cleanTopic),
    `Pack privado gerado por IA sobre: ${cleanTopic}`,
    normalizedFolder?.success ? normalizedFolder.data : null
  )
  if (!packResult.success) return packResult

  const cardResult = await insertCardsWithAudio(
    access.adminSupabase,
    packResult.packId,
    importAnalysis.validCards,
    voice
  )

  if (!cardResult.success) {
    await access.adminSupabase.from('packs').delete().eq('id', packResult.packId)
    return { success: false, error: cardResult.error }
  }

  const assignmentResult = await assignOwnedPack(access.adminSupabase, access.userId, packResult.packId)
  if (!assignmentResult.success) {
    await access.adminSupabase.from('packs').delete().eq('id', packResult.packId)
    return assignmentResult
  }

  revalidateUserPackPaths()
  return { success: true, packId: packResult.packId, cardCount: cardResult.insertedCount }
}

export async function createManualUserPackAction(
  input: z.infer<typeof ManualPackSchema>
): Promise<ActionFailure | UserPackSuccess> {
  const access = await getUserAccess()
  if (isActionFailure(access)) return access

  const validated = ManualPackSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || 'Dados inválidos.' }
  }

  const importAnalysis = analyzeImportCards(validated.data.cards)
  if (importAnalysis.validCards.length === 0) {
    return { success: false, error: 'Adicione pelo menos um card válido.' }
  }

  const packResult = await createOwnedPack(
    access.adminSupabase,
    access.userId,
    validated.data.name,
    validated.data.description || null,
    validated.data.folderName
  )
  if (!packResult.success) return packResult

  const cardResult = await insertCardsWithAudio(
    access.adminSupabase,
    packResult.packId,
    importAnalysis.validCards,
    validated.data.voice
  )

  if (!cardResult.success) {
    await access.adminSupabase.from('packs').delete().eq('id', packResult.packId)
    return { success: false, error: cardResult.error }
  }

  const assignmentResult = await assignOwnedPack(access.adminSupabase, access.userId, packResult.packId)
  if (!assignmentResult.success) {
    await access.adminSupabase.from('packs').delete().eq('id', packResult.packId)
    return assignmentResult
  }

  revalidateUserPackPaths()
  return { success: true, packId: packResult.packId, cardCount: cardResult.insertedCount }
}

export async function setUserPacksFolderAction(
  packIds: string[],
  folderName: string | null
): Promise<ActionFailure | { success: true }> {
  const access = await getUserAccess()
  if (isActionFailure(access)) return access

  if (!packIds.length) {
    return { success: false, error: 'Nenhum pack selecionado.' }
  }

  const parsedFolder = folderName === null
    ? { success: true as const, data: null }
    : FolderNameSchema.safeParse(folderName)

  if (!parsedFolder.success) {
    return { success: false, error: parsedFolder.error.issues[0]?.message || 'Nome de pasta inválido.' }
  }

  const { data: ownedPacks, error: fetchError } = await access.adminSupabase
    .from('packs')
    .select('id')
    .in('id', packIds)
    .eq('owner_id', access.userId)

  if (fetchError) {
    console.error('Erro ao validar packs do usuário:', fetchError)
    return { success: false, error: 'Não foi possível validar os packs.' }
  }

  if (!ownedPacks || ownedPacks.length !== packIds.length) {
    return { success: false, error: 'Um ou mais packs não pertencem à sua biblioteca privada.' }
  }

  const { error } = await access.adminSupabase
    .from('packs')
    .update({ category: parsedFolder.data })
    .in('id', packIds)
    .eq('owner_id', access.userId)

  if (error) {
    console.error('Erro ao atualizar pasta do usuário:', error)
    return { success: false, error: 'Não foi possível atualizar a pasta.' }
  }

  revalidateUserPackPaths()
  return { success: true }
}

export async function appendCardsToUserPackAction(
  input: z.infer<typeof AppendCardsSchema>
): Promise<ActionFailure | UserPackSuccess> {
  const access = await getUserAccess()
  if (isActionFailure(access)) return access

  const validated = AppendCardsSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || 'Dados inválidos.' }
  }

  const { data: pack, error: packError } = await access.adminSupabase
    .from('packs')
    .select('id,owner_id,is_public')
    .eq('id', validated.data.packId)
    .single()

  if (packError || !pack || pack.owner_id !== access.userId) {
    return { success: false, error: 'Pack não encontrado ou sem permissão.' }
  }

  if (pack.is_public) {
    return { success: false, error: 'Só é possível adicionar cards a packs privados próprios.' }
  }

  const { data: existingCards } = await access.adminSupabase
    .from('cards')
    .select('english_phrase,portuguese_translation')
    .eq('pack_id', validated.data.packId)

  const existingCardInputs = (existingCards || []).map((card) => ({
    en: card.english_phrase,
    pt: card.portuguese_translation,
  }))

  const importAnalysis = analyzeImportCards(validated.data.cards, existingCardInputs)
  if (importAnalysis.validCards.length === 0) {
    return { success: false, error: 'Nenhum card novo válido foi encontrado.' }
  }

  const cardResult = await insertCardsWithAudio(
    access.adminSupabase,
    validated.data.packId,
    importAnalysis.validCards,
    validated.data.voice
  )

  if (!cardResult.success) {
    return { success: false, error: cardResult.error }
  }

  revalidateUserPackPaths()
  return { success: true, packId: validated.data.packId, cardCount: cardResult.insertedCount }
}

export async function deleteUserPackAction(packId: string): Promise<ActionFailure | { success: true }> {
  const access = await getUserAccess()
  if (isActionFailure(access)) return access

  const parsedPackId = z.string().uuid().safeParse(packId)
  if (!parsedPackId.success) {
    return { success: false, error: 'Pack inválido.' }
  }

  const { data: pack, error: packError } = await access.adminSupabase
    .from('packs')
    .select('id,owner_id')
    .eq('id', parsedPackId.data)
    .single()

  if (packError || !pack || pack.owner_id !== access.userId) {
    return { success: false, error: 'Pack não encontrado ou sem permissão.' }
  }

  const { error } = await access.adminSupabase.from('packs').delete().eq('id', parsedPackId.data)
  if (error) {
    console.error('Erro ao excluir pack próprio:', error)
    return { success: false, error: 'Não foi possível excluir o pack.' }
  }

  revalidateUserPackPaths()
  return { success: true }
}
