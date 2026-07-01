'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { setPlacementCefrLevel } from '@/features/cefr/lib/cefrAssessment'
import { LEARNER_CEFR_LEVELS, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import {
  buildCatPool,
  buildCatQuestion,
  isCatAnswerCorrect,
  isManualCatPack,
  type CatPoolCard,
  type CatQuestion,
} from '@/features/onboarding/lib/catPool'
import {
  CAT_LEVELS,
  isStudyExperience,
  type CatLevel,
  type StudyExperience,
} from '@/features/onboarding/lib/catLevels'
import {
  createCatSession,
  estimateCatLevel,
  isCatSessionComplete,
  recordCatAnswer,
  type CatEstimate,
  type CatSessionState,
} from '@/features/onboarding/lib/catScoring'
import {
  ONBOARDING_DAILY_GOALS,
  normalizeOnboardingInterests,
} from '@/features/onboarding/lib/onboardingInterests'
import type { OnboardingLevelSource } from '@/features/onboarding/lib/onboardingStatus'
import {
  pickStarterPack,
  rankStarterPacks,
  type RankedStarterPack,
  type StarterPackRow,
} from '@/features/onboarding/lib/suggestStarterPack'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: true } | { ok: false; error: string }

type StarterPackActionResult =
  | { ok: true; packs: RankedStarterPack[]; recommended: RankedStarterPack | null }
  | { ok: false; error: string }

export type CatQuestionClient = Omit<CatQuestion, 'correctOption'>

type CatQuestionResult =
  | { ok: true; question: CatQuestionClient; session: CatSessionState }
  | { ok: false; error: string }

type CatAnswerActionResult =
  | {
      ok: true
      correct: boolean
      session: CatSessionState
      finished: boolean
      estimate?: CatEstimate
      nextQuestion?: CatQuestionClient
    }
  | { ok: false; error: string }

const PreferencesSchema = z.object({
  interests: z.array(z.string()).max(6),
  dailyGoalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  studyExperience: z
    .union([
      z.literal('less_than_1_year'),
      z.literal('1_3_years'),
      z.literal('more_than_3_years'),
      z.literal(''),
      z.null(),
    ])
    .optional(),
})

const CompleteSchema = z.object({
  packId: z.string().uuid().nullable().optional(),
  assignPack: z.boolean(),
  packAlreadyAssigned: z.boolean().optional(),
})

const AssignStarterPackSchema = z.object({
  packId: z.string().uuid(),
})

const CatSessionSchema = z.object({
  focusLevel: z.enum(CAT_LEVELS),
  position: z.number(),
  stepSize: z.number(),
  answers: z.array(
    z.object({
      cardId: z.string().uuid(),
      packId: z.string().uuid(),
      packLevel: z.enum(CAT_LEVELS),
      correct: z.boolean(),
    })
  ),
  shownCardIds: z.array(z.string().uuid()),
  streakPackLevel: z.enum(CAT_LEVELS).nullable(),
  streakCount: z.number().int().nonnegative(),
  finished: z.boolean(),
  converged: z.boolean(),
})

const PlacementResultSchema = z.object({
  level: z.enum(CAT_LEVELS),
  confidence: z.number().int().min(0).max(100),
  atCeiling: z.boolean(),
})

let cachedCatPool: CatPoolCard[] | null = null
let cachedCatPoolAt = 0
const CAT_POOL_CACHE_MS = 5 * 60 * 1000

async function upsertOnboardingRow(
  userId: string,
  patch: {
    level_source?: OnboardingLevelSource
    placement_confidence?: number | null
    daily_goal_minutes?: number | null
    interests?: string[]
    starter_pack_id?: string | null
    study_experience?: StudyExperience | null
    onboarding_completed_at?: string
  }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('user_onboarding').upsert(
    {
      user_id: userId,
      ...patch,
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('Failed to upsert onboarding row', { userId, error })
    return { ok: false, error: 'Não foi possível salvar seu progresso. Tente novamente.' }
  }

  return { ok: true }
}

function isPlacementResponsesTableMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false
  return error.code === '42P01' || /placement_responses/i.test(error.message || '')
}

