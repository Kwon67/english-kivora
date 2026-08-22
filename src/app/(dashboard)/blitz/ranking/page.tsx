import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Award, Crown, Flame, Medal, Trophy, Users, Zap } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import BlitzShell from '@/features/blitz/components/BlitzShell'
import { isBlitzTableReady } from '@/features/blitz/lib/blitzTable'
import {
  getUserWeeklyBlitzRank,
  getWeeklyBlitzLeaderboard,
} from '@/features/blitz/lib/weeklyBlitzLeaderboard'
import {
  blitzCard,
  blitzHeroArena,
  blitzIconBox,
  blitzKicker,
  blitzPrimaryBtn,
  blitzSoftBtn,
  blitzTile,
} from '@/features/blitz/lib/blitzUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import SectionBadge from '@/components/ui/SectionBadge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const podiumStyles = [
  {
    label: 'Campeão',
    icon: Crown,
    surface: 'blitz-selected-surface',
  },
  {
    label: 'Vice',
    icon: Medal,
    surface: 'home-frosted-subtle',
  },
  {
    label: 'Top 3',
    icon: Award,
    surface: '',
  },
]

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || 'K'
}

export default async function BlitzRankingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const weeklyStart = shiftAppDate(getAppDateString(), -7)
  const windowStartIso = `${weeklyStart}T00:00:00.000Z`

  const [leaderboard, myRank, scoresReady] = await Promise.all([
    getWeeklyBlitzLeaderboard(supabase, windowStartIso, 50),
    getUserWeeklyBlitzRank(supabase, windowStartIso, user.id),
    isBlitzTableReady(supabase),
  ])

  const topThree = leaderboard.slice(0, 3)
  const averageScore = leaderboard.length
    ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.score, 0) / leaderboard.length)
    : 0

  return (
    <BlitzShell>
      <div className="mx-auto w-full min-w-0 max-w-5xl space-y-5 pb-4 animate-fade-in sm:space-y-6">
        {!scoresReady && (
          <section className={`${blitzCard} px-5 py-4 font-body text-sm text-brand-dark`}>
            O ranking do Blitz está temporariamente indisponível. Jogue partidas no Blitz — os scores
            aparecerão aqui assim que o recurso for reativado.
          </section>
        )}

        <section className={`${blitzHeroArena} overflow-hidden p-4 sm:p-7`}>
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SectionBadge label="Ranking Blitz" animate={false} />
                <span className={`${blitzKicker} bg-brand-accent`}>Últimos 7 dias</span>
              </div>
              <h1 className="mt-4 font-heading text-2xl font-bold leading-tight text-brand-dark sm:mt-5 sm:text-4xl lg:text-5xl">
                Melhores scores da semana
              </h1>
              <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
                Cada jogador aparece com sua melhor partida da semana. Combo alto ajuda no desempate.
              </p>
              <Link
                href="/blitz/play"
                className={`${blitzPrimaryBtn} mt-5 sm:mt-6`}
                transitionTypes={navBackTransitionTypes}
              >
                <Zap className="h-4 w-4" />
                Jogar Blitz
              </Link>
            </div>

            <div className={`${blitzTile} grid gap-0 overflow-hidden p-0 sm:grid-cols-3`}>
              <div className="border-b border-brand-dark p-4 sm:border-b-0 sm:border-r">
                <Users className="h-4 w-4 text-brand-dark" />
                <p className="mt-3 font-heading text-2xl font-bold tabular-nums text-brand-dark">{leaderboard.length}</p>
                <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">participantes</p>
              </div>
              <div className="border-b border-brand-dark p-4 sm:border-b-0 sm:border-r">
                <Flame className="h-4 w-4 text-brand-dark" />
                <p className="mt-3 font-heading text-2xl font-bold tabular-nums text-brand-dark">{averageScore}</p>
                <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">média de score</p>
              </div>
              <div className="p-4">
                <Trophy className="h-4 w-4 text-brand-dark" />
                <p className="mt-3 font-heading text-2xl font-bold tabular-nums text-brand-dark">
                  {myRank ? `#${myRank.rank}` : '—'}
                </p>
                <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">sua posição</p>
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
                <article key={entry.userId} className={`${blitzCard} scroll-reveal p-5 ${style.surface}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className={`${blitzKicker} gap-1.5`}>
                        <PodiumIcon className="h-3.5 w-3.5" />
                        {style.label}
                      </span>
                      <p className="mt-4 font-heading text-xl font-bold leading-tight text-brand-dark">
                        {isCurrentUser ? 'Você' : entry.username}
                      </p>
                      <p className="mt-1 font-body text-sm font-semibold text-brand-secondary">
                        {entry.score} pts · combo {entry.maxCombo}
                      </p>
                    </div>

                    <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden ${blitzIconBox} font-heading text-xl font-bold`}>
                      {getInitial(entry.username)}
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        <section className={`${blitzCard} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-brand-dark px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <SectionBadge label="Classificação" animate={false} />
              <h2 className="mt-3 font-heading text-2xl font-bold text-brand-dark">50 melhores da semana</h2>
            </div>
            {myRank && (
              <span className={`${blitzKicker} gap-2 bg-brand-accent`}>
                <Trophy className="h-4 w-4" />
                Você: #{myRank.rank} · {myRank.score} pts
              </span>
            )}
          </div>

          <div className="divide-y divide-brand-border">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`scroll-fade grid gap-3 px-4 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 ${
                  entry.userId === user.id ? 'bg-brand-accent-soft' : 'hover:bg-bg-primary'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-10 shrink-0 items-center justify-center font-heading text-sm font-bold text-brand-secondary">
                    #{entry.rank}
                  </div>
                  <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-control border border-brand-dark bg-bg-card font-heading text-base font-bold text-brand-dark`}>
                    {getInitial(entry.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-body font-semibold text-brand-dark">
                      {entry.userId === user.id ? 'Você' : entry.username}
                    </p>
                    <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">
                      Combo máximo: {entry.maxCombo}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                  {index === 0 && (
                    <span className={`${blitzKicker} gap-1 bg-brand-accent`}>
                      <Flame className="h-3.5 w-3.5 fill-current" />
                      Líder
                    </span>
                  )}
                  <span className={blitzKicker}>{entry.score} pts</span>
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <EmptyState
                imageSrc="/images/home/undraw-winners.svg"
                imageAlt="Ilustração de ranking vazio"
                title="Ranking ainda vazio."
                description="Seja o primeiro a pontuar no Blitz esta semana."
                actionHref="/blitz/play"
                actionLabel="Jogar Blitz"
                variant="compact"
                className="rounded-none bg-transparent px-6 py-10"
                imageClassName="max-w-36"
                imageWrapClassName="home-frosted-subtle"
              />
            )}
          </div>
        </section>

        <div className="flex justify-center">
          <Link
            href="/blitz"
            className={blitzSoftBtn}
            transitionTypes={navBackTransitionTypes}
          >
            Voltar ao Blitz
          </Link>
        </div>
      </div>
    </BlitzShell>
  )
}
