import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Keyboard,
  Layers,
  Medal,
  Puzzle,
  Settings,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import MotivationalCarousel from '@/components/shared/MotivationalCarouselWrapper'
import PwaCoach from '@/components/pwa/PwaCoach'
import StreakBadge from '@/components/shared/StreakBadge'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import {
  isAssignmentCompleted,
  isAssignmentIncomplete,
  parseAssignmentStatus,
} from '@/lib/assignmentStatus'
import { getReviewQueueSummaryForUser } from '@/lib/reviewQueue'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/lib/reviewSchedules'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import HomeRealtime from './HomeRealtime'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const gameModeConfig: Record<string, { label: string; icon: typeof Target }> = {
  multiple_choice: { label: 'Múltipla escolha', icon: Target },
  flashcard: { label: 'Flashcard', icon: Layers },
  typing: { label: 'Digitação', icon: Keyboard },
  matching: { label: 'Combinação', icon: Puzzle },
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  easy: { label: 'Fácil', className: 'bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)] border border-[var(--color-primary)]' },
  medium: { label: 'Médio', className: 'bg-[rgba(43,122,11,0.08)] text-[var(--color-primary)] border border-[rgba(43,122,11,0.14)]' },
  hard: { label: 'Difícil', className: 'bg-red-50 text-red-700 border border-red-200' },
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
}