async function loadCatPool(): Promise<CatPoolCard[]> {
  if (cachedCatPool && Date.now() - cachedCatPoolAt < CAT_POOL_CACHE_MS) {
    return cachedCatPool
  }

  const supabase = await createClient()
  const [{ data: packs, error: packsError }, { data: cards, error: cardsError }] =
    await Promise.all([
      supabase.from('packs').select('id,name,category,level,is_public'),
      supabase
        .from('cards')
        .select('id,pack_id,english_phrase,portuguese_translation,accepted_translations'),
    ])

  if (packsError || cardsError) {
    console.error('Failed to load CAT pool', { packsError, cardsError })
    return cachedCatPool ?? []
  }

  cachedCatPool = buildCatPool(packs ?? [], cards ?? [])
  cachedCatPoolAt = Date.now()
  return cachedCatPool
}

async function loadManualPublicPacks(): Promise<StarterPackRow[]> {
  const catalog = await loadPublicPacks()
  return catalog.filter((pack) => isManualCatPack(pack))
}

async function loadPublicPacks(): Promise<StarterPackRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('packs')
    .select('id,name,description,level,category,cover_url,is_public')
    .or('is_public.eq.true,is_public.is.null')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load public packs for onboarding', error)
    return []
  }

  return (data || []) as StarterPackRow[]
}

async function resolveLearnerLevel(
  userId: string,
  metadata?: { english_level?: string; english_level_source?: string }
): Promise<LearnerCefrLevel> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_cefr_assessments')
    .select('estimated_level,level_source')
    .eq('user_id', userId)
    .maybeSingle()

  const assessed = data?.estimated_level
  if (assessed && LEARNER_CEFR_LEVELS.includes(assessed as LearnerCefrLevel)) {
    return assessed as LearnerCefrLevel
  }

  if (metadata?.english_level_source === 'manual') {
    const metadataLevel = metadata.english_level
    if (metadataLevel && LEARNER_CEFR_LEVELS.includes(metadataLevel as LearnerCefrLevel)) {
      return metadataLevel as LearnerCefrLevel
    }
  }

  return 'A2'
}

function toClientQuestion(question: CatQuestion): CatQuestionClient {
  const { correctOption: _correctOption, ...clientQuestion } = question
  return clientQuestion
}

async function logPlacementResponse(input: {
  userId: string
  cardId: string
  packId: string
  packLevel: CatLevel
  correct: boolean
  responseTimeMs: number
  questionIndex: number
}): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('placement_responses').insert({
    user_id: input.userId,
    card_id: input.cardId,
    pack_id: input.packId,
    pack_level: input.packLevel,
    correct: input.correct,
    response_time_ms: input.responseTimeMs,
    question_index: input.questionIndex,
  })

  if (error && !isPlacementResponsesTableMissing(error)) {
    console.error('Failed to log placement response', { userId: input.userId, error })
  }
}

export async function getCatQuestion(input: {
  session?: CatSessionState | null
  studyExperience?: StudyExperience | null
}): Promise<CatQuestionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const pool = await loadCatPool()
  if (pool.length < 4) {
    return { ok: false, error: 'Pool de nivelamento indisponível no momento.' }
  }

  const session = input.session ?? createCatSession(input.studyExperience ?? null)
  if (isCatSessionComplete(session)) {
    return { ok: false, error: 'Sessão de teste já finalizada.' }
  }

  const question = buildCatQuestion(
    pool,
    session.focusLevel,
    session.shownCardIds,
    session.answers.length + 1
  )

  if (!question) {
    return { ok: false, error: 'Não há mais frases disponíveis para o teste.' }
  }

  return {
    ok: true,
    question: toClientQuestion(question),
    session,
  }
}

