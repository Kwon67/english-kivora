import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { curriculumProgress } from './curriculumDifficulty'

/** All-time completions are needed: a thirty-day window must not erase earlier prerequisites. */
export async function loadCurriculumProgressState(db: SupabaseClient, userId: string, level: LearnerCefrLevel) {
  const { data: packs, error } = await db.from('packs').select('id,name,curriculum_position')
    .eq('is_public', true).is('owner_id', null).eq('level', level).order('curriculum_position').order('id')
  if (error) throw new Error('Não foi possível consultar a sequência de estudo.')
  const completedIds = new Set<string>()
  for (let offset = 0; ; offset += 1000) {
    const result = await db.from('assignments').select('id,pack_id').eq('user_id', userId)
      .like('status', 'completed%').order('id').range(offset, offset + 999)
    if (result.error) throw new Error('Não foi possível consultar as lições concluídas.')
    for (const row of result.data ?? []) if (row.pack_id) completedIds.add(row.pack_id)
    if ((result.data?.length ?? 0) < 1000) break
  }
  const ordered = (packs ?? []).map(p => ({ id: p.id as string, name: p.name as string,
    curriculumPosition: p.curriculum_position as number | null, completed: completedIds.has(p.id) }))
  return { progress: curriculumProgress(ordered), completedIds,
    nextTopic: ordered.find(p => !p.completed)?.name ?? null }
}