type SessionSummary = {
  correct_answers: number
  wrong_answers: number
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

  return streak
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

  const [profileResult, assignmentsResult, sessionsResult] = await Promise.all([
    supabase.from('profiles').select('username,role').eq('id', user.id).single(),
    supabase
      .from('assignments')
      .select('id,assigned_date,status,game_mode,packs(name,description,level)')
      .eq('user_id', user.id)
      .order('assigned_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('game_sessions')
      .select('correct_answers,wrong_answers')
      .eq('user_id', user.id),
  ])

  await materializePromise

  const profile = profileResult.data
  const today = getAppDateString()
  const assignments =
    ((assignmentsResult.data as HomeAssignment[] | null) || []).filter((assignment) => {
      if (!isPlayableAssignmentGameMode(assignment.game_mode)) return false
      const status = parseAssignmentStatus(assignment.status)
      return assignment.assigned_date >= today || status.baseStatus !== 'completed'
    })
  const sessions = (sessionsResult.data as SessionSummary[] | null) || []

  const streak = calculateStreak(assignments, today)
  const reviewStats = await getReviewStats(user.id, supabase)

  // Achievements calculation
  const achievements = [
    {
      id: 'first-step',
      label: 'Explorador',
      description: 'Começou a jornada',
      unlocked: reviewStats.totalReviews > 0,
      icon: Trophy,
      className: 'bg-[rgba(223,236,205,0.72)] text-[var(--color-primary)] border-[rgba(43,122,11,0.18)]',
    },
    {
      id: 'streak-3',
      label: 'Focado',
      description: '3 dias de ritmo',
      unlocked: streak >= 3,
      icon: Target,
      className: 'bg-[rgba(43,122,11,0.08)] text-[var(--color-primary)] border-[rgba(43,122,11,0.14)]',
    },
    {
      id: 'streak-7',
      label: 'Imbatível',
      description: '7 dias seguidos',
      unlocked: streak >= 7,
      icon: Flame,
      className: 'bg-red-50 text-red-600 border-red-100',
    },
    {
      id: 'learned-150',
      label: 'Sábio',
      description: '150+ cards memorizados',
      unlocked: reviewStats.totalReviews >= 150,
      icon: Brain,
      className: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      id: 'perfectionist',
      label: 'Cirúrgico',
      description: 'Sessão 100% (10+ cards)',
      unlocked: sessions.some((s) => s.wrong_answers === 0 && s.correct_answers >= 10),
      icon: Medal,
      className: 'bg-[rgba(239,241,239,0.96)] text-[var(--color-text)] border-[rgba(43,122,11,0.12)]',
    },
  ].filter((a) => a.unlocked)

  const totalAssignments = assignments.length
  const pendingAssignments = assignments.filter((assignment) => !isAssignmentCompleted(assignment.status))
  const pendingCount = pendingAssignments.length
  const completedCount = totalAssignments - pendingCount
  const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 100
  const nextAssignment = pendingAssignments[0]

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <HomeRealtime />

      {achievements.length > 0 && (
        <section className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '40ms' }}>
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            return (
              <div
                key={achievement.id}
                title={achievement.description}
                className={`flex items-center gap-2.5 rounded-full border px-4 py-2 transition-all hover:scale-105 ${achievement.className}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                <p className="text-xs font-bold">{achievement.label}</p>
              </div>
            )
          })}
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section
          className="bg-[var(--color-surface-container-lowest)] rounded-[2rem] p-8 md:p-12 editorial-shadow ghost-border flex flex-col justify-between min-h-[400px] relative overflow-hidden animate-slide-up"
          style={{ animationDelay: '80ms' }}
        >
          <div className="section-kicker">English flow for today</div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-responsive-lg font-semibold text-[var(--color-text)]">
                Seu inglês fica mais afiado quando a rotina fica mais gostosa de abrir.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
                Olá, {profile?.username || 'estudante'}.{' '}
                {pendingCount > 0
                  ? `Você tem ${pendingCount} ${pendingCount === 1 ? 'lição pendente' : 'lições pendentes'} para manter o ritmo hoje.`
                  : 'Seu plano do dia está concluído. Aproveite para revisar e consolidar o vocabulário.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {profile?.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  transitionTypes={navForwardTransitionTypes}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,122,11,0.16)] bg-[linear-gradient(135deg,rgba(223,236,205,0.96),rgba(211,230,187,0.9))] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] shadow-[0_18px_36px_-24px_rgba(43,122,11,0.34)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(43,122,11,0.12)] text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
                    <Settings className="h-4 w-4" strokeWidth={2.3} />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--color-primary)]/70">
                      Admin
                    </span>
                    <span className="font-bold text-[var(--color-primary)]">Painel</span>
                  </span>
                </Link>
              )}
              <StreakBadge count={streak} />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-[var(--color-surface-container-lowest)] ghost-border p-6 rounded-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Revisões agora
              </p>
              <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{reviewStats.totalDue}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {reviewStats.dueToday} vencidas + {reviewStats.newCards} novas hoje
              </p>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] ghost-border p-6 rounded-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Tarefas do dia
              </p>
              <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{totalAssignments}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {completedCount} concluídas, {pendingCount} pendentes
              </p>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] ghost-border p-6 rounded-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Ritmo
              </p>
              <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{completionRate}%</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                De conclusão nas tarefas visíveis
              </p>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] ghost-border p-6 rounded-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Histórico total
              </p>
              <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{reviewStats.totalReviews}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">Cards revisados até aqui</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {reviewStats.totalDue > 0 ? (
              <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary">
                <Brain className="h-4 w-4" strokeWidth={2} />
                Iniciar revisão
              </Link>
            ) : (
              <Link href="/history" transitionTypes={navForwardTransitionTypes} className="btn-primary">
                <BarChart3 className="h-4 w-4" strokeWidth={2} />
                Ver histórico
              </Link>
            )}

            {pendingCount === 0 && totalAssignments > 0 && (
              <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-ghost">
                <Clock className="h-4 w-4" strokeWidth={2} />
                Revisar tarefas
              </Link>
            )}

            {nextAssignment && (
              <Link href={`/play/${nextAssignment.id}`} transitionTypes={navForwardTransitionTypes} className="btn-ghost">
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
                Continuar lição
              </Link>
            )}
          </div>
        </section>

        <aside
          className="bg-[var(--color-surface-container-lowest)] ghost-border p-8 rounded-[2rem] flex flex-col animate-slide-up"
          style={{ animationDelay: '140ms' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Recommended next step</p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                {reviewStats.totalDue > 0 ? 'Revisar antes de avançar.' : 'Você está com o fluxo em dia.'}
              </h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-container)] text-[var(--color-text)]">
              <TrendingUp className="h-7 w-7" strokeWidth={1.8} />
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="bg-[var(--color-surface-container)] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                Prioridade
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {reviewStats.totalDue > 0
                  ? 'Comece pela revisão espaçada para reforçar memória antes de abrir a próxima lição.'
                  : nextAssignment
                    ? `A próxima sessão sugerida é ${nextAssignment.packs?.name || 'o próximo pack'}`
                    : 'Sem pendências por agora. Use o histórico para revisar desempenho.'}
              </p>
            </div>

            <div className="bg-[var(--color-surface-container)] rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                Agenda
              </p>
              <div className="mt-3 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span>Para hoje</span>
                <span className="font-semibold text-[var(--color-text)]">{reviewStats.dueToday}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span>Para amanhã</span>
                <span className="font-semibold text-[var(--color-text)]">{reviewStats.dueTomorrow}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span>Novos cards</span>
                <span className="font-semibold text-[var(--color-text)]">{reviewStats.newCards}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                <span>Limite diário</span>
                <span className="font-semibold text-[var(--color-text)]">{reviewStats.newCardsLimit}</span>
              </div>
            </div>

            {nextAssignment ? (
              <div className="rounded-[2rem] bg-[var(--color-on-surface)] p-6 text-white editorial-shadow">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Next lesson</p>
                <p className="mt-3 text-2xl font-semibold leading-tight">{nextAssignment.packs?.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/72">
                  {nextAssignment.packs?.description || 'Pronto para mais uma sessão curta e objetiva.'}
                </p>
              </div>
            ) : (
              <div className="rounded-[2rem] bg-[var(--color-surface-container-low)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                  Estado atual
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--color-text)]">Tudo limpo por aqui.</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  Sem tarefas pendentes agora. Aproveite o histórico ou aguarde novas atribuições.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {profile?.role !== 'admin' && <PwaCoach dueCount={reviewStats.totalDue} />}

      <MotivationalCarousel />

      {reviewStats.totalDue > 0 && (
        <section
          className="bg-[var(--color-surface-container)] p-8 md:p-12 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 editorial-shadow animate-slide-up"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="icon-glow flex h-14 w-14 items-center justify-center rounded-[22px] text-[var(--color-primary)]">
                <Brain className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <div className="max-w-xl">
                <p className="section-kicker">Revisão espaçada</p>
                <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                  Hora de transformar exposição em memória útil.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-[var(--color-text-muted)]">
                  Você tem {reviewStats.dueToday} revisões vencidas e {reviewStats.newCards} novos cards disponíveis hoje.
                </p>
              </div>
            </div>

            <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary shrink-0">
              Começar revisão
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </section>
      )}

      <section className="space-y-4 animate-slide-up" style={{ animationDelay: '140ms' }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Daily assignments</p>
            <h2 className="mt-4 text-4xl font-semibold text-[var(--color-text)]">Tarefas do dia</h2>
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-white/72 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
            {completedCount} de {totalAssignments} concluído{totalAssignments === 1 ? '' : 's'}
          </div>
        </div>

        {assignments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {assignments.map((assignment, index: number) => {
              const statusMeta = parseAssignmentStatus(assignment.status)
              const mode = gameModeConfig[assignment.game_mode] || gameModeConfig.multiple_choice
              const level = assignment.packs?.level || 'easy'
              const difficulty = difficultyConfig[level] || difficultyConfig.easy
              const Icon = mode.icon
              const isCompleted = isAssignmentCompleted(assignment.status)
              const isIncomplete = isAssignmentIncomplete(assignment.status)

              return (
                <article
                  key={assignment.id}
                  data-testid="assignment-card"
                  className={`bg-[var(--color-surface-container-lowest)] ghost-border rounded-[2rem] flex flex-col justify-between p-8 editorial-shadow animate-slide-up ${isCompleted ? 'border-[var(--color-border)] bg-[var(--color-surface-container-low)]' : ''}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`badge ${difficulty.className}`}>{difficulty.label}</span>
                          <span className="badge border border-[var(--color-border)] bg-white/70 text-[var(--color-text-muted)]">
                            {mode.label}
                          </span>
                          {statusMeta.timeLimitMinutes && (
                            <span className="badge border border-[rgba(43,122,11,0.14)] bg-[rgba(43,122,11,0.06)] text-[var(--color-primary)]">
                              {statusMeta.timeLimitMinutes} min
                            </span>
                          )}
                        </div>

                        <h3 className="mt-5 text-3xl font-semibold leading-[1.02] text-[var(--color-text)]">
                          {assignment.packs?.name}
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                          {assignment.packs?.description || 'Sessão preparada para manter a consistência do seu inglês.'}
                        </p>
                      </div>

                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isCompleted ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'}`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-7 w-7" strokeWidth={1.8} />
                        ) : (
                          <Icon className="h-7 w-7" strokeWidth={1.8} />
                        )}
                      </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Status
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {isCompleted ? 'Concluído' : isIncomplete ? 'Incompleto' : 'Pronto para jogar'}
                        </p>
                      </div>
                      <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Modo
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{mode.label}</p>
                      </div>
                      <div className="bg-[var(--color-surface-container)] rounded-xl p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          {statusMeta.timeLimitMinutes ? 'Tempo' : 'Foco'}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {statusMeta.timeLimitMinutes
                            ? `${statusMeta.timeLimitMinutes} min`
                            : level === 'easy'
                              ? 'Base'
                              : level === 'medium'
                                ? 'Ritmo'
                                : 'Desafio'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7">
                    {!isCompleted ? (
                      <Link
                        href={`/play/${assignment.id}`}
                        transitionTypes={navForwardTransitionTypes}
                        data-testid="assignment-start-button"
                        className={`w-full py-4 ${isIncomplete ? 'btn-ghost' : 'btn-primary'}`}
                      >
                        {isIncomplete ? 'Continuar treinamento' : 'Iniciar treinamento'}
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                      </Link>
                    ) : (
                      <div
                        className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white"
                        style={{ backgroundColor: '#2B7A0B' }}
                      >
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                        Concluído
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="bg-[var(--color-surface-container-lowest)] editorial-shadow ghost-border rounded-[2rem] p-10 text-center md:p-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-container)] text-[var(--color-text)]">
              <BookOpen className="h-9 w-9" strokeWidth={1.7} />
            </div>
            <h2 className="mt-6 text-4xl font-semibold text-[var(--color-text)]">Tudo certo por hoje.</h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
              O administrador ainda não atribuiu novas lições. Se quiser manter o ritmo, use a revisão ou abra o histórico.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {reviewStats.totalDue > 0 ? (
                <Link href="/review" transitionTypes={navForwardTransitionTypes} className="btn-primary">
                  <Brain className="h-4 w-4" strokeWidth={2} />
                  Revisar cards
                </Link>
              ) : (
                <Link href="/history" transitionTypes={navForwardTransitionTypes} className="btn-ghost">
                  <Clock className="h-4 w-4" strokeWidth={2} />
                  Ver histórico
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