export async function submitCatAnswer(input: {
  cardId: string
  selectedOption: string
  responseTimeMs: number
  session: CatSessionState
}): Promise<CatAnswerActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const parsedSession = CatSessionSchema.safeParse(input.session)
  if (!parsedSession.success) {
    return { ok: false, error: 'Sessão de teste inválida.' }
  }

  const pool = await loadCatPool()
  const card = pool.find((item) => item.id === input.cardId)
  if (!card) {
    return { ok: false, error: 'Frase fora do pool de nivelamento.' }
  }

  const correct = isCatAnswerCorrect(card, input.selectedOption)
  const answerRecord = {
    cardId: card.id,
    packId: card.packId,
    packLevel: card.packLevel,
    correct,
  }

  await logPlacementResponse({
    userId: user.id,
    cardId: card.id,
    packId: card.packId,
    packLevel: card.packLevel,
    correct,
    responseTimeMs: Math.max(0, Math.round(input.responseTimeMs)),
    questionIndex: parsedSession.data.answers.length + 1,
  })

  const nextSession = recordCatAnswer(parsedSession.data, answerRecord)
  const finished = isCatSessionComplete(nextSession)

  if (!finished) {
    const nextQuestion = buildCatQuestion(
      pool,
      nextSession.focusLevel,
      nextSession.shownCardIds,
      nextSession.answers.length + 1
    )

    return {
      ok: true,
      correct,
      session: nextSession,
      finished: false,
      nextQuestion: nextQuestion ? toClientQuestion(nextQuestion) : undefined,
    }
  }

  const estimate = estimateCatLevel(nextSession.answers)

  return {
    ok: true,
    correct,
    session: { ...nextSession, finished: true },
    finished: true,
    estimate,
  }
}

export async function finalizeCatSession(input: {
  session: CatSessionState
  abandoned?: boolean
}): Promise<
  | { ok: true; estimate: CatEstimate; session: CatSessionState }
  | { ok: false; error: string }
> {
  const parsedSession = CatSessionSchema.safeParse(input.session)
  if (!parsedSession.success) {
    return { ok: false, error: 'Sessão de teste inválida.' }
  }

  if (parsedSession.data.answers.length === 0) {
    return { ok: false, error: 'Nenhuma resposta registrada ainda.' }
  }

  const estimate = estimateCatLevel(parsedSession.data.answers, {
    abandoned: Boolean(input.abandoned),
  })

  return {
    ok: true,
    estimate,
    session: { ...parsedSession.data, finished: true },
  }
}

export async function saveOnboardingSkipLevel(): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  return upsertOnboardingRow(user.id, {
    level_source: 'skipped',
    placement_confidence: null,
  })
}

