import type { SupabaseClient } from '@supabase/supabase-js'

type SessionInput = { id?: string; user_id: string; assignment_id: string; correct_answers: number; wrong_answers: number; max_streak: number }
/** A stable session UUID makes a retry after a lost HTTP response safe. */
export async function saveGameSessionRecord(db: SupabaseClient, input: SessionInput) {
  const { data, error } = await db.from('game_sessions').insert(input).select('id').single()
  if (!error && data) return { id: data.id as string, existing: false }
  if (error?.code === '23505' && input.id) {
    const previous = await db.from('game_sessions').select('id,assignment_id,correct_answers,wrong_answers,max_streak')
      .eq('id', input.id).eq('user_id', input.user_id).maybeSingle()
    if (!previous.error && previous.data && previous.data.assignment_id === input.assignment_id &&
      previous.data.correct_answers === input.correct_answers && previous.data.wrong_answers === input.wrong_answers && previous.data.max_streak === input.max_streak) {
      return { id: previous.data.id as string, existing: true }
    }
  }
  throw new Error('Não foi possível confirmar o resultado desta sessão.')
}
