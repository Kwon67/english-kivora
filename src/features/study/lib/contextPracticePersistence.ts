import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CEFR_LEVELS } from '@/features/cefr/lib/cefrLevels'
import { TodayDraftSchema, TODAY_LESSONS } from './todayLesson'
import { TRAVEL_LESSONS } from './travelUnit'

export const ContextAttemptSchema = z.object({ attemptId: z.string().uuid(), level: z.enum(CEFR_LEVELS), draft: TodayDraftSchema })
  .refine(value => (value.draft.lessonId === TODAY_LESSONS[value.level].id || (value.level === 'A2' && TRAVEL_LESSONS.some(lesson => lesson.id === value.draft.lessonId))) && value.draft.choice !== null &&
    value.draft.response.trim().length > 0 && value.draft.revision.trim().length > 0, 'Prática incompleta ou desconhecida.')
export type ContextAttempt = z.infer<typeof ContextAttemptSchema>
export type ContextSaveResult = { status: 'saved' | 'local_only' } | { status: 'error'; message: string; code?: 'conflict' }

export async function persistContextAttempt(db: SupabaseClient, userId: string, input: ContextAttempt): Promise<ContextSaveResult> {
  const parsed = ContextAttemptSchema.safeParse(input)
  if (!parsed.success) return { status: 'error', message: 'Confira a resposta e a reescrita antes de salvar.' }
  const { draft, level, attemptId } = parsed.data
  const payload = { user_id: userId, attempt_id: attemptId, lesson_id: draft.lessonId, level,
    response: draft.response, revision: draft.revision, comprehension_choice: draft.choice, self_checks: draft.checked,
    first_choice: draft.firstChoice, hints_used: draft.hintsUsed, oral_self_report: draft.spoken }
  const { error } = await db.from('context_practice_attempts').insert(payload)
  if (!error) return { status: 'saved' }
  if (error.code === '23505') {
    const { data, error: readError } = await db.from('context_practice_attempts').select('lesson_id,level,response,revision,comprehension_choice,self_checks,first_choice,hints_used,oral_self_report')
      .eq('user_id', userId).eq('attempt_id', attemptId).maybeSingle()
    if (!readError && data && data.lesson_id === payload.lesson_id && data.level === level && data.response === draft.response &&
      data.revision === draft.revision && data.comprehension_choice === draft.choice && JSON.stringify(data.self_checks) === JSON.stringify(draft.checked) &&
      data.first_choice === draft.firstChoice && data.hints_used === draft.hintsUsed && data.oral_self_report === draft.spoken) return { status: 'saved' }
    return { status: 'error', code: 'conflict', message: 'Esta tentativa já tem outra versão salva. Você pode guardar a revisão atual como uma nova tentativa.' }
  }
  return { status: 'error', message: 'Não foi possível confirmar o registro na conta. Seu rascunho está preservado. Tente novamente.' }
}
