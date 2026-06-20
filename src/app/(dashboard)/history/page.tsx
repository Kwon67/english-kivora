import type { ComponentType, ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { Flame, Percent, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatAppDate, getAppDateString } from '@/lib/timezone'
import HistoryChart from '@/features/review/components/HistoryChart'
import RetentionChart from '@/features/review/components/RetentionChart'
import ActivityHeatmap from '@/features/review/components/ActivityHeatmap'
import RadarSkillsChart from '@/features/review/components/RadarSkillsChart'
import { SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
import HistoryFocusAreaSection from '@/features/review/components/HistoryFocusAreaSection'
import HistoryHeader from './HistoryHeader'
import { pageBgGlowExplore, pageBgGridExplore } from '@/lib/pageShellBackground'

type HistorySession = {
  id: string
  completed_at: string
  correct_answers: number
  wrong_answers: number
  max_streak: number
  assignments: {
    status: string
    game_mode: string
    packs: { name: string } | null
    badges: { name: string; icon_name: string } | null
  } | null
  session_errors: SessionErrorLog[]
}

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'
const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12'
const cardSheen =
  'home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]'

function GlassStatCard({
  kicker,
  value,
  description,
  icon: Icon,
  valueClassName = 'text-text dark:text-text',
}: {
  kicker: string
  value: string | number
  description: string
  icon: ComponentType<{ className?: string }>
  valueClassName?: string
}) {
  return (
    <article
      className={`${glassTile} p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] relative overflow-hidden group/stat`}
    >
      <div className={cardSheen} />
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div>
          <p className={softKicker}>{kicker}</p>
          <p className={`mt-3 text-3xl font-black leading-none ${valueClassName}`}>{value}</p>
        </div>
        <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold text-text-muted dark:text-text-muted relative z-10">{description}</p>
    </article>
  )
}

function GlassPanel({
  id,
  children,
  className = '',
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <article
      id={id}
      className={`${glassTile} relative overflow-hidden p-6 sm:p-7 ${className}`}
    >
      <div className={cardSheen} />
      <div className="relative z-10">{children}</div>
    </article>
  )
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { date: filterDate } = await searchParams

  let query = supabase
    .from('game_sessions')
    .select('id,completed_at,correct_answers,wrong_answers,max_streak,assignments(status,game_mode,packs(name),badges(name,icon_name)),session_errors(id,created_at,card_id,cards(english_phrase,portuguese_translation,audio_url))')
    .eq('user_id', user.id)

  if (filterDate) {
    query = query.gte('completed_at', `${filterDate}T00:00:00.000Z`).lte('completed_at', `${filterDate}T23:59:59.999Z`)
  } else {
    query = query.limit(50)
  }

  const [sessionsResult, cardsResult] = await Promise.all([
    query.order('completed_at', { ascending: false }),
    supabase.from('card_reviews').select('interval_days,review_date,total_reviews').eq('user_id', user.id)
  ])

  const sessions = sessionsResult.data
  const sessionsError = sessionsResult.error
  const cardReviews = cardsResult.data

  if (sessionsError) {
    console.error('History page query failed', { userId: user.id, sessionsError })
    throw new Error('Falha ao carregar o histórico do usuário.')
  }

  const typedSessions = (sessions ?? []) as unknown as HistorySession[]

  const chartData = typedSessions.map((session) => ({
    date: formatAppDate(session.completed_at, { day: '2-digit', month: '2-digit' }),
    acerto:
      session.correct_answers + session.wrong_answers > 0
        ? Math.round((session.correct_answers / (session.correct_answers + session.wrong_answers)) * 100)
        : 0,
    pack: session.assignments?.packs?.name || '',
  }))

  const totalSessions = typedSessions.length
  const totalCorrect = typedSessions.reduce((sum, session) => sum + session.correct_answers, 0)
  const totalWrong = typedSessions.reduce((sum, session) => sum + session.wrong_answers, 0)
  const averageAccuracy =
    totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0
  const bestStreak = typedSessions.reduce((best, session) => Math.max(best, session.max_streak), 0)

  const retentionCounts = { learning: 0, familiar: 0, mastered: 0 }
  cardReviews?.forEach(cr => {
    if (cr.interval_days < 3) retentionCounts.learning++
    else if (cr.interval_days <= 14) retentionCounts.familiar++
    else retentionCounts.mastered++
  })

  const retentionTotal = retentionCounts.learning + retentionCounts.familiar + retentionCounts.mastered

  const retentionData = [
    { name: 'Aprendendo', value: retentionCounts.learning, color: '#f0e266' },
    { name: 'Familiar', value: retentionCounts.familiar, color: '#466259' },
    { name: 'Dominado', value: retentionCounts.mastered, color: '#b4cc9b' },
  ].filter(d => d.value > 0)

  const activityData: Record<string, number> = {}
  typedSessions.forEach(session => {
    const dateStr = getAppDateString(session.completed_at)
    const interactions = session.correct_answers + session.wrong_answers
    if (!activityData[dateStr]) activityData[dateStr] = 0
    activityData[dateStr] += interactions
  })
  cardReviews?.forEach((review) => {
    if (review.total_reviews <= 0) return
    const dateStr = getAppDateString(review.review_date)
    if (!activityData[dateStr]) activityData[dateStr] = 0
    activityData[dateStr] += 1
  })

  const skillsCount: Record<string, { correct: number, total: number }> = {
    'Fala': { correct: 0, total: 0 },
    'Escuta': { correct: 0, total: 0 },
    'Escrita': { correct: 0, total: 0 },
    'Leitura': { correct: 0, total: 0 },
    'Memória': { correct: 0, total: 0 },
  }

  typedSessions.forEach(session => {
    const total = session.correct_answers + session.wrong_answers
    if (total === 0) return

    const mode = session.assignments?.game_mode || 'flashcard'
    let category = 'Memória'
    if (mode === 'speaking') category = 'Fala'
    else if (mode === 'listening') category = 'Escuta'
    else if (mode === 'typing') category = 'Escrita'
    else if (mode === 'multiple_choice' || mode === 'matching') category = 'Leitura'

    skillsCount[category].correct += session.correct_answers
    skillsCount[category].total += total
  })

  const radarSkillsData = Object.keys(skillsCount).map(key => {
    const stat = skillsCount[key]
    const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
    return { subject: key, A: pct, fullMark: 100 }
  })

  return (
    <div className="home-mobile-optimized historico-root relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-12 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#0a0a0a] dark:text-text">
      <div className={pageBgGridExplore} />
      <div className={pageBgGlowExplore} />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <HistoryHeader
          totalSessions={totalSessions}
          averageAccuracy={averageAccuracy}
          filterDate={filterDate}
        />

        <section className="grid gap-4 sm:grid-cols-3">
          <GlassStatCard
            kicker="Precisão"
            value={`${averageAccuracy}%`}
            description="Média consolidada de acertos nas sessões."
            icon={Target}
            valueClassName="text-primary"
          />
          <GlassStatCard
            kicker="Acertos"
            value={totalCorrect}
            description="Respostas corretas acumuladas no período."
            icon={Trophy}
          />
          <GlassStatCard
            kicker="Sequência"
            value={bestStreak}
            description="Maior sequência de acertos em uma sessão."
            icon={Zap}
            valueClassName="text-[var(--color-accent)]"
          />
        </section>

        {(chartData.length > 0 || retentionData.length > 0) && (
          <section id="graficos" className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            {chartData.length > 0 && (
              <GlassPanel>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={softKicker}>Progressão</p>
                    <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">
                      Evolução de acertos
                    </h2>
                    <p className="mt-2 text-sm text-text-muted dark:text-text-muted">
                      Percentual de precisão por sessão recente.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-border-muted/10 dark:border-border-accent/10 bg-card dark:bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-text-muted dark:text-text-muted shadow-sm">
                    {totalSessions} sessões
                  </span>
                </div>
                <div className="mt-6 h-72">
                  <HistoryChart data={chartData.reverse()} />
                </div>
              </GlassPanel>
            )}

            {retentionData.length > 0 && (
              <GlassPanel>
                <div>
                  <p className={softKicker}>Retenção</p>
                  <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">
                    Domínio de vocabulário
                  </h2>
                  <p className="mt-2 text-sm text-text-muted dark:text-text-muted">
                    Distribuição do conhecimento consolidado.
                  </p>
                </div>
                <div className="mt-6 flex flex-col items-center justify-center">
                  <RetentionChart data={retentionData} />
                </div>
              </GlassPanel>
            )}
          </section>
        )}

        {(radarSkillsData.length > 0 || Object.keys(activityData).length > 0) && (
          <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
            <GlassPanel>
              <div>
                <p className={softKicker}>Habilidades</p>
                <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">
                  Radar de competência
                </h2>
                <p className="mt-2 text-sm text-text-muted dark:text-text-muted">
                  Onde você concentra seus acertos.
                </p>
              </div>
              <div className="mt-6 flex flex-col items-center justify-center">
                <RadarSkillsChart data={radarSkillsData} />
              </div>
            </GlassPanel>

            <GlassPanel>
              <div>
                <p className={softKicker}>Consistência</p>
                <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">
                  Atividade (heatmap)
                </h2>
                <p className="mt-2 mb-6 text-sm text-text-muted dark:text-text-muted">
                  Seu volume de interações nas últimas 12 semanas.
                </p>
              </div>
              <ActivityHeatmap activityData={activityData} />
            </GlassPanel>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <GlassStatCard
            kicker="Sessões"
            value={totalSessions}
            description="Treinos registrados no histórico."
            icon={TrendingUp}
          />
          <GlassStatCard
            kicker="Erros"
            value={totalWrong}
            description="Respostas incorretas identificadas."
            icon={Percent}
          />
          <GlassStatCard
            kicker="Retenção SRS"
            value={retentionTotal}
            description="Cards em revisão espaçada ativa."
            icon={Flame}
            valueClassName="text-primary"
          />
        </section>

        <section id="sessoes" className="space-y-6 pt-2">
          <div>
            <p className={softKicker}>Sessões recentes</p>
            <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">
              Áreas de foco
            </h2>
            <p className="mt-2 max-w-xl text-sm text-text-muted dark:text-text-muted">
              Leitura rápida das suas sessões recentes e erros para revisar.
            </p>
          </div>

          <HistoryFocusAreaSection sessions={typedSessions} filterDate={filterDate} />
        </section>
      </div>
    </div>
  )
}