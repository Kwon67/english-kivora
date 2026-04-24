import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import { getLeaderboardTier } from '@/lib/leaderboard'
import { getWeeklyLeaderboard } from '@/lib/weeklyLeaderboard'
import { Flame } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RankingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const weeklyStart = shiftAppDate(getAppDateString(), -7)
  const leaderboard = await getWeeklyLeaderboard(supabase, `${weeklyStart}T00:00:00.000Z`)
  const myRank = leaderboard.find((entry) => entry.userId === user.id)

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {myRank && (
        <section className="grid gap-4 sm:grid-cols-2">
          <article className="stitch-panel p-5">
            <p className="section-kicker">Seu ranking</p>
            <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">#{myRank.rank}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Posição atual na semana</p>
          </article>
          <article className="stitch-panel p-5">
            <p className="section-kicker">Seus pontos</p>
            <p className="mt-4 text-3xl font-extrabold text-[var(--color-primary)]">{myRank.score}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Focus points acumulados</p>
          </article>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Leaderboard</p>
            <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">Elite da Semana</h1>
          </div>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">Últimos 7 dias</span>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className={`relative overflow-hidden flex flex-col gap-3 px-6 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                index === 0
                  ? 'bg-gradient-to-r from-orange-500/10 via-red-500/5 to-transparent border-l-4 border-orange-500'
                  : entry.userId === user.id
                  ? 'bg-[var(--color-primary-light)]'
                  : 'hover:bg-[var(--color-surface-container-lowest)]'
              }`}
            >
              {index === 0 && (
                <div 
                  className="absolute inset-0 z-0 pointer-events-none opacity-30 mix-blend-color-burn" 
                  style={{
                    backgroundImage: 'radial-gradient(circle at 10% 50%, rgba(255,165,0,0.4) 0%, transparent 50%), radial-gradient(circle at 90% 50%, rgba(255,69,0,0.2) 0%, transparent 40%)'
                  }} 
                />
              )}
              <div className="relative z-10 flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full font-bold ${
                  index === 0 
                    ? 'bg-gradient-to-br from-orange-400 to-red-600 text-white shadow-md shadow-orange-500/30' 
                    : 'bg-[var(--color-surface-container)] text-[var(--color-text)]'
                }`}>
                  {index === 0 ? <Flame className="h-5 w-5 fill-white" /> : `#${entry.rank}`}
                </div>
                <div>
                  <p className={`font-semibold ${index === 0 ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
                    {entry.userId === user.id ? 'Você' : entry.username}
                  </p>
                  <p className={`mt-1 text-sm ${index === 0 ? 'text-red-500/80' : 'text-[var(--color-text-muted)]'}`}>
                    {entry.sessions} sessões · {entry.accuracy}% precisão
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  index === 0 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                }`}>
                  {entry.score} pts
                </span>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  index === 0 
                    ? 'border-orange-500/30 bg-orange-500/10 text-orange-500' 
                    : 'border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] text-[var(--color-text-muted)]'
                }`}>
                  {getLeaderboardTier(entry.score)}
                </span>
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
