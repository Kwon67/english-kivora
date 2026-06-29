import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import { getLeaderboardTier } from '@/features/leaderboard/lib/leaderboard'
import { getWeeklyLeaderboard, getUserWeeklyRank } from '@/features/leaderboard/lib/weeklyLeaderboard'
import { Award, Crown, Flame, Medal, Target, Trophy, Users, Zap } from 'lucide-react'
import { LibraryBadge } from '@/features/profile/lib/libraryUi'
import RankingHeader from './RankingHeader'
import { RankingMotionItem, RankingMotionSection } from './RankingMotion'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)] transition-all duration-300'
const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]'
const nestedStatClass =
  'rounded-xl border-2 border-brand-dark bg-bg-primary p-3 shadow-[3px_3px_0_var(--color-brand-dark)]'
const accentBadge =
  'inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
const neutralBadge =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'

const podiumStyles = [
  {
    label: 'Campeão',
    icon: Crown,
    badge: 'border-brand-dark bg-brand-dark text-white',
  },
  {
    label: 'Vice',
    icon: Medal,
    badge: 'border-brand-dark bg-bg-primary text-brand-dark',
  },
  {
    label: 'Top 3',
    icon: Award,
    badge: 'border-brand-dark bg-brand-accent text-brand-dark',
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
    <div className="home-mobile-optimized ranking-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <RankingMotionSection>
          <RankingHeader
            participantCount={leaderboard.length}
            averageAccuracy={averageAccuracy}
            myRank={myRank?.rank ?? null}
          />
        </RankingMotionSection>

        {topThree.length > 0 && (
          <RankingMotionSection className="grid gap-4 lg:grid-cols-3" stagger>
            {topThree.map((entry, index) => {
              const style = podiumStyles[index]
              const PodiumIcon = style.icon
              const isCurrentUser = entry.userId === user.id

              return (
                <RankingMotionItem key={entry.userId}>
                  <article
                    className={`${glassTile} group/podium p-5 hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-brand-dark)]`}
                  >
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-widest ${style.badge}`}>
                          <PodiumIcon className="h-3.5 w-3.5" />
                          {style.label}
                        </span>
                        <p className="mt-4 font-heading text-xl font-bold leading-tight text-brand-dark">
                          {isCurrentUser ? 'Você' : entry.username}
                        </p>
                        <p className="mt-1 font-body text-sm font-semibold text-brand-secondary">
                          {entry.score} pts · {getLeaderboardTier(entry.score)}
                        </p>
                      </div>

                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-brand-accent font-heading text-xl font-bold text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)] transition-transform duration-300 group-hover/podium:scale-105">
                        {getInitial(entry.username)}
                      </div>
                    </div>

                    <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
                      <div className={nestedStatClass}>
                        <p className="font-heading text-lg font-bold text-brand-dark">{entry.sessions}</p>
                        <p className="mt-1 font-body text-[11px] font-semibold text-brand-secondary">sessões</p>
                      </div>
                      <div className={nestedStatClass}>
                        <p className="font-heading text-lg font-bold text-brand-dark">{entry.accuracy}%</p>
                        <p className="mt-1 font-body text-[11px] font-semibold text-brand-secondary">precisão</p>
                      </div>
                      <div className={nestedStatClass}>
                        <p className="font-heading text-lg font-bold text-brand-dark">{entry.bestStreak}</p>
                        <p className="mt-1 font-body text-[11px] font-semibold text-brand-secondary">streak</p>
                      </div>
                    </div>
                  </article>
                </RankingMotionItem>
              )
            })}
          </RankingMotionSection>
        )}

        {leaderboard.length > 0 && (
          <RankingMotionSection className="grid gap-4 sm:grid-cols-3" stagger>
            <RankingMotionItem>
              <article className={`${glassTile} group/stat p-5 hover:-translate-y-1`}>
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div>
                    <LibraryBadge label="Participantes" />
                    <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{leaderboard.length}</p>
                  </div>
                  <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <p className="relative z-10 mt-4 font-body text-sm text-brand-secondary">Na disputa desta semana.</p>
              </article>
            </RankingMotionItem>

            <RankingMotionItem>
              <article className={`${glassTile} group/stat p-5 hover:-translate-y-1`}>
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div>
                    <LibraryBadge label="Precisão média" />
                    <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{averageAccuracy}%</p>
                  </div>
                  <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                    <Target className="h-5 w-5" />
                  </div>
                </div>
                <p className="relative z-10 mt-4 font-body text-sm text-brand-secondary">Média do grupo na janela semanal.</p>
              </article>
            </RankingMotionItem>

            <RankingMotionItem>
              <article className={`${glassTile} group/stat p-5 hover:-translate-y-1`}>
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div>
                    <LibraryBadge label="Líder atual" />
                    <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{leaderScore}</p>
                  </div>
                  <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
                <p className="relative z-10 mt-4 font-body text-sm text-brand-secondary">Pontuação do 1º colocado.</p>
              </article>
            </RankingMotionItem>
          </RankingMotionSection>
        )}

        <RankingMotionSection>
          <section id="classificacao" className={`${glassTile} relative overflow-hidden`}>
            <div className="relative z-10 flex flex-col gap-3 border-b-2 border-brand-dark px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <LibraryBadge label="Classificação" />
                <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">50 melhores da semana</h2>
              </div>
              {myRank && (
                <span className={`${accentBadge} inline-flex w-fit items-center gap-2`}>
                  <Trophy className="h-4 w-4" />
                  Você: #{myRank.rank} · {myRank.score} pts
                </span>
              )}
            </div>

            <div className="relative z-10 divide-y-2 divide-brand-dark/15">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`grid gap-3 px-4 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6 ${
                    entry.userId === user.id
                      ? 'bg-brand-accent/20'
                      : 'hover:bg-bg-primary'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-10 shrink-0 items-center justify-center font-heading text-sm font-bold text-brand-secondary">
                      #{entry.rank}
                    </div>
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-brand-accent font-heading text-base font-bold text-brand-dark shadow-[2px_2px_0_var(--color-brand-dark)]">
                      {getInitial(entry.username)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-heading font-bold text-brand-dark">
                        {entry.userId === user.id ? 'Você' : entry.username}
                      </p>
                      <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">
                        {entry.sessions} sessões · {entry.accuracy}% precisão · {entry.bestStreak} streak
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                    {index === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-brand-dark bg-brand-dark px-2.5 py-1 font-heading text-xs font-bold uppercase tracking-widest text-white">
                        <Flame className="h-3.5 w-3.5 fill-white" />
                        Líder
                      </span>
                    )}
                    <span className={neutralBadge}>{entry.score} pts</span>
                    <span className={accentBadge}>{getLeaderboardTier(entry.score)}</span>
                  </div>
                </div>
              ))}

              {leaderboard.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <div className={`${iconClass} mx-auto h-12 w-12`}>
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-brand-dark">Ranking ainda vazio</h3>
                  <p className="mt-2 font-body text-sm text-brand-secondary">
                    Ainda não há dados suficientes para o ranking semanal.
                  </p>
                </div>
              )}
            </div>
          </section>
        </RankingMotionSection>
      </div>
    </div>
  )
}
