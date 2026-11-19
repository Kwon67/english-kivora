import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { isCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { TODAY_LESSONS, draftFromSavedAttempt, type TodayDraft } from '@/features/study/lib/todayLesson'
import { TRAVEL_LESSONS } from '@/features/study/lib/travelUnit'
import TodaySession from '@/features/study/components/TodaySession'
import TravelToday from '@/features/study/components/TravelToday'

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ level?: string; unit?: string }> }) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const params = await searchParams
  const profile = await getUserCefrProfile(db, user.id, user.user_metadata)
  const level = isCefrLevel(params.level) ? params.level : isCefrLevel(profile.level) ? profile.level : 'A1'
  const persistenceEnabled = process.env.CONTEXT_PRACTICE_PERSISTENCE_ENABLED === 'true'
  const travel = params.unit === 'travel' || (!params.level && (level === 'A1' || level === 'A2'))
  const lessons = travel ? TRAVEL_LESSONS : [TODAY_LESSONS[level]]
  const drafts: Record<string, TodayDraft> = {}
  if (persistenceEnabled) {
    await Promise.all(lessons.map(async lesson => {
      const { data, error } = await db.from('context_practice_attempts')
        .select('attempt_id,lesson_id,response,revision,comprehension_choice,self_checks,first_choice,hints_used,oral_self_report,completed_at')
        .eq('user_id', user.id).eq('lesson_id', lesson.id).order('completed_at', { ascending: false }).limit(1).maybeSingle()
      if (error) throw new Error('Não foi possível recuperar a prática salva na conta.')
      const draft = data ? draftFromSavedAttempt(data) : null
      if (draft) drafts[lesson.id] = draft
    }))
  }
  if (travel) return <TravelToday userId={user.id} initialDrafts={drafts} persistenceEnabled={persistenceEnabled} />
  return <TodaySession initialDraft={drafts[TODAY_LESSONS[level].id]} persistenceEnabled={persistenceEnabled} key={`${user.id}:${level}`} userId={user.id} level={level} />
}
