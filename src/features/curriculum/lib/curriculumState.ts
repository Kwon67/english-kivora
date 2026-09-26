import 'server-only'

import { isLearnerCefrLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { getCurriculumLevel, type PassedLevelSummary } from './curriculum'

export type CurriculumState = {
  /** Primeiro nível ainda não aprovado na prova final: o teto de tudo que o aluno recebe. */
  currentLevel: LearnerCefrLevel
  passed: Map<LearnerCefrLevel, PassedLevelSummary>
  /** Última reprovação na prova do nível atual — alimenta a espera antes de tentar de novo. */
  lastFailedAt: string | null
}

const EMPTY_STATE: CurriculumState = { currentLevel: 'A1', passed: new Map(), lastFailedAt: null }

/**
 * Lê as aprovações do aluno. Passa pelo service role porque `level_exam_attempts` guarda o
 * gabarito e não tem policy para o cliente — ver a migração 20260925220000.
 *
 * Qualquer falha cai para o A1: errar para baixo custa conteúdo fácil por um dia; errar para cima
 * pularia exatamente a prova que a regra existe para exigir.
 */
export async function getCurriculumState(userId: string): Promise<CurriculumState> {
  const admin = createAdminClient()
  if (!admin) return EMPTY_STATE

  const { data, error } = await admin
    .from('level_exam_attempts')
    .select('level,score,total,passed,submitted_at')
    .eq('user_id', userId)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })

  if (error) {
    logger.error('Failed to load curriculum state', { userId, error })
    return EMPTY_STATE
  }

  const passed = new Map<LearnerCefrLevel, PassedLevelSummary>()
  for (const row of data || []) {
    if (!row.passed || !isLearnerCefrLevel(row.level) || passed.has(row.level)) continue
    passed.set(row.level, { score: row.score ?? 0, total: row.total, passedAt: row.submitted_at ?? '' })
  }

  const currentLevel = getCurriculumLevel(new Set(passed.keys()))
  const lastFailed = (data || []).find((row) => row.level === currentLevel && !row.passed)

  return { currentLevel, passed, lastFailedAt: lastFailed?.submitted_at ?? null }
}
