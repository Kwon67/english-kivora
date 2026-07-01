'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { setManualCefrLevel } from '@/features/cefr/lib/cefrAssessment'
import { LEARNER_CEFR_LEVELS, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
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
import { AI_MODELS, createGroqChatCompletion } from '@/features/ai/lib/groq'
import {
  buildPlacementAiPrompt,
  parsePlacementAiItem,
} from '@/features/onboarding/lib/placementAi'
import type { PlacementItem } from '@/features/onboarding/lib/placementItems'
import { isRateLimited } from '@/features/security/lib/security'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

type ActionResult = { ok: true } | { ok: false; error: string }

type StarterPackActionResult =
  | { ok: true; packs: RankedStarterPack[]; recommended: RankedStarterPack | null }
  | { ok: false; error: string }

const ManualLevelSchema = z.object({
  level: z.enum(LEARNER_CEFR_LEVELS),
})

const PreferencesSchema = z.object({
  interests: z.array(z.string()).max(6),
  dailyGoalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
})

const CompleteSchema = z.object({
  packId: z.string().uuid().nullable().optional(),
  assignPack: z.boolean(),
})

async function upsertOnboardingRow(
  userId: string,
  patch: {
    level_source?: OnboardingLevelSource
    placement_confidence?: number | null
    daily_goal_minutes?: number | null
    interests?: string[]
    starter_pack_id?: string | null
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

async function loadPublicPacks(): Promise<StarterPackRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('packs')
    .select('id,name,description,level,category,cover_url')
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
  metadata?: { english_level?: string }
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

  const metadataLevel = metadata?.english_level
  if (metadataLevel && LEARNER_CEFR_LEVELS.includes(metadataLevel as LearnerCefrLevel)) {
    return metadataLevel as LearnerCefrLevel
  }

  return 'A2'
}

const PlacementResultSchema = z.object({
  level: z.enum(LEARNER_CEFR_LEVELS),
  confidence: z.number().int().min(0).max(100),
})

export async function saveOnboardingLevelProgress(input: {
  level: LearnerCefrLevel
  levelSource: Extract<OnboardingLevelSource, 'manual' | 'skipped' | 'placement'>
  placementConfidence?: number | null
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const validated = ManualLevelSchema.safeParse({ level: input.level })
  if (!validated.success) {
    return { ok: false, error: 'Nível inválido' }
  }

  await setManualCefrLevel(supabase, user.id, validated.data.level)

  return upsertOnboardingRow(user.id, {
    level_source: input.levelSource,
    placement_confidence:
      input.levelSource === 'placement' ? (input.placementConfidence ?? null) : null,
  })
}

type PlacementAiResult =
  | { ok: true; item: PlacementItem; aiGenerated: true }
  | { ok: true; item: null; aiGenerated: false }
  | { ok: false; error: string }

export async function generatePlacementAiItem(input: {
  level: LearnerCefrLevel
  avoidPrompts?: string[]
}): Promise<PlacementAiResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  if (!process.env.GROQ_API_KEY) {
    return { ok: true, item: null, aiGenerated: false }
  }

  const limited = await isRateLimited('onboarding_placement_ai', user.id, 6, 3600)
  if (limited) {
    return { ok: true, item: null, aiGenerated: false }
  }

  const validated = ManualLevelSchema.safeParse({ level: input.level })
  if (!validated.success) {
    return { ok: false, error: 'Nível inválido' }
  }

  try {
    const content = await createGroqChatCompletion({
      model: AI_MODELS.placement,
      temperature: 0.35,
      maxTokens: 420,
      jsonMode: true,
      messages: [
        {
          role: 'system',
          content:
            'Você cria itens de nivelamento de inglês para brasileiros. Retorne apenas JSON válido, sem markdown.',
        },
        {
          role: 'user',
          content: buildPlacementAiPrompt(
            validated.data.level,
            (input.avoidPrompts ?? []).slice(0, 12)
          ),
        },
      ],
    })

    const item = parsePlacementAiItem(content, validated.data.level, `ai-${randomUUID()}`)
    if (!item) {
      return { ok: true, item: null, aiGenerated: false }
    }

    return { ok: true, item, aiGenerated: true }
  } catch (error) {
    console.error('Failed to generate placement AI item', { userId: user.id, error })
    return { ok: true, item: null, aiGenerated: false }
  }
}

export async function saveOnboardingPlacementResult(input: {
  level: LearnerCefrLevel
  confidence: number
}): Promise<ActionResult> {
  const validated = PlacementResultSchema.safeParse(input)
  if (!validated.success) {
    return { ok: false, error: 'Resultado do teste inválido' }
  }

  return saveOnboardingLevelProgress({
    level: validated.data.level,
    levelSource: 'placement',
    placementConfidence: validated.data.confidence,
  })
}

export async function saveOnboardingPreferences(input: {
  interests: string[]
  dailyGoalMinutes: (typeof ONBOARDING_DAILY_GOALS)[number]
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

  return upsertOnboardingRow(user.id, {
    interests,
    daily_goal_minutes: validated.data.dailyGoalMinutes,
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
  const catalog = await loadPublicPacks()

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
  interests: string[]
  dailyGoalMinutes: (typeof ONBOARDING_DAILY_GOALS)[number]
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
  })
  if (!validated.success) {
    return { ok: false, error: 'Dados inválidos' }
  }

  const preferences = PreferencesSchema.safeParse({
    interests: input.interests,
    dailyGoalMinutes: input.dailyGoalMinutes,
  })
  if (!preferences.success) {
    return { ok: false, error: 'Preferências inválidas' }
  }

  const interests = normalizeOnboardingInterests(preferences.data.interests)
  if (interests.length === 0) {
    return { ok: false, error: 'Escolha pelo menos um interesse.' }
  }

  let starterPackId: string | null = null

  if (validated.data.assignPack && validated.data.packId) {
    const catalog = await loadPublicPacks()
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

    starterPackId = validated.data.packId
  }

  const saveResult = await upsertOnboardingRow(user.id, {
    interests,
    daily_goal_minutes: preferences.data.dailyGoalMinutes,
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

/** @deprecated Use saveOnboardingLevelProgress + completeOnboardingSetup */
export async function completeOnboardingWithLevel(input: {
  level: LearnerCefrLevel
  levelSource: Extract<OnboardingLevelSource, 'manual' | 'skipped'>
}): Promise<ActionResult> {
  const levelResult = await saveOnboardingLevelProgress(input)
  if (!levelResult.ok) return levelResult

  return completeOnboardingSetup({
    assignPack: false,
    interests: ['conversation'],
    dailyGoalMinutes: 10,
    packId: null,
  })
}

/** @deprecated Use saveOnboardingLevelProgress flow */
export async function skipOnboardingLevel(): Promise<ActionResult> {
  return saveOnboardingLevelProgress({ level: 'A2', levelSource: 'skipped' })
}

/** @deprecated Use saveOnboardingLevelProgress flow */
export async function saveManualOnboardingLevel(level: LearnerCefrLevel): Promise<ActionResult> {
  return saveOnboardingLevelProgress({ level, levelSource: 'manual' })
}