import { normalizePackLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import type { SupabaseClient } from '@supabase/supabase-js'

export type B2LearningPath = {
  completedByLevel: Record<LearnerCefrLevel, number>
  totalPublicByLevel: Record<LearnerCefrLevel, number>
  b2Completed: number
  b2Total: number
  b2Percent: number
  nextMilestone: string
}

const EMPTY_LEVEL_COUNTS: Record<LearnerCefrLevel, number> = {
  A1: 0,
  A2: 0,
  B1: 0,
  B2: 0,
}

export async function getB2LearningPath(
  supabase: SupabaseClient,
  userId: string
): Promise<B2LearningPath> {
  const [{ data: packs }, { data: assignments }] = await Promise.all([
    supabase
      .from('packs')
      .select('id, level')
      .or('is_public.eq.true,is_public.is.null'),
    supabase
      .from('assignments')
      .select('pack_id, status, packs(level)')
      .eq('user_id', userId),
  ])

  const totalPublicByLevel = { ...EMPTY_LEVEL_COUNTS }
  for (const pack of packs || []) {
    const level = normalizePackLevel(pack.level)
    totalPublicByLevel[level] += 1
  }

  const completedPackIds = new Set<string>()
  const completedByLevel = { ...EMPTY_LEVEL_COUNTS }

  for (const assignment of assignments || []) {
    const status = (assignment.status || '').split('|')[0]
    if (status !== 'completed' || !assignment.pack_id) continue
    if (completedPackIds.has(assignment.pack_id)) continue

    completedPackIds.add(assignment.pack_id)
    const packLevel = normalizePackLevel(
      (assignment.packs as { level?: string | null } | null)?.level
    )
    completedByLevel[packLevel] += 1
  }

  const b2Total = Math.max(1, totalPublicByLevel.B2)
  const b2Completed = completedByLevel.B2
  const b2Percent = Math.round((b2Completed / b2Total) * 100)

  let nextMilestone = 'Complete packs B1 para se preparar ao B2.'
  if (completedByLevel.B1 >= Math.min(3, totalPublicByLevel.B1)) {
    nextMilestone =
      b2Completed > 0
        ? `${b2Completed} pack${b2Completed === 1 ? '' : 's'} B2 concluído${b2Completed === 1 ? '' : 's'} — continue a trilha.`
        : 'Próximo passo: comece um pack B2 no Explorar.'
  }

  return {
    completedByLevel,
    totalPublicByLevel,
    b2Completed,
    b2Total,
    b2Percent,
    nextMilestone,
  }
}