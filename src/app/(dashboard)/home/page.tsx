import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Keyboard,
  Layers,
  Puzzle,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react'
import MotivationalCarousel from '@/components/shared/MotivationalCarouselWrapper'
import StreakBadge from '@/components/shared/StreakBadge'
import { createClient } from '@/lib/supabase/server'
import type { Assignment, Pack } from '@/types/database.types'

const gameModeConfig: Record<string, { label: string; icon: typeof Target }> = {
  multiple_choice: { label: 'Múltipla escolha', icon: Target },
  flashcard: { label: 'Flashcard', icon: Layers },
  typing: { label: 'Digitação', icon: Keyboard },
  matching: { label: 'Combinação', icon: Puzzle },
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  easy: { label: 'Fácil', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  medium: { label: 'Médio', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  hard: { label: 'Difícil', className: 'bg-red-50 text-red-700 border border-red-200' },
}

async function getStreak(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 30)
  const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`

  const { data } = await supabase
    .from('assignments')
    .select('assigned_date,status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('assigned_date', fromStr)

  const days = new Set((data || []).map((row) => row.assigned_date))
  let streak = 0

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    if (days.has(dateStr)) {
      streak++
      continue
    }

    if (i > 0) break
  }

  return streak
}

async function getReviewStats(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date().toISOString()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString()

  const [
    { count: dueToday },
    { count: dueTomorrow },
    { count: newCards },
    { data: reviewStats },
  ] = await Promise.all([
    supabase
      .from('card_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review_date', now),
    supabase
      .from('card_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('next_review_date', now)
      .lte('next_review_date', tomorrowStr),
    supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .not(
        'id',
        'in',
        supabase.from('card_reviews').select('card_id').eq('user_id', userId)
      ),
    supabase.from('card_reviews').select('total_reviews').eq('user_id', userId),
  ])

  const totalReviews =
    reviewStats?.reduce((sum, row) => sum + (row.total_reviews || 0), 0) || 0

  return {
    dueToday: dueToday || 0,
    dueTomorrow: dueTomorrow || 0,
    newCards: newCards || 0,
    totalReviews,
    totalDue: (dueToday || 0) + (newCards || 0),
  }
}

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [profileResult, assignmentsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    (async () => {
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      return supabase
        .from('assignments')
        .select('*, packs(*)')
        .eq('user_id', user.id)
        .or(`assigned_date.gte.${today},status.eq.pending`)
        .order('assigned_date', { ascending: true })
        .order('status', { ascending: false })
    })(),
  ])

  const profile = profileResult.data
  const assignments = assignmentsResult.data

  const [streak, reviewStats] = await Promise.all([
    getStreak(user.id, supabase),
    getReviewStats(user.id, supabase),
  ])

  const totalAssignments = assignments?.length || 0
  const pendingAssignments =
    assignments?.filter((assignment: Assignment & { packs: Pack }) => assignment.status !== 'completed') ||
    []
  const pendingCount = pendingAssignments.length
  const completedCount = totalAssignments - pendingCount
  const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 100
  const nextAssignment = pendingAssignments[0] as (Assignment & { packs: Pack }) | undefined

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="surface-hero p-6 sm:p-8 lg:p-10">
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
                <Link href="/admin/dashboard" className="btn-ghost">
                  <Settings className="h-4 w-4" strokeWidth={2} />
                  Admin
                </Link>
              )}
              <StreakBadge count={streak} />
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Revisões agora
              </p>
              <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{reviewStats.totalDue}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {reviewStats.dueToday} vencidas + {reviewStats.newCards} novas
              </p>
            </div>

            <div className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Tarefas do dia
              </p>
              <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{totalAssignments}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {completedCount} concluídas, {pendingCount} pendentes
              </p>
            </div>

            <div className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Ritmo
              </p>
              <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{completionRate}%</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                De conclusão nas tarefas visíveis
              </p>
            </div>

            <div className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Histórico total
              </p>
              <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{reviewStats.totalReviews}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">Cards revisados até aqui</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {reviewStats.totalDue > 0 ? (
              <Link href="/review" className="btn-primary">
                <Brain className="h-4 w-4" strokeWidth={2} />
                Iniciar revisão
              </Link>
            ) : (
              <Link href="/history" className="btn-primary">
                <BarChart3 className="h-4 w-4" strokeWidth={2} />
                Ver histórico
              </Link>
            )}

            {nextAssignment && (
              <Link href={`/play/${nextAssignment.id}`} className="btn-ghost">
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
                Continuar lição
              </Link>
            )}
          </div>
        </section>

        <aside className="card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Recommended next step</p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                {reviewStats.totalDue > 0 ? 'Revisar antes de avançar.' : 'Você está com o fluxo em dia.'}
              </h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
              <TrendingUp className="h-7 w-7" strokeWidth={1.8} />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="surface-muted p-4">
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

            <div className="surface-muted p-4">
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
            </div>

            {nextAssignment ? (
              <div className="rounded-[26px] bg-[linear-gradient(135deg,rgba(17,32,51,0.96),rgba(15,118,110,0.9))] p-5 text-white shadow-[0_34px_70px_-42px_rgba(17,32,51,0.8)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Next lesson</p>
                <p className="mt-3 text-2xl font-semibold leading-tight">{nextAssignment.packs?.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/72">
                  {nextAssignment.packs?.description || 'Pronto para mais uma sessão curta e objetiva.'}
                </p>
              </div>
            ) : (
              <div className="rounded-[26px] bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(29,78,216,0.1))] p-5">
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

      <MotivationalCarousel />

      {reviewStats.totalDue > 0 && (
        <section className="glass-card p-6 sm:p-7">
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
                  Você tem {reviewStats.dueToday} revisões vencidas e {reviewStats.newCards} novos cards esperando.
                </p>
              </div>
            </div>

            <Link href="/review" className="btn-primary shrink-0">
              Começar revisão
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Daily assignments</p>
            <h2 className="mt-4 text-4xl font-semibold text-[var(--color-text)]">Tarefas do dia</h2>
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-white/72 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
            {completedCount} de {totalAssignments} concluído{totalAssignments === 1 ? '' : 's'}
          </div>
        </div>

        {assignments && assignments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {assignments.map((assignment: Assignment & { packs: Pack }, index: number) => {
              const mode = gameModeConfig[assignment.game_mode] || gameModeConfig.multiple_choice
              const level = assignment.packs?.level || 'easy'
              const difficulty = difficultyConfig[level] || difficultyConfig.easy
              const Icon = mode.icon
              const isCompleted = assignment.status === 'completed'

              return (
                <article
                  key={assignment.id}
                  data-testid="assignment-card"
                  className={`glass-card flex flex-col justify-between p-6 sm:p-7 ${isCompleted ? 'border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.9),rgba(255,255,255,0.82))]' : ''}`}
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
                        </div>

                        <h3 className="mt-5 text-3xl font-semibold leading-[1.02] text-[var(--color-text)]">
                          {assignment.packs?.name}
                        </h3>

                        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                          {assignment.packs?.description || 'Sessão preparada para manter a consistência do seu inglês.'}
                        </p>
                      </div>

                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]'}`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-7 w-7" strokeWidth={1.8} />
                        ) : (
                          <Icon className="h-7 w-7" strokeWidth={1.8} />
                        )}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="surface-muted p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Status
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {isCompleted ? 'Concluído' : 'Pronto para jogar'}
                        </p>
                      </div>
                      <div className="surface-muted p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Modo
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{mode.label}</p>
                      </div>
                      <div className="surface-muted p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                          Foco
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                          {level === 'easy' ? 'Base' : level === 'medium' ? 'Ritmo' : 'Desafio'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7">
                    {!isCompleted ? (
                      <Link
                        href={`/play/${assignment.id}`}
                        data-testid="assignment-start-button"
                        className="btn-primary w-full py-4"
                      >
                        Iniciar treinamento
                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700">
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
          <div className="premium-card p-8 text-center sm:p-10">
            <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
              <BookOpen className="h-9 w-9" strokeWidth={1.7} />
            </div>
            <h2 className="mt-6 text-4xl font-semibold text-[var(--color-text)]">Tudo certo por hoje.</h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
              O administrador ainda não atribuiu novas lições. Se quiser manter o ritmo, use a revisão ou abra o histórico.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {reviewStats.totalDue > 0 ? (
                <Link href="/review" className="btn-primary">
                  <Brain className="h-4 w-4" strokeWidth={2} />
                  Revisar cards
                </Link>
              ) : (
                <Link href="/history" className="btn-ghost">
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
