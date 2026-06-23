import Image from 'next/image'
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
import { blitzGlassPanel, blitzGlassTile, blitzKicker, blitzNestedRow } from '@/features/blitz/lib/blitzUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const podiumStyles = [
  {
    label: 'Campeão',
    icon: Crown,
    badge: 'bg-amber-500 text-white',
  },
  {
    label: 'Vice',
    icon: Medal,
    badge: 'bg-slate-500 text-white',
  },
  {
    label: 'Top 3',
    icon: Award,
    badge: 'bg-orange-600 text-white',
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
      <div className="mx-auto max-w-5xl space-y-6 pb-4 animate-fade-in">
        {!scoresReady && (
          <section className="rounded-[20px] border border-dashed border-amber-500/35 bg-amber-500/10 px-5 py-4 text-sm text-text">
            O ranking do Blitz está temporariamente indisponível. Jogue partidas no Blitz — os scores
            aparecerão aqui assim que o recurso for reativado.
          </section>
        )}

        <section className={`${blitzGlassPanel} overflow-hidden p-5 sm:p-7`}>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={blitzKicker}>Ranking Blitz</span>
                <span className="text-[0.64rem] font-black uppercase tracking-[0.12em] text-text-subtle">
                  Últimos 7 dias
                </span>
              </div>
              <h1 className="mt-5 font-montserrat text-3xl font-bold leading-tight text-text sm:text-4xl">
                Melhores scores da semana
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                Cada jogador aparece com sua melhor partida da semana. Combo alto ajuda no desempate.
              </p>
              <Link
                href="/blitz/play"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-dark"
                transitionTypes={navBackTransitionTypes}
              >
                <Zap className="h-4 w-4" />
                Jogar Blitz
              </Link>
            </div>

            <div className={`${blitzGlassTile} grid gap-0 overflow-hidden p-0 sm:grid-cols-3`}>
              <div className="border-b border-dashed border-border-muted/18 p-4 sm:border-b-0 sm:border-r dark:border-border-accent/18">
                <Users className="h-4 w-4 text-primary" />
                <p className="mt-3 text-2xl font-black text-text">{leaderboard.length}</p>
                <p className="mt-1 text-xs font-semibold text-text-muted">participantes</p>
              </div>
              <div className="border-b border-dashed border-border-muted/18 p-4 sm:border-b-0 sm:border-r dark:border-border-accent/18">
                <Flame className="h-4 w-4 text-orange-500" />
                <p className="mt-3 text-2xl font-black text-text">{averageScore}</p>
                <p className="mt-1 text-xs font-semibold text-text-muted">média de score</p>
              </div>
              <div className="p-4">
                <Trophy className="h-4 w-4 text-amber-500" />
                <p className="mt-3 text-2xl font-black text-primary">
                  {myRank ? `#${myRank.rank}` : '—'}
                </p>
                <p className="mt-1 text-xs font-semibold text-text-muted">sua posição</p>
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
                <article key={entry.userId} className={`${blitzGlassPanel} p-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-[0.65rem] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${style.badge}`}
                      >
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
                        {entry.score} pts · combo {entry.maxCombo}
                      </p>
                    </div>

                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] border border-dashed border-border-muted/18 bg-card dark:border-border-accent/18">
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
                </article>
              )
            })}
          </section>
        )}

        <section className={`${blitzGlassPanel} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-dashed border-border-muted/18 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-border-accent/18">
            <div>
              <p className={blitzKicker}>Classificação</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold text-text">50 melhores da semana</h2>
            </div>
            {myRank && (
              <span className="inline-flex w-fit items-center gap-2 rounded-[0.75rem] border border-dashed border-border-muted/18 bg-primary-container px-3 py-2 text-sm font-black text-primary dark:border-border-accent/18 dark:bg-primary/12">
                <Trophy className="h-4 w-4" />
                Você: #{myRank.rank} · {myRank.score} pts
              </span>
            )}
          </div>

          <div className="divide-y divide-border-muted/18 dark:divide-border-accent/18">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`grid gap-3 px-4 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 ${
                  entry.userId === user.id ? 'bg-primary-container/40 dark:bg-primary/8' : 'hover:bg-primary-light/40 dark:hover:bg-primary/6'
                }`}
              >
                <Link href={`/profile/${entry.username}`} className="group flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-10 shrink-0 items-center justify-center text-sm font-black text-text-muted">
                    #{entry.rank}
                  </div>
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[0.85rem] border border-dashed border-border-muted/18 bg-card dark:border-border-accent/18">
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
                      Combo máximo: {entry.maxCombo}
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
                  <span className="inline-flex rounded-[0.65rem] bg-primary-container px-3 py-1.5 text-xs font-black text-primary dark:bg-primary/12">
                    {entry.score} pts
                  </span>
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
              />
            )}
          </div>
        </section>

        <div className="flex justify-center">
          <Link
            href="/blitz"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            transitionTypes={navBackTransitionTypes}
          >
            Voltar ao Blitz
          </Link>
        </div>
      </div>
    </BlitzShell>
  )
}