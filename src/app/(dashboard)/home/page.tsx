import { DecoCheck } from '@/components/shared/DecorativeSvgs'
import HomeBottomCards from './HomeBottomCards'
import HomeFooter from './HomeFooter'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Medal,
  Settings,
} from 'lucide-react'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/lib/assignmentStatus'
import { getLeaderboardTier } from '@/lib/leaderboard'
import { getWeeklyLeaderboard } from '@/lib/weeklyLeaderboard'
import { getReviewQueueSummaryForUser } from '@/lib/reviewQueue'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/lib/reviewSchedules'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import HomeRealtime from './HomeRealtime'
import DailyQuestsWidget from './DailyQuestsWidget'
import StaggeredFadeIn from '@/components/shared/StaggeredFadeIn'
import HomeHeroIllustration from '@/components/shared/HomeHeroIllustration'
import EmptyState from '@/components/shared/EmptyState'
import RankingWidget from './RankingWidget'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const gameModeConfig: Record<string, { label: string }> = {
  multiple_choice: { label: 'Gramática' },
  flashcard: { label: 'Revisão' },
  typing: { label: 'Digitação' },
  matching: { label: 'Associação' },
  listening: { label: 'Escuta' },
  speaking: { label: 'Fala' },
}

type HomePack = {
  name: string
  description: string | null
  level: string | null
}

type HomeAssignment = {
  id: string
  assigned_date: string
  status: string
  game_mode: string
  packs: HomePack | null
  badges: { name: string; icon_name: string } | null
}

type SessionSummary = {
  correct_answers: number
  wrong_answers: number
}

type HomeRecentReview = {
  card_id: string
  quality: number
  review_date: string
}

function calculateStreak(assignments: HomeAssignment[], today: string) {
  const completedDays = new Set(
    assignments.filter((row) => isAssignmentCompleted(row.status)).map((row) => row.assigned_date)
  )
  let streak = 0

  for (let i = 0; i < 30; i++) {
    const dateStr = shiftAppDate(today, -i)
    if (completedDays.has(dateStr)) {
      streak++
      continue
    }
    if (i > 0) break
  }

  return { streak, completedDays }
}

