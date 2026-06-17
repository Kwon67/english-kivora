import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import { getLeaderboardTier } from '@/features/leaderboard/lib/leaderboard'
import { getWeeklyLeaderboard, getUserWeeklyRank } from '@/features/leaderboard/lib/weeklyLeaderboard'
import { Award, Crown, Flame, Medal, Target, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import EmptyState from '@/components/ui/EmptyState'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const podiumStyles = [
  {
    label: 'Campeão',
    icon: Crown,
    card: 'border-amber-500/30 bg-[linear-gradient(145deg,var(--color-accent-light),var(--color-card))]',
    badge: 'bg-amber-500 text-white',
  },
  {
    label: 'Vice',
    icon: Medal,
    card: 'border-slate-300/50 bg-[linear-gradient(145deg,var(--color-surface-container),var(--color-card))]',
    badge: 'bg-slate-500 text-white',
  },
  {
    label: 'Top 3',
    icon: Award,
    card: 'border-orange-500/25 bg-[linear-gradient(145deg,var(--color-primary-light),var(--color-card))]',
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
    return null
  }

  const weeklyStart = shiftAppDate(getAppDateString(), -7)
  const windowStartIso = `${weeklyStart}T00:00:00.000Z`
  const leaderboard = await getWeeklyLeaderboard(supabase, windowStartIso, 50)
  const myRank = await getUserWeeklyRank(supabase, windowStartIso, user.id)
  const topThree = leaderboard.slice(0, 3)
  const averageAccuracy = leaderboard.length
    ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.accuracy, 0) / leaderboard.length)
    : 0

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-8 animate-fade-in">
      <section className="premium-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="stitch-pill bg-primary-container text-[var(--color-on-primary-container)]">
                Ranking
              </span>
              <span className="section-kicker">Últimos 7 dias</span>
            </div>
            <h1 className="mt-5 max-w-xl text-3xl font-black leading-tight text-text sm:text-4xl">
              Disputa semanal de foco
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
              Pontuação calculada por acertos, precisão, sessões concluídas e sequência máxima. Use como leitura rápida de consistência, não só de volume.
            </p>
          </div>

          <div className="border-t border-border bg-[var(--color-surface-container-low)] lg:border-l lg:border-t-0">
            <div className="px-4 pt-4 sm:px-5 sm:pt-5">
              <div className="overflow-hidden rounded-[1rem] border border-border bg-surface-container-lowest p-4 shadow-[var(--shadow-sm)]">
                <Image
                  src="/images/ranking/undraw-metrics.svg"
                  alt="Ilustração unDraw de análise de métricas"
                  width={800}
                  height={606}
                  unoptimized
                  priority
                  className="mx-auto h-32 w-full max-w-xs object-contain sm:h-36 lg:h-40"
                />
              </div>
            </div>

            <div className="mt-4 grid border-t border-border sm:grid-cols-3">
              <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
                <Users className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-black text-text">{leaderboard.length}</p>
                <p className="mt-1 text-xs font-semibold text-text-muted">participantes</p>
              </div>
              <div className="border-b border-border p-4 sm:border-b-0 sm:border-r">
                <Target className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-black text-text">{averageAccuracy}%</p>
                <p className="mt-1 text-xs font-semibold text-text-muted">precisão média</p>
              </div>
              <div className="p-4">
                <Trophy className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-black text-primary">
                  {myRank ? `#${myRank.rank}` : '-'}
                </p>
                <p className="mt-1 text-xs font-semibold text-text-muted">sua posição</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {topThree.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-3">
          {topThree.map((entry, index) => {
            const style = podiumStyles[index]
            const PodiumIcon = style.icon
            const isCurrentUser = entry.userId === user.id

            return (
              <article
                key={entry.userId}
                className={`premium-card relative overflow-hidden border p-5 ${style.card}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-[0.65rem] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${style.badge}`}>
                      <PodiumIcon className="h-3.5 w-3.5" />
                      {style.label}
                    </span>
                    <Link
                      href={`/profile/${entry.username}`}
                      className="mt-4 block text-xl font-black leading-tight text-text transition-colors hover:text-primary"
                    >
                      {isCurrentUser ? 'Você' : entry.username}
                    </Link>
                    <p className="mt-1 text-sm font-semibold text-text-muted">
                      {entry.score} pts · {getLeaderboardTier(entry.score)}
                    </p>
                  </div>

                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] border border-border bg-surface-container-lowest shadow-[var(--shadow-sm)]">
                    {entry.avatarUrl ? (
                      <Image
                        src={entry.avatarUrl}
                        alt={entry.username}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-black text-primary">
                        {getInitial(entry.username)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-[0.8rem] bg-surface-container-lowest p-3">
                    <p className="text-lg font-black text-text">{entry.sessions}</p>
                    <p className="mt-1 text-[11px] font-semibold text-text-subtle">sessões</p>
                  </div>
                  <div className="rounded-[0.8rem] bg-surface-container-lowest p-3">
                    <p className="text-lg font-black text-text">{entry.accuracy}%</p>
                    <p className="mt-1 text-[11px] font-semibold text-text-subtle">precisão</p>
                  </div>
                  <div className="rounded-[0.8rem] bg-surface-container-lowest p-3">
                    <p className="text-lg font-black text-text">{entry.bestStreak}</p>
                    <p className="mt-1 text-[11px] font-semibold text-text-subtle">streak</p>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="section-kicker">Classificação</p>
            <h2 className="mt-3 text-2xl font-black text-text">50 melhores da semana</h2>
          </div>
          {myRank && (
            <span className="inline-flex w-fit items-center gap-2 rounded-[0.75rem] border border-border bg-primary-light px-3 py-2 text-sm font-black text-primary">
              <Trophy className="h-4 w-4" />
              Você: #{myRank.rank} · {myRank.score} pts
            </span>
          )}
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className={`grid gap-3 px-4 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 ${ entry.userId === user.id ? 'bg-primary-light' : 'hover:bg-surface-container-low' }`}
            >
              <Link
                href={`/profile/${entry.username}`}
                className="group flex min-w-0 items-center gap-3"
              >
                <div className="flex h-9 w-10 shrink-0 items-center justify-center text-sm font-black text-text-muted">
                  #{entry.rank}
                </div>
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[0.85rem] border border-border bg-[var(--color-surface-container)] text-text transition-colors group-hover:border-primary">
                  {entry.avatarUrl ? (
                    <Image
                      src={entry.avatarUrl}
                      alt={entry.username}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-base font-black text-primary">
                      {getInitial(entry.username)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-text transition-colors group-hover:text-primary">
                    {entry.userId === user.id ? 'Você' : entry.username}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-text-muted">
                    {entry.sessions} sessões · {entry.accuracy}% precisão · {entry.bestStreak} streak
                  </p>
                </div>
              </Link>

              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                {index === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-[0.65rem] bg-amber-500 px-2.5 py-1 text-xs font-black text-white">
                    <Flame className="h-3.5 w-3.5 fill-white" />
                    Líder
                  </span>
                )}
                <span className="inline-flex rounded-[0.65rem] bg-surface-container-lowest px-3 py-1.5 text-xs font-black text-primary">
                  {entry.score} pts
                </span>
                <span className="inline-flex rounded-[0.65rem] border border-border bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-text-muted">
                  {getLeaderboardTier(entry.score)}
                </span>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <EmptyState
              imageSrc="/images/arena/undraw-game-day.svg"
              imageAlt="Ilustração unDraw de competição sem ranking"
              title="Ranking ainda vazio."
              description="Ainda não há dados suficientes para o ranking semanal."
              variant="compact"
              className="rounded-none bg-transparent px-6 py-10"
              imageClassName="max-w-36"
            />
          )}
        </div>
      </section>
    </div>
  )
}
