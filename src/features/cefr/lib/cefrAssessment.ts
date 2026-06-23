import {
  estimateUserLevel,
  mergeLevelScores,
  type LevelScores,
} from '@/features/cefr/lib/estimateUserLevel'
import {
  getCefrLevelLabel,
  isLearnerCefrLevel,
  normalizePackLevel,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'
import type { SupabaseClient } from '@supabase/supabase-js'

type AssessmentRow = {
  user_id: string
  estimated_level: LearnerCefrLevel | null
  confidence: number
  total_interactions: number
  level_scores: LevelScores
  level_source: 'auto' | 'manual'
  assessed_at: string | null
  previous_level: LearnerCefrLevel | null
  level_changed_at: string | null
}

export type UserCefrProfile = {
  level: LearnerCefrLevel | null
  levelName: string
  confidence: number
  totalInteractions: number
  assessing: boolean
  nextLevel: LearnerCefrLevel | null
  progressToNext: number | null
  source: 'auto' | 'manual' | 'metadata'
}

function parseLevelScores(value: unknown): LevelScores {
  if (!value || typeof value !== 'object') return {}
  return value as LevelScores
}

function isAssessmentTableMissing(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === '42P01' ||
    /user_cefr_assessments/i.test(error.message || '')
  )
}

export async function getPackCefrLevel(
  supabase: SupabaseClient,
  packId: string
): Promise<LearnerCefrLevel> {
  const { data } = await supabase.from('packs').select('level').eq('id', packId).maybeSingle()
  return normalizePackLevel(data?.level)
}

export async function getUserCefrProfile(
  supabase: SupabaseClient,
  userId: string,
  metadata?: { english_level?: string; english_level_name?: string; english_level_source?: string }
): Promise<UserCefrProfile> {
  const { data, error } = await supabase
    .from('user_cefr_assessments')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!error && data) {
    const row = data as AssessmentRow
    const estimate = estimateUserLevel(
      parseLevelScores(row.level_scores),
      row.total_interactions
    )

    const level =
      row.level_source === 'manual' && row.estimated_level
        ? row.estimated_level
        : estimate.estimatedLevel ?? row.estimated_level

    return {
      level,
      levelName: getCefrLevelLabel(level),
      confidence: row.level_source === 'manual' ? 100 : estimate.confidence,
      totalInteractions: row.total_interactions,
      assessing: row.level_source === 'manual' ? false : estimate.assessing,
      nextLevel: estimate.nextLevel,
      progressToNext: estimate.progressToNext,
      source: row.level_source,
    }
  }

  if (error && !isAssessmentTableMissing(error)) {
    console.error('Failed to load CEFR assessment', { userId, error })
  }

  const metadataLevel = metadata?.english_level
  if (isLearnerCefrLevel(metadataLevel)) {
    return {
      level: metadataLevel,
      levelName: metadata?.english_level_name || getCefrLevelLabel(metadataLevel),
      confidence: 100,
      totalInteractions: 0,
      assessing: false,
      nextLevel: null,
      progressToNext: null,
      source: 'metadata',
    }
  }

  return {
    level: null,
    levelName: 'Em avaliação',
    confidence: 0,
    totalInteractions: 0,
    assessing: true,
    nextLevel: 'A1',
    progressToNext: 0,
    source: 'auto',
  }
}

async function syncUserMetadataLevel(
  userId: string,
  level: LearnerCefrLevel | null,
  source: 'auto' | 'manual'
) {
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminSupabase = createAdminClient()
    if (!adminSupabase) return

    await adminSupabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        english_level: level,
        english_level_name: level ? getCefrLevelLabel(level) : 'Em avaliação',
        english_level_source: source,
      },
    })
  } catch (error) {
    console.error('Failed to sync CEFR level to user metadata', { userId, error })
  }
}

export async function recordCefrInteraction(
  supabase: SupabaseClient,
  userId: string,
  packId: string,
  input: { correct: number; total?: number }
): Promise<void> {
  const total = Math.max(1, input.total ?? 1)
  const correct = Math.max(0, Math.min(total, input.correct))
  const packLevel = await getPackCefrLevel(supabase, packId)

  const { data: existing, error: loadError } = await supabase
    .from('user_cefr_assessments')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (loadError && isAssessmentTableMissing(loadError)) {
    return
  }

  const currentScores = parseLevelScores(existing?.level_scores)
  const merged = mergeLevelScores(currentScores, packLevel, correct, total)
  const nextTotalInteractions = (existing?.total_interactions ?? 0) + merged.totalInteractions
  const nextScores = merged.scores

  if (existing?.level_source === 'manual') {
    const { error: updateError } = await supabase
      .from('user_cefr_assessments')
      .upsert(
        {
          user_id: userId,
          level_scores: nextScores,
          total_interactions: nextTotalInteractions,
          assessed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (updateError && !isAssessmentTableMissing(updateError)) {
      console.error('Failed to update CEFR stats (manual mode)', updateError)
    }
    return
  }

  const estimate = estimateUserLevel(nextScores, nextTotalInteractions)
  const previousLevel = (existing?.estimated_level as LearnerCefrLevel | null) ?? null
  const levelChanged = estimate.estimatedLevel !== previousLevel

  const payload = {
    user_id: userId,
    estimated_level: estimate.estimatedLevel,
    confidence: estimate.confidence,
    total_interactions: nextTotalInteractions,
    level_scores: nextScores,
    level_source: 'auto' as const,
    assessed_at: new Date().toISOString(),
    previous_level: levelChanged ? previousLevel : existing?.previous_level ?? null,
    level_changed_at: levelChanged ? new Date().toISOString() : existing?.level_changed_at ?? null,
  }

  const { error: upsertError } = await supabase
    .from('user_cefr_assessments')
    .upsert(payload, { onConflict: 'user_id' })

  if (upsertError) {
    if (!isAssessmentTableMissing(upsertError)) {
      console.error('Failed to upsert CEFR assessment', upsertError)
    }
    return
  }

  if (levelChanged) {
    await syncUserMetadataLevel(userId, estimate.estimatedLevel, 'auto')
  }
}

export async function setManualCefrLevel(
  supabase: SupabaseClient,
  userId: string,
  level: LearnerCefrLevel
): Promise<void> {
  const { data: existing } = await supabase
    .from('user_cefr_assessments')
    .select('estimated_level, level_scores, total_interactions')
    .eq('user_id', userId)
    .maybeSingle()

  const { error } = await supabase.from('user_cefr_assessments').upsert(
    {
      user_id: userId,
      estimated_level: level,
      confidence: 100,
      total_interactions: existing?.total_interactions ?? 0,
      level_scores: existing?.level_scores ?? {},
      level_source: 'manual',
      assessed_at: new Date().toISOString(),
      previous_level: (existing?.estimated_level as LearnerCefrLevel | null) ?? null,
      level_changed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error && !isAssessmentTableMissing(error)) {
    console.error('Failed to set manual CEFR level', error)
  }

  await syncUserMetadataLevel(userId, level, 'manual')
}