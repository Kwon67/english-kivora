import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StudyEvidence } from './studyQuality'

/** Key data only, fully paginated: PostgREST's 1,000-row default must not silently truncate a heatmap. */
export async function loadStudyEvidence(db: SupabaseClient, userId: string, since: string): Promise<StudyEvidence[]> {
  const evidence: StudyEvidence[] = []
  for (let offset = 0; ; offset += 1000) {
    const result = await db.from('game_sessions').select('id,completed_at,correct_answers,wrong_answers,assignments(game_mode)')
      .eq('user_id', userId).gte('completed_at', since).order('completed_at').order('id').range(offset, offset + 999)
    if (result.error) throw new Error('Não foi possível carregar o histórico de partidas.')
    const rows = (result.data ?? []) as unknown as Array<{ completed_at: string; correct_answers: number; wrong_answers: number; assignments: { game_mode: string } | null }>
    for (const row of rows) evidence.push({ at: row.completed_at, mode: row.assignments?.game_mode ?? '', correct: row.correct_answers, wrong: row.wrong_answers, selfRated: row.assignments?.game_mode === 'flashcard' })
    if (rows.length < 1000) break
  }
  for (let offset = 0; ; offset += 1000) {
    const result = await db.from('study_review_events').select('id,reviewed_at,mode,outcome,quality')
      .eq('user_id', userId).gte('reviewed_at', since).order('reviewed_at').order('id').range(offset, offset + 999)
    if (result.error) throw new Error('Não foi possível carregar o histórico de revisões.')
    const rows = result.data ?? []
    for (const row of rows) {
      const objective = Boolean(row.mode && row.outcome)
      const correct = objective ? row.outcome !== 'wrong' : row.quality >= 3
      evidence.push({ at: row.reviewed_at, mode: row.mode ?? 'srs', correct: correct ? 1 : 0, wrong: correct ? 0 : 1, selfRated: !objective })
    }
    if (rows.length < 1000) break
  }
  return evidence
}