async function getReviewStats(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  return getReviewQueueSummaryForUser(
    supabase as unknown as Parameters<typeof getReviewQueueSummaryForUser>[0],
    userId
  )
}

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const materializePromise = materializeScheduledReviewReleasesForUser(user.id)
  const weeklyStart = shiftAppDate(getAppDateString(), -7)

  const windowStartIso = `${weeklyStart}T00:00:00.000Z`

  const [
    profileResult,
    assignmentsResult,
    sessionsResult,
    recentReviewsResult,
    topLeaderboard,
    questsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('username,role').eq('id', user.id).single(),
    supabase
      .from('assignments')
      .select('id,assigned_date,status,game_mode,packs(name,description,level),badges(name,icon_name)')
      .eq('user_id', user.id)
      .order('assigned_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase.from('game_sessions').select('correct_answers,wrong_answers').eq('user_id', user.id),
    supabase
      .from('card_reviews')
      .select('card_id,quality,review_date')
      .eq('user_id', user.id)
      .gte('review_date', windowStartIso)
      .order('review_date', { ascending: false }),
    getWeeklyLeaderboard(supabase as Parameters<typeof getWeeklyLeaderboard>[0], windowStartIso, 3),
    supabase
      .from('user_quests')
      .select('id,quest_type,target,progress,status')
      .eq('user_id', user.id)
      .order('status', { ascending: true }) // active first
      .order('created_at', { ascending: false }),
  ])

  await materializePromise

  const profile = profileResult.data
  const today = getAppDateString()
  const allPlayableAssignments =
    ((assignmentsResult.data as HomeAssignment[] | null) || []).filter((assignment) =>
      isPlayableAssignmentGameMode(assignment.game_mode)
    )
  const assignments = allPlayableAssignments.filter((assignment) => {
    const status = parseAssignmentStatus(assignment.status)
    return assignment.assigned_date >= today || status.baseStatus !== 'completed'
  })
  const sessions = (sessionsResult.data as SessionSummary[] | null) || []
  const recentReviews = (recentReviewsResult.data as HomeRecentReview[] | null) || []

  const { streak, completedDays } = calculateStreak(allPlayableAssignments, today)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const offset = i - 6
    const dateStr = shiftAppDate(today, offset)
    const dateObj = new Date(dateStr + 'T12:00:00Z')
    return {
      dateStr,
      letter: dateObj.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).charAt(0).toUpperCase(),
      completed: completedDays.has(dateStr),
    }
  })
  const reviewStats = await getReviewStats(user.id, supabase)
  const totalAssignments = assignments.length
  const pendingAssignments = assignments.filter((assignment) => !isAssignmentCompleted(assignment.status))
  const pendingCount = pendingAssignments.length
  const completedCount = totalAssignments - pendingCount
  const completedReviewsToday = recentReviews.filter(
    (review) => getAppDateString(review.review_date) === today
  ).length
  const totalReviewWork = completedReviewsToday + reviewStats.totalDue
  const totalDailyWork = totalAssignments + totalReviewWork
  const completedDailyWork = completedCount + completedReviewsToday
  const completionRate =
    totalDailyWork > 0 ? Math.round((completedDailyWork / totalDailyWork) * 100) : 100
  const hasPendingReviews = reviewStats.totalDue > 0
  const nextAssignment = pendingAssignments[0]
  const weeklyFocusScore = sessions.reduce(
    (sum, session) => sum + session.correct_answers * 2 + Math.max(0, 4 - session.wrong_answers),
    0
  )
  const focusRank = getLeaderboardTier(weeklyFocusScore)
  const cardsMasteredThisWeek = new Set(
    recentReviews.filter((review) => review.quality >= 3).map((review) => review.card_id)
  ).size
  const achievements = [
    { id: 'streak', label: 'Sequência ativa', unlocked: streak >= 3, icon: Flame },
    { id: 'focus', label: 'Focado', unlocked: reviewStats.totalReviews > 20, icon: Medal },
    { id: 'review', label: 'Hábito de revisão', unlocked: reviewStats.totalDue > 0, icon: Brain },
    { id: 'wins', label: 'Concluído', unlocked: completedCount > 0, icon: CheckCircle2 },
  ].filter((item) => item.unlocked)
  const primaryAction = hasPendingReviews
    ? {
        href: '/review',
        label: 'Começar revisão',
        title: 'Sua revisão diária está pronta.',
        description: `Você tem ${reviewStats.totalDue} card${reviewStats.totalDue === 1 ? '' : 's'} aguardando revisão hoje.`,
        icon: Brain,
      }
    : nextAssignment
      ? {
          href: `/play/${nextAssignment.id}`,
          label: 'Começar atividade',
          title: nextAssignment.packs?.name || 'Sua próxima atividade está pronta.',
          description: nextAssignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.',
          icon: BookOpen,
        }
      : {
          href: '/history',
          label: 'Ver histórico',
          title: 'Tudo em dia por agora.',
          description: 'Seu plano do dia está concluído. Use esse momento para acompanhar sua evolução ou explorar novos conteúdos.',
          icon: CheckCircle2,
        }
  const PrimaryActionIcon = primaryAction.icon

  return (
    <div className="relative space-y-6 pb-8">
      <HomeRealtime />

      <StaggeredFadeIn className="relative z-10 space-y-6">
        <section className="premium-card relative overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div className="relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
                <PrimaryActionIcon className="h-6 w-6" strokeWidth={2.3} />
              </div>
              <p className="section-kicker mt-5">Próxima ação</p>
              <h1 className="mt-4 max-w-2xl text-3xl font-extrabold text-[var(--color-text)] sm:text-4xl">
                {primaryAction.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                {primaryAction.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={primaryAction.href} transitionTypes={navForwardTransitionTypes} className="btn-primary">
                  <PrimaryActionIcon className="h-4 w-4" />
                  {primaryAction.label}
                </Link>
                {hasPendingReviews && nextAssignment ? (
                  <Link href={`/play/${nextAssignment.id}`} transitionTypes={navForwardTransitionTypes} className="btn-ghost">
                    {nextAssignment.badges ? <span className="mr-1">🏅</span> : <ArrowRight className="h-4 w-4" />}
                    Abrir lição
                  </Link>
                ) : (
                  <Link href="/explore" transitionTypes={navForwardTransitionTypes} className="btn-ghost">
                    <BookOpen className="h-4 w-4" />
                    Explorar
                  </Link>
                )}
              </div>
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-sm items-center justify-center rounded-[1.75rem] bg-[var(--color-surface-container-low)] p-5">
              <HomeHeroIllustration className="h-auto w-full max-w-[18rem] sm:max-w-[20rem]" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="stitch-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Sequência</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-extrabold leading-none text-[var(--color-text)]">{streak}</span>
                  <span className="pb-1 text-sm font-bold text-[var(--color-text-muted)]">dias</span>
                </div>
              </div>
              <Flame className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.4} />
            </div>
            <div className="mt-5 flex items-center justify-between gap-2">
              {last7Days.map(({ dateStr, letter, completed }, index) => {
                const highlight = index === 6
                const active = completed || (highlight && streak > 0)
                return (
                  <Link
                    key={dateStr}
                    href={`/history?date=${dateStr}`}
                    transitionTypes={navForwardTransitionTypes}
                    className="flex flex-col items-center gap-2 transition-transform hover:scale-110 active:scale-95"
                  >
                    <span className={`text-[10px] font-bold tracking-wider ${highlight ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-subtle)]'}`}>
                      {letter}
                    </span>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black transition-all ${
                        highlight
                          ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                          : active
                            ? 'bg-[var(--color-primary-container)] text-[var(--color-primary)]'
                            : 'bg-[var(--color-surface-container-high)] text-[var(--color-text-subtle)]'
                      }`}
                    >
                      {highlight ? streak || 0 : (completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : '•')}
                    </div>
                  </Link>
                )
              })}
            </div>
          </article>

          <article className="stitch-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Meta diária</p>
                <p className="mt-4 text-4xl font-extrabold text-[var(--color-text)]">{completionRate}%</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.4} />
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-high)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                style={{ width: `${Math.max(12, Math.min(100, completionRate))}%` }}
              />
            </div>
            <p className="mt-3 text-xs font-semibold text-[var(--color-text-subtle)]">
              {completedDailyWork} de {totalDailyWork} tarefas do dia concluídas.
            </p>
          </article>

          <article className="stitch-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Nível atual</p>
                <p className="mt-4 text-4xl font-extrabold text-[var(--color-primary)]">
                  {user.user_metadata?.english_level || 'B2'}
                </p>
              </div>
              <Medal className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.4} />
            </div>
            <p className="mt-3 text-sm font-bold text-[var(--color-text-muted)]">
              {user.user_metadata?.english_level_name || 'Intermediário Superior'}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-subtle)]">
              Seu foco semanal está no nível {focusRank}.
            </p>
          </article>
        </section>

      <DailyQuestsWidget quests={questsResult.data || []} />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-[var(--color-text)]">Atividades pendentes</h2>
          {profile?.role === 'admin' && (
            <Link href="/admin/dashboard" transitionTypes={navForwardTransitionTypes} className="text-sm font-semibold text-[var(--color-primary)]">
              <span className="inline-flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Painel
              </span>
            </Link>
          )}
        </div>

        {assignments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {assignments.slice(0, 3).map((assignment) => {
              const statusMeta = parseAssignmentStatus(assignment.status)
              const mode = gameModeConfig[assignment.game_mode] || gameModeConfig.multiple_choice
              const isCompleted = isAssignmentCompleted(assignment.status)

              return (
                <article key={assignment.id} data-testid="assignment-card" className="stitch-panel p-5">
                  <div className="flex items-start justify-between gap-4">
                    <span className="stitch-pill bg-[var(--color-surface)] text-[var(--color-primary)]">
                      {mode.label}
                    </span>
                    {assignment.badges ? (
                      <span title={assignment.badges.name} className="text-2xl drop-shadow-sm">🏅</span>
                    ) : (
                      <BookOpen className="h-5 w-5 text-[var(--color-text-subtle)]" strokeWidth={2} />
                    )}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[var(--color-text)]">
                    {assignment.packs?.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {assignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.'}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-subtle)]">
                      <Clock className="h-3.5 w-3.5" />
                      {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Foco diário'}
                    </div>
                    {isCompleted ? (
                      <span className="stitch-pill bg-[rgba(70,98,89,0.1)] text-[var(--color-primary)]">Concluído</span>
                    ) : (
                      <Link
                        href={`/play/${assignment.id}`}
                        transitionTypes={navForwardTransitionTypes}
                        data-testid="assignment-start-button"
                        className="btn-primary px-4 py-2 text-xs"
                      >
                        Começar
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState
            imageSrc="/images/home/undraw-celebration.svg"
            imageAlt="Ilustração unDraw de pessoas comemorando todas as tarefas concluídas"
            title="Tudo em dia."
            description="Não há novas tarefas atribuídas agora."
            variant="default"
            imageClassName="max-w-36"
          />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RankingWidget topLeaderboard={topLeaderboard} />

        <article className="premium-card relative overflow-hidden p-6 sm:p-7">
          <DecoCheck className="absolute top-3 left-3 w-7 h-7 opacity-50" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Conquistas</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Vitórias recentes</h2>
            </div>
            <Medal className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {achievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <div key={achievement.id} className="rounded-[1rem] bg-[var(--color-surface-container-low)] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[var(--color-text)]">{achievement.label}</p>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      <HomeBottomCards
        totalDue={reviewStats.totalDue}
        cardsMasteredThisWeek={cardsMasteredThisWeek}
        focusRank={focusRank}
      />

      <HomeFooter />

      </StaggeredFadeIn>
    </div>
  )
}
