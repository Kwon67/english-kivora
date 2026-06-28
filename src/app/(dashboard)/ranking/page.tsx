import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import { getLeaderboardTier } from '@/features/leaderboard/lib/leaderboard'
import { getWeeklyLeaderboard, getUserWeeklyRank } from '@/features/leaderboard/lib/weeklyLeaderboard'
import { Award, Crown, Flame, Medal, Target, Trophy, Users, Zap } from 'lucide-react'
import RankingHeader from './RankingHeader'
import { pageBgGlowExplore, pageBgGridExplore } from '@/lib/pageShellBackground'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'
const cardSheen =
  'home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]'

const podiumStyles = [
  {
    label: 'Campeão',
    icon: Crown,
    accent: 'border-amber-500/35 dark:border-amber-500/30',
    badge: 'bg-amber-500 text-white',
  },
  {
    label: 'Vice',
    icon: Medal,
    accent: 'border-slate-400/35 dark:border-slate-400/25',
    badge: 'bg-slate-500 text-white',
  },
  {
    label: 'Top 3',
    icon: Award,
    accent: 'border-orange-500/30 dark:border-orange-500/25',
    badge: 'bg-orange-600 text-white',
  },
]

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || 'K'
}

export default async function RankingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const weeklyStart = shiftAppDate(getAppDateString(), -7)
  const windowStartIso = `${weeklyStart}T00:00:00.000Z`
  const leaderboard = await getWeeklyLeaderboard(supabase, windowStartIso, 50)
  const myRank = await getUserWeeklyRank(supabase, windowStartIso, user.id)
  const topThree = leaderboard.slice(0, 3)
  const averageAccuracy = leaderboard.length
    ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.accuracy, 0) / leaderboard.length)
    : 0
  const leaderScore = leaderboard[0]?.score ?? 0

  return (
    <div className="home-mobile-optimized ranking-root relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-12 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#0a0a0a] dark:text-text">
      <div className={pageBgGridExplore} />
      <div className={pageBgGlowExplore} />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <RankingHeader
          participantCount={leaderboard.length}
          averageAccuracy={averageAccuracy}
          myRank={myRank?.rank ?? null}
        />

        {topThree.length > 0 && (
          <section className="grid gap-4 lg:grid-cols-3">
            {topThree.map((entry, index) => {
              const style = podiumStyles[index]
              const PodiumIcon = style.icon
              const isCurrentUser = entry.userId === user.id

              return (
                <article
                  key={entry.userId}
                  className={`${glassTile} scroll-reveal ${style.accent} relative overflow-hidden p-5 hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] group/podium`}
                >
                  <div className={cardSheen} />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-[0.65rem] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${style.badge}`}>
                        <PodiumIcon className="h-3.5 w-3.5" />
                        {style.label}
                      </span>
                      <p className="mt-4 font-montserrat text-xl font-bold leading-tight text-text dark:text-text">
                        {isCurrentUser ? 'Você' : entry.username}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-text-muted dark:text-text-muted">
                        {entry.score} pts · {getLeaderboardTier(entry.score)}
                      </p>
                    </div>

                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-muted/20 bg-card text-xl font-black text-primary shadow-sm transition-transform duration-300 group-hover/podium:scale-105 dark:border-border-accent/15 dark:bg-card">
                      {getInitial(entry.username)}
                    </div>
                  </div>

                  <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card p-3">
                      <p className="text-lg font-black text-text dark:text-text">{entry.sessions}</p>
                      <p className="mt-1 text-[11px] font-semibold text-text-subtle dark:text-text-muted">sessões</p>
                    </div>
                    <div className="rounded-xl border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card p-3">
                      <p className="text-lg font-black text-text dark:text-text">{entry.accuracy}%</p>
                      <p className="mt-1 text-[11px] font-semibold text-text-subtle dark:text-text-muted">precisão</p>
                    </div>
                    <div className="rounded-xl border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card p-3">
                      <p className="text-lg font-black text-text dark:text-text">{entry.bestStreak}</p>
                      <p className="mt-1 text-[11px] font-semibold text-text-subtle dark:text-text-muted">streak</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {leaderboard.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-3">
            <article className={`${glassTile} scroll-fade p-5 relative overflow-hidden group/stat hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary/30`}>
              <div className={cardSheen} />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div>
                  <p className={softKicker}>Participantes</p>
                  <p className="mt-3 text-3xl font-black text-text dark:text-text leading-none">{leaderboard.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12 group-hover/stat:scale-110 transition-transform duration-300">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="relative z-10 mt-4 text-xs font-semibold text-text-muted dark:text-text-muted">Na disputa desta semana.</p>
            </article>

            <article className={`${glassTile} scroll-fade p-5 relative overflow-hidden group/stat hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary/30`}>
              <div className={cardSheen} />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div>
                  <p className={softKicker}>Precisão média</p>
                  <p className="mt-3 text-3xl font-black text-primary leading-none">{averageAccuracy}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12 group-hover/stat:scale-110 transition-transform duration-300">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <p className="relative z-10 mt-4 text-xs font-semibold text-text-muted dark:text-text-muted">Média do grupo na janela semanal.</p>
            </article>

            <article className={`${glassTile} scroll-fade p-5 relative overflow-hidden group/stat hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary/30`}>
              <div className={cardSheen} />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div>
                  <p className={softKicker}>Líder atual</p>
                  <p className="mt-3 text-3xl font-black text-[var(--color-accent)] leading-none">{leaderScore}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12 group-hover/stat:scale-110 transition-transform duration-300">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <p className="relative z-10 mt-4 text-xs font-semibold text-text-muted dark:text-text-muted">Pontuação do 1º colocado.</p>
            </article>
          </section>
        )}

        <section id="classificacao" className={`${glassTile} relative overflow-hidden`}>
          <div className={cardSheen} />
          <div className="relative z-10 flex flex-col gap-3 border-b border-border-muted/20 dark:border-border-accent/15 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className={softKicker}>Classificação</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">50 melhores da semana</h2>
            </div>
            {myRank && (
              <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 dark:bg-primary/10 px-3 py-2 text-sm font-black text-primary">
                <Trophy className="h-4 w-4" />
                Você: #{myRank.rank} · {myRank.score} pts
              </span>
            )}
          </div>

          <div className="relative z-10 divide-y divide-border-muted/20 dark:divide-border-accent/15">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`scroll-fade grid gap-3 px-4 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6 ${
                  entry.userId === user.id
                    ? 'bg-primary/8 dark:bg-primary/10'
                    : 'hover:bg-surface-container-low dark:hover:bg-card/60'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-10 shrink-0 items-center justify-center text-sm font-black text-text-muted dark:text-text-muted">
                    #{entry.rank}
                  </div>
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-muted/20 bg-card text-base font-black text-primary dark:border-border-accent/15 dark:bg-card">
                    {getInitial(entry.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-text dark:text-text">
                      {entry.userId === user.id ? 'Você' : entry.username}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-text-muted dark:text-text-muted">
                      {entry.sessions} sessões · {entry.accuracy}% precisão · {entry.bestStreak} streak
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                  {index === 0 && (
                    <span className="inline-flex items-center gap-1 rounded-[0.65rem] bg-amber-500 px-2.5 py-1 text-xs font-black text-white">
                      <Flame className="h-3.5 w-3.5 fill-white" />
                      Líder
                    </span>
                  )}
                  <span className="inline-flex rounded-[0.65rem] border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card px-3 py-1.5 text-xs font-black text-primary">
                    {entry.score} pts
                  </span>
                  <span className="inline-flex rounded-[0.65rem] border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card px-3 py-1.5 text-xs font-bold text-text-muted dark:text-text-muted">
                    {getLeaderboardTier(entry.score)}
                  </span>
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-montserrat text-lg font-bold text-text dark:text-text">Ranking ainda vazio</h3>
                <p className="mt-2 text-sm text-text-muted dark:text-text-muted">
                  Ainda não há dados suficientes para o ranking semanal.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
