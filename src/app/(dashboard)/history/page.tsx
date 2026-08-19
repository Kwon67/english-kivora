import type { ComponentType } from 'react'
import { redirect } from 'next/navigation'
import { Flame, Percent, Target, TrendingUp, Trophy, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatAppDate } from '@/lib/timezone'
import HistoryChart from '@/features/review/components/HistoryChart'
import RetentionChart from '@/features/review/components/RetentionChart'
import ActivityHeatmap from '@/features/review/components/ActivityHeatmap'
import { buildActivityData } from '@/features/review/lib/activityHeatmap'
import RadarSkillsChart from '@/features/review/components/RadarSkillsChart'
import { SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
import HistoryFocusAreaSection from '@/features/review/components/HistoryFocusAreaSection'
import { getB2LearningPath } from '@/features/cefr/lib/b2Progress'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import SectionBadge from '@/components/ui/SectionBadge'
import ProgressReportPanel from './ProgressReportPanel'
import { buildProgressReport } from '@/features/review/lib/progressReport'
import {
  historyCefrTrack,
  historyChartBadge,
  historyIconBox,
  historyMilestoneBar,
  historyPanel,
  historySectionTitle,
  historyShell,
  historyTelemetryBand,
  historyTelemetryCell,
} from '@/features/history/lib/historyUi'
import HistoryHeader from './HistoryHeader'
import { HistoryMotionItem, HistoryMotionSection } from './HistoryMotion'

type HistorySession = {
  id: string
  completed_at: string
  correct_answers: number
  wrong_answers: number
  max_streak: number
  assignments: {
    status: string
    game_mode: string
    packs: { name: string; category?: string | null; description?: string | null } | null
    badges: { name: string; icon_name: string } | null
  } | null
  session_errors: SessionErrorLog[]
}

function TelemetryMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className={historyTelemetryCell}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">{label}</p>
        <span className={`h-7 w-7 shrink-0 ${historyIconBox}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="font-heading text-xl font-bold tabular-nums leading-none text-brand-dark sm:text-2xl">{value}</p>
    </div>
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
    .select('id,completed_at,correct_answers,wrong_answers,max_streak,assignments(status,game_mode,packs(name,category,description),badges(name,icon_name)),session_errors(id,created_at,card_id,cards(english_phrase,portuguese_translation,audio_url))')
    .eq('user_id', user.id)

  if (filterDate) {
    query = query.gte('completed_at', `${filterDate}T00:00:00.000Z`).lte('completed_at', `${filterDate}T23:59:59.999Z`)
  } else {
    query = query.limit(50)
  }

  const [sessionsResult, cardsResult, cefrProfile, b2Path, reportReviews, reportSessions] =
    await Promise.all([
      query.order('completed_at', { ascending: false }),
      supabase.from('card_reviews').select('interval_days,review_date,total_reviews').eq('user_id', user.id),
      getUserCefrProfile(supabase, user.id, user.user_metadata),
      getB2LearningPath(supabase, user.id),
      // Queries próprias do relatório, de propósito: a consulta acima não traz card_id (necessário
      // para colapsar frases repetidas) e o log de partidas dela é limitado a 50 e filtrável por
      // data — o relatório mudaria conforme o filtro do usuário, o que seria enganoso.
      supabase
        .from('card_reviews')
        .select('card_id,interval_days,repetitions,cards(english_phrase)')
        .eq('user_id', user.id),
      supabase
        .from('game_sessions')
        .select('correct_answers,wrong_answers')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: true }),
    ])

  type ReportReviewRow = {
    card_id: string
    interval_days: number | null
    repetitions: number | null
    cards: { english_phrase: string | null } | null
  }
  const reportRows = (reportReviews.data ?? []) as unknown as ReportReviewRow[]
  const progressReport = buildProgressReport({
    cards: reportRows.map((row) => ({
      cardId: row.card_id,
      intervalDays: row.interval_days ?? 0,
      repetitions: row.repetitions ?? 0,
    })),
    phraseByCardId: Object.fromEntries(
      reportRows.map((row) => [row.card_id, row.cards?.english_phrase ?? ''])
    ),
    sessions: (reportSessions.data ?? []).map((s) => ({
      correct: s.correct_answers ?? 0,
      wrong: s.wrong_answers ?? 0,
    })),
  })

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

  // Vem do mesmo relatório do painel acima, de propósito. Este bloco calculava a própria
  // distribuição com outro limite (14 dias) e contando LINHAS de card_reviews — então a mesma
  // página exibia dois valores diferentes para "Dominado", um no painel e outro no gráfico.
  const retentionCounts = progressReport.buckets
  const retentionTotal = progressReport.phrasesTotal

  const retentionData = [
    { name: 'Aprendendo', value: retentionCounts.learning, color: 'rgb(213,224,107)' },
    { name: 'Familiar', value: retentionCounts.familiar, color: 'rgb(107,101,96)' },
    { name: 'Dominado', value: retentionCounts.mastered, color: 'rgb(28,25,21)' },
  ].filter((d) => d.value > 0)

  const activityData = buildActivityData(typedSessions, cardReviews || [])

  const skillsCount: Record<string, { correct: number; total: number }> = {
    Fala: { correct: 0, total: 0 },
    Escuta: { correct: 0, total: 0 },
    Escrita: { correct: 0, total: 0 },
    Leitura: { correct: 0, total: 0 },
    Gramática: { correct: 0, total: 0 },
    Memória: { correct: 0, total: 0 },
  }

  const { isGrammarPack, isReadingComprehensionPack } = await import('@/features/game/lib/packPedagogy')

  typedSessions.forEach((session) => {
    const total = session.correct_answers + session.wrong_answers
    if (total === 0) return

    const mode = session.assignments?.game_mode || 'flashcard'
    const packMeta = session.assignments?.packs as
      | { category?: string | null; description?: string | null }
      | null
      | undefined

    let category = 'Memória'
    if (mode === 'speaking') category = 'Fala'
    else if (mode === 'listening') category = 'Escuta'
    else if (mode === 'typing') category = 'Escrita'
    else if (mode === 'multiple_choice' && isGrammarPack(packMeta?.category)) category = 'Gramática'
    else if (
      mode === 'multiple_choice' &&
      isReadingComprehensionPack(packMeta?.category, packMeta?.description)
    ) {
      category = 'Leitura'
    } else if (mode === 'multiple_choice' || mode === 'matching') category = 'Leitura'

    skillsCount[category].correct += session.correct_answers
    skillsCount[category].total += total
  })

  const radarSkillsData = Object.keys(skillsCount).map((key) => {
    const stat = skillsCount[key]
    const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
    return { subject: key, A: pct, fullMark: 100 }
  })

  const cefrProgress = cefrProfile.assessing ? 0 : (cefrProfile.progressToNext ?? 0)
  const b2Progress = b2Path.b2Total > 0 ? Math.round((b2Path.b2Completed / b2Path.b2Total) * 100) : 0

  return (
    <div className={historyShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-12 animate-fade-in sm:space-y-8">
        <HistoryMotionSection>
          <HistoryHeader filterDate={filterDate} />
        </HistoryMotionSection>

        <HistoryMotionSection className={historyTelemetryBand} stagger>
          <HistoryMotionItem>
            <TelemetryMetric label="Precisão" value={`${averageAccuracy}%`} icon={Target} />
          </HistoryMotionItem>
          <HistoryMotionItem>
            <TelemetryMetric label="Acertos" value={totalCorrect} icon={Trophy} />
          </HistoryMotionItem>
          <HistoryMotionItem>
            <TelemetryMetric label="Sequência" value={bestStreak} icon={Zap} />
          </HistoryMotionItem>
          <HistoryMotionItem>
            <TelemetryMetric label="Sessões" value={totalSessions} icon={TrendingUp} />
          </HistoryMotionItem>
          <HistoryMotionItem>
            <TelemetryMetric label="Erros" value={totalWrong} icon={Percent} />
          </HistoryMotionItem>
          <HistoryMotionItem>
            <TelemetryMetric label="SRS" value={retentionTotal} icon={Flame} />
          </HistoryMotionItem>
        </HistoryMotionSection>

        <HistoryMotionSection>
          <ProgressReportPanel report={progressReport} />
        </HistoryMotionSection>

        <HistoryMotionSection>
          <div className={historyCefrTrack}>
            <div className="min-w-0">
              <SectionBadge label="Progresso CEFR" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                {cefrProfile.level ?? 'Em avaliação'}
              </p>
              <p className="mt-2 font-body text-sm text-brand-secondary">
                {cefrProfile.assessing
                  ? 'O nível é recalculado a cada revisão e lição.'
                  : cefrProfile.nextLevel
                    ? `${cefrProgress}% rumo ao ${cefrProfile.nextLevel}`
                    : 'Nível B2 detectado no escopo atual.'}
              </p>
              {!cefrProfile.assessing && cefrProfile.nextLevel ? (
                <div className={historyMilestoneBar}>
                  <div
                    className="h-full rounded-full bg-brand-dark transition-all duration-500"
                    style={{ width: `${Math.max(4, cefrProgress)}%` }}
                  />
                </div>
              ) : null}
            </div>
            <div className="min-w-0 sm:border-l sm:border-brand-dark/20 sm:pl-6">
              <SectionBadge label="Trilha B2" />
              <p className="mt-3 font-heading text-2xl font-bold tabular-nums text-brand-dark sm:text-3xl">
                {b2Path.b2Completed}/{b2Path.b2Total}
              </p>
              <p className="mt-2 font-body text-sm text-brand-secondary">{b2Path.nextMilestone}</p>
              <div className={historyMilestoneBar}>
                <div
                  className="h-full rounded-full bg-brand-accent transition-all duration-500"
                  style={{ width: `${Math.max(b2Path.b2Total > 0 ? 4 : 0, b2Progress)}%` }}
                />
              </div>
            </div>
          </div>
        </HistoryMotionSection>

        {(chartData.length > 0 || retentionData.length > 0) && (
          <HistoryMotionSection id="graficos" className="grid gap-4 lg:grid-cols-[1.5fr_1fr]" stagger>
            {chartData.length > 0 && (
              <HistoryMotionItem>
                <article className={historyPanel}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <SectionBadge label="Progressão" />
                      <h2 className={`${historySectionTitle} mt-3`}>Evolução de acertos</h2>
                      <p className="mt-2 font-body text-sm text-brand-secondary">
                        Percentual de precisão por sessão recente.
                      </p>
                    </div>
                    <span className={historyChartBadge}>{totalSessions} sessões</span>
                  </div>
                  <div className="mt-6 h-72">
                    <HistoryChart data={chartData.reverse()} />
                  </div>
                </article>
              </HistoryMotionItem>
            )}

            {retentionData.length > 0 && (
              <HistoryMotionItem>
                <article className={historyPanel}>
                  <div>
                    <SectionBadge label="Retenção" />
                    <h2 className={`${historySectionTitle} mt-3`}>Domínio de vocabulário</h2>
                    <p className="mt-2 font-body text-sm text-brand-secondary">
                      Distribuição do conhecimento consolidado.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col items-center justify-center">
                    <RetentionChart data={retentionData} />
                  </div>
                </article>
              </HistoryMotionItem>
            )}
          </HistoryMotionSection>
        )}

        {(radarSkillsData.length > 0 || Object.keys(activityData).length > 0) && (
          <HistoryMotionSection className="grid gap-4 lg:grid-cols-[1fr_1.5fr]" stagger>
            <HistoryMotionItem>
              <article className={historyPanel}>
                <div>
                  <SectionBadge label="Habilidades" />
                  <h2 className={`${historySectionTitle} mt-3`}>Radar de competência</h2>
                  <p className="mt-2 font-body text-sm text-brand-secondary">
                    Onde você concentra seus acertos.
                  </p>
                </div>
                <div className="mt-6 flex flex-col items-center justify-center">
                  <RadarSkillsChart data={radarSkillsData} />
                </div>
              </article>
            </HistoryMotionItem>

            <HistoryMotionItem>
              <article className={historyPanel}>
                <div>
                  <SectionBadge label="Consistência" />
                  <h2 className={`${historySectionTitle} mt-3`}>Atividade (heatmap)</h2>
                  <p className="mt-2 font-body text-sm text-brand-secondary">
                    Seu volume de interações nas últimas 12 semanas.
                  </p>
                </div>
                <div className="mt-6">
                  <ActivityHeatmap activityData={activityData} />
                </div>
              </article>
            </HistoryMotionItem>
          </HistoryMotionSection>
        )}

        <HistoryMotionSection id="sessoes" className="space-y-4 pt-2 sm:space-y-5">
          <div>
            <SectionBadge label="Linha do tempo" />
            <h2 className={`${historySectionTitle} mt-3`}>Áreas de foco</h2>
            <p className="mt-2 max-w-xl font-body text-sm text-brand-secondary">
              Sessões recentes e erros para revisar — organizados em ordem cronológica.
            </p>
          </div>

          <HistoryFocusAreaSection sessions={typedSessions} filterDate={filterDate} />
        </HistoryMotionSection>
      </div>
    </div>
  )
}