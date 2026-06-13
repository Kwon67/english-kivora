import Link from 'next/link'
import { ArrowLeft, Flame, Percent, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatAppDate } from '@/lib/timezone'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import HistoryChart from '@/features/review/components/HistoryChart'
import RetentionChart from '@/features/review/components/RetentionChart'
import ActivityHeatmap from '@/features/review/components/ActivityHeatmap'
import RadarSkillsChart from '@/features/review/components/RadarSkillsChart'
import { SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
import HistoryFocusAreaSection from '@/features/review/components/HistoryFocusAreaSection'
import { DecoBook, DecoGlobe, DecoLightbulb, DecoABC, DecoStar } from '@/components/ui/DecorativeSvgs'

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

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

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
    supabase.from('card_reviews').select('interval_days').eq('user_id', user.id)
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

  const retentionData = [
    { name: 'Aprendendo', value: retentionCounts.learning, color: '#f0e266' },
    { name: 'Familiar', value: retentionCounts.familiar, color: '#466259' },
    { name: 'Dominado', value: retentionCounts.mastered, color: '#b4cc9b' },
  ].filter(d => d.value > 0)

  // Heatmap Data Processing
  const activityData: Record<string, number> = {}
  typedSessions.forEach(session => {
    const dateStr = session.completed_at.split('T')[0]
    const interactions = session.correct_answers + session.wrong_answers
    if (!activityData[dateStr]) activityData[dateStr] = 0
    activityData[dateStr] += interactions
  })

  // Radar Chart Data Processing
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
    <div className="mx-auto max-w-4xl space-y-5 pb-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/home"
          transitionTypes={navBackTransitionTypes}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Kivora Inglês</p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">Análise de histórico</p>
            {filterDate && (
              <span className="rounded-full bg-[rgba(115,88,2,0.12)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-accent)]">
                {filterDate.split('-').reverse().join('/')}
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="premium-card relative overflow-hidden p-6 text-center">
          <DecoBook className="absolute top-3 left-3 w-8 h-8 opacity-50" />
          <p className="section-kicker mx-auto">Proficiência em Inglês</p>
          <p className="mt-5 text-4xl font-extrabold text-[var(--color-primary)]">{averageAccuracy}%</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Precisão média consolidada</p>
        </article>

        <article className="premium-card relative overflow-hidden p-6 text-center">
          <DecoABC className="absolute top-3 right-3 w-9 h-9 opacity-40" />
          <p className="section-kicker mx-auto">Total de acertos</p>
          <p className="mt-5 text-4xl font-extrabold text-[var(--color-text)]">{totalCorrect}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Respostas corretas acumuladas</p>
        </article>

        <article className="premium-card relative overflow-hidden p-6 text-center">
          <DecoStar className="absolute top-3 right-3 w-7 h-7 opacity-40" />
          <p className="section-kicker mx-auto">Melhor sequência</p>
          <p className="mt-5 text-4xl font-extrabold text-[var(--color-accent)]">{bestStreak}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Maior sequência em uma sessão</p>
        </article>
      </section>

      {(chartData.length > 0 || retentionData.length > 0) && (
        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          {chartData.length > 0 && (
            <article className="premium-card relative overflow-hidden p-6 sm:p-7">
              <DecoGlobe className="absolute top-4 right-4 w-8 h-8 opacity-40" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Progressão de rank</p>
                  <h1 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">Análise de Histórico</h1>
                </div>
                <div className="rounded-full bg-[var(--color-surface-container-low)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                  {totalSessions} sessões
                </div>
              </div>
              <div className="mt-6 h-72">
                <HistoryChart data={chartData.reverse()} />
              </div>
            </article>
          )}

          {retentionData.length > 0 && (
            <article className="premium-card relative overflow-hidden p-6 sm:p-7">
              <DecoLightbulb className="absolute top-4 right-4 w-7 h-7 opacity-40" />
              <div>
                <p className="section-kicker">Retenção de memória</p>
                <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Domínio de Vocabulário</h2>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">Distribuição do conhecimento consolidado.</p>
              </div>
              <div className="mt-6 flex flex-col items-center justify-center">
                <RetentionChart data={retentionData} />
              </div>
            </article>
          )}
        </section>
      )}

      {(radarSkillsData.length > 0 || Object.keys(activityData).length > 0) && (
        <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          <article className="premium-card relative overflow-hidden p-6 sm:p-7">
            <div>
              <p className="section-kicker">Distribuição de Habilidades</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Radar de Competência</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">Onde você concentra seus acertos.</p>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center">
              <RadarSkillsChart data={radarSkillsData} />
            </div>
          </article>

          <article className="premium-card relative overflow-hidden p-6 sm:p-7">
            <div>
              <p className="section-kicker">Consistência</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Atividade (Heatmap)</h2>
              <p className="mt-2 mb-6 text-sm text-[var(--color-text-muted)]">Seu volume de interações nas últimas 12 semanas.</p>
            </div>
            <ActivityHeatmap activityData={activityData} />
          </article>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="stitch-panel relative overflow-hidden p-5">
          <TrendingUp className="h-5 w-5 text-[var(--color-primary)]" />
          <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{totalSessions}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Sessões registradas</p>
        </article>
        <article className="stitch-panel relative overflow-hidden p-5">
          <Percent className="h-5 w-5 text-[var(--color-primary)]" />
          <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{totalWrong}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Erros identificados</p>
        </article>
        <article className="stitch-panel relative overflow-hidden p-5">
          <Flame className="h-5 w-5 text-[var(--color-accent)]" />
          <p className="mt-4 text-3xl font-extrabold text-[var(--color-text)]">{bestStreak}</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Foco máximo</p>
        </article>
      </section>

      <HistoryFocusAreaSection sessions={typedSessions} filterDate={filterDate} />
    </div>
  )
}
