import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import { buildWeeklyLeaderboard, getLeaderboardTier } from '@/lib/leaderboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RankingPage() {
  const supabase = await createClient()

  const weeklyStart = shiftAppDate(getAppDateString(), -7)

  const [
    leaderboardMembersResult,
    leaderboardSessionsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id,username,role').order('username'),
    supabase
      .from('game_sessions')
      .select('user_id,correct_answers,wrong_answers,max_streak')
      .gte('completed_at', `${weeklyStart}T00:00:00.000Z`)
      .order('completed_at', { ascending: false }),
  ])

  const leaderboardMembers =
    (leaderboardMembersResult.data || [])
      .filter((member) => member.role !== 'admin')
      .map((member) => ({ id: member.id, username: member.username }))
  const leaderboardSessions =
    (leaderboardSessionsResult.data || []).map((session) => ({
      user_id: session.user_id,
      correct_answers: session.correct_answers,
      wrong_answers: session.wrong_answers,
      max_streak: session.max_streak,
    }))

  const leaderboard = buildWeeklyLeaderboard(leaderboardMembers, leaderboardSessions)

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Leaderboard</p>
            <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">Elite da Semana</h1>
          </div>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">Últimos 7 dias</span>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {leaderboard.map((entry) => (
            <div key={entry.userId} className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-[var(--color-surface-container-lowest)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-container)] font-bold text-[var(--color-text)]">#{entry.rank}</div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">{entry.username}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{entry.sessions} sessões · {entry.accuracy}% precisão</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">{entry.score} pts</span>
                <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">{getLeaderboardTier(entry.score)}</span>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <p className="px-6 py-10 text-center text-[var(--color-text-muted)]">Ainda não há dados suficientes para o ranking semanal.</p>
          )}
        </div>
      </section>
    </div>
  )
}