export async function assignOnboardingStarterPack(input: {
  packId: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const validated = AssignStarterPackSchema.safeParse(input)
  if (!validated.success) {
    return { ok: false, error: 'Pack inválido' }
  }

  const catalog = await loadManualPublicPacks()
  const allowed = catalog.some((pack) => pack.id === validated.data.packId)
  if (!allowed) {
    return { ok: false, error: 'Pack sugerido indisponível.' }
  }

  const { selfAssignPackAction } = await import('@/app/member-assign-actions')
  const assignResult = await selfAssignPackAction({
    packId: validated.data.packId,
    gameMode: 'flashcard',
  })

  if (!assignResult.success) {
    return { ok: false, error: assignResult.error }
  }

  const saveResult = await upsertOnboardingRow(user.id, {
    starter_pack_id: validated.data.packId,
  })

  if (!saveResult.ok) {
    return saveResult
  }

  revalidatePath('/home')
  revalidatePath('/study')
  revalidatePath('/explore')
  return { ok: true }
}

export async function saveOnboardingPlacementResult(input: {
  level: CatLevel
  confidence: number
  atCeiling: boolean
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const validated = PlacementResultSchema.safeParse(input)
  if (!validated.success) {
    return { ok: false, error: 'Resultado do teste inválido' }
  }

  await setPlacementCefrLevel(supabase, user.id, validated.data.level, validated.data.confidence, {
    atCeiling: validated.data.atCeiling,
  })

  return upsertOnboardingRow(user.id, {
    level_source: 'placement',
    placement_confidence: validated.data.confidence,
  })
}

export async function saveOnboardingPreferences(input: {
  interests: string[]
  dailyGoalMinutes: (typeof ONBOARDING_DAILY_GOALS)[number]
  studyExperience?: StudyExperience | null
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const validated = PreferencesSchema.safeParse(input)
  if (!validated.success) {
    return { ok: false, error: 'Preferências inválidas' }
  }

  const interests = normalizeOnboardingInterests(validated.data.interests)
  if (interests.length === 0) {
    return { ok: false, error: 'Escolha pelo menos um interesse.' }
  }

  const studyExperience =
    validated.data.studyExperience && isStudyExperience(validated.data.studyExperience)
      ? validated.data.studyExperience
      : null

  return upsertOnboardingRow(user.id, {
    interests,
    daily_goal_minutes: validated.data.dailyGoalMinutes,
    study_experience: studyExperience,
  })
}

export async function getOnboardingStarterPackOptions(input: {
  interests: string[]
}): Promise<StarterPackActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const interests = normalizeOnboardingInterests(input.interests)
  const level = await resolveLearnerLevel(user.id, user.user_metadata)
  const catalog = await loadManualPublicPacks()

  if (catalog.length === 0) {
    return { ok: false, error: 'Nenhum pack público disponível no momento.' }
  }

  const packs = rankStarterPacks(catalog, { level, interests }).slice(0, 3)
  const recommended = pickStarterPack(catalog, { level, interests })

  return {
    ok: true,
    packs,
    recommended,
  }
}

export async function completeOnboardingSetup(input: {
  packId?: string | null
  assignPack: boolean
  packAlreadyAssigned?: boolean
  interests: string[]
  dailyGoalMinutes: (typeof ONBOARDING_DAILY_GOALS)[number]
  studyExperience?: StudyExperience | null
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const validated = CompleteSchema.safeParse({
    packId: input.packId,
    assignPack: input.assignPack,
    packAlreadyAssigned: input.packAlreadyAssigned,
  })
  if (!validated.success) {
    return { ok: false, error: 'Dados inválidos' }
  }

  const preferences = PreferencesSchema.safeParse({
    interests: input.interests,
    dailyGoalMinutes: input.dailyGoalMinutes,
    studyExperience: input.studyExperience ?? null,
  })
  if (!preferences.success) {
    return { ok: false, error: 'Preferências inválidas' }
  }

  const interests = normalizeOnboardingInterests(preferences.data.interests)
  if (interests.length === 0) {
    return { ok: false, error: 'Escolha pelo menos um interesse.' }
  }

  const studyExperience =
    preferences.data.studyExperience && isStudyExperience(preferences.data.studyExperience)
      ? preferences.data.studyExperience
      : null

  let starterPackId: string | null = null

  if (validated.data.packAlreadyAssigned && validated.data.packId) {
    const catalog = await loadManualPublicPacks()
    const allowed = catalog.some((pack) => pack.id === validated.data.packId)
    if (!allowed) {
      return { ok: false, error: 'Pack sugerido indisponível.' }
    }
    starterPackId = validated.data.packId
  } else if (validated.data.assignPack && validated.data.packId) {
    const assignResult = await assignOnboardingStarterPack({ packId: validated.data.packId })
    if (!assignResult.ok) {
      return assignResult
    }
    starterPackId = validated.data.packId
  }

  const saveResult = await upsertOnboardingRow(user.id, {
    interests,
    daily_goal_minutes: preferences.data.dailyGoalMinutes,
    study_experience: studyExperience,
    starter_pack_id: starterPackId,
    onboarding_completed_at: new Date().toISOString(),
  })

  if (!saveResult.ok) {
    return saveResult
  }

  revalidatePath('/home')
  revalidatePath('/onboarding')
  revalidatePath('/explore')
  revalidatePath('/study')
  return { ok: true }
}