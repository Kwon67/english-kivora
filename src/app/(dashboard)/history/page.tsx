import WorkspaceSections from '@/components/ui/WorkspaceSections'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { appDateRange, formatAppDate, getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import { readReportPages } from '@/features/admin/lib/reportPagination'
import HistoryChart from '@/features/review/components/HistoryChart'
import RetentionChart from '@/features/review/components/RetentionChart'
import ActivityHeatmap from '@/features/review/components/ActivityHeatmap'
import StudyQualityHeatmap from '@/features/study/components/StudyQualityHeatmap'
import { loadStudyEvidence } from '@/features/study/lib/studyEvidence'
import { aggregateStudyDays } from '@/features/study/lib/studyQuality'
import RadarSkillsChart from '@/features/review/components/RadarSkillsChart'
import { SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
import HistoryFocusAreaSection from '@/features/review/components/HistoryFocusAreaSection'
import { getB2LearningPath } from '@/features/cefr/lib/b2Progress'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import ProgressReportPanel from './ProgressReportPanel'
import { buildProgressReport } from '@/features/review/lib/progressReport'
import styles from './History.module.css'
import HistoryHeader from './HistoryHeader'
import PracticePortfolioHistory from '@/features/curriculum/components/PracticePortfolioHistory'
import ContextPracticeHistory from '@/features/study/components/ContextPracticeHistory'

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

  const range = appDateRange((await searchParams).date)
  const filterDate = range?.date
  const today = getAppDateString()
  const since = shiftAppDate(today, -364)

  const sessionQuery = () => supabase
    .from('game_sessions')
    .select('id,completed_at,correct_answers,wrong_answers,max_streak,assignments(status,game_mode,packs(name,category,description),badges(name,icon_name)),session_errors(id,created_at,card_id,cards(english_phrase,portuguese_translation,audio_url))')
    .eq('user_id', user.id)

  const [sessionsResult, studyEvidence, cefrProfile, b2Path, reportReviews, reportSessions] =
    await Promise.all([
      range ? readReportPages((from, to) => sessionQuery()
        .gte('completed_at', range.start).lt('completed_at', range.end)
        .order('completed_at', { ascending: false }).order('id').range(from, to))
        : sessionQuery().order('completed_at', { ascending: false }).order('id').limit(50),
      loadStudyEvidence(supabase, user.id, getAppDayStartUtcIso(since)).catch((error: unknown) => {
        console.error('History study evidence query failed', error)
        return null
      }),
      getUserCefrProfile(supabase, user.id, user.user_metadata),
      getB2LearningPath(supabase, user.id),
      // Queries próprias do relatório, de propósito: a consulta acima não traz card_id (necessário
      // para colapsar frases repetidas) e o log de partidas dela é limitado a 50 e filtrável por
      // data — o relatório mudaria conforme o filtro do usuário, o que seria enganoso.
      readReportPages((from, to) => supabase
        .from('card_reviews')
        .select('card_id,interval_days,repetitions,cards(english_phrase)')
        .eq('user_id', user.id).order('card_id').range(from, to)),
      readReportPages((from, to) => supabase
        .from('game_sessions')
        .select('correct_answers,wrong_answers')
        .eq('user_id', user.id)
        .order('completed_at').order('id').range(from, to)),
    ])

  type ReportReviewRow = {
    card_id: string
    interval_days: number | null
    repetitions: number | null
    cards: { english_phrase: string | null } | null
  }
  const reportRows = (reportReviews.data ?? []) as unknown as ReportReviewRow[]
  const progressReport = reportReviews.error || reportSessions.error ? null : buildProgressReport({
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

  if (sessionsError) {
    console.error('History page query failed', { userId: user.id, sessionsError })
    throw new Error('Falha ao carregar o histórico do usuário.')
  }

  const typedSessions = (sessions ?? []) as unknown as HistorySession[]

  const chartData = typedSessions
    .filter((session) => session.correct_answers + session.wrong_answers > 0)
    .reverse()
    .map((session) => ({
      date: formatAppDate(session.completed_at, { day: '2-digit', month: '2-digit' }),
      acerto: Math.round(session.correct_answers * 100 / (session.correct_answers + session.wrong_answers)),
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
  const retentionCounts = progressReport?.buckets
  const retentionTotal = progressReport?.phrasesTotal ?? '—'

  const retentionData = retentionCounts ? [
    { name: 'Aprendendo', value: retentionCounts.learning, color: 'var(--streak-accent)' },
    { name: 'Familiar', value: retentionCounts.familiar, color: 'var(--listening-accent)' },
    { name: 'Intervalo longo', value: retentionCounts.mastered, color: 'var(--review-accent)' },
  ].filter((d) => d.value > 0) : []

  const studyDays = studyEvidence === null ? null : aggregateStudyDays(studyEvidence)
  const activityData = Object.fromEntries((studyDays ?? []).map((day) => [
    day.date, day.correct + day.wrong + day.selfReviews,
  ]))

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
    return { subject: key, A: pct, total: stat.total }
  })

  const cefrProgress = cefrProfile.assessing ? 0 : (cefrProfile.progressToNext ?? 0)
  const b2Progress = b2Path.b2Total > 0 ? Math.round((b2Path.b2Completed / b2Path.b2Total) * 100) : 0

  const metrics = [
    ['Precisão', totalCorrect + totalWrong > 0 ? `${averageAccuracy}%` : '—'],
    ['Sessões', totalSessions],
    ['Acertos', totalCorrect],
    ['Erros', totalWrong],
    ['Melhor sequência', bestStreak],
    ['Frases em revisão', retentionTotal],
  ]

  return (
    <div className={styles.history}>
      <HistoryHeader filterDate={filterDate} />
      <WorkspaceSections label="Seu progresso" tabs={[
        { id: 'resumo', label: 'Resumo', description: '', icon: 'chart' },
        { id: 'evolucao', label: 'Evolução', description: '', icon: 'course', anchors: ['graficos'] },
        { id: 'habilidades', label: 'Tipos de prática', description: '', icon: 'target' },
        { id: 'atividade', label: 'Atividade', description: '', icon: 'calendar', anchors: ['heatmaps'] },
        { id: 'foco', label: 'Revisar erros', description: '', icon: 'list', anchors: ['sessoes'] },
      ]}>
        <div className={styles.stack}>
          <section aria-labelledby="history-metrics">
            <h2 id="history-metrics">{filterDate ? 'Indicadores do dia' : 'Sessões recentes'}</h2>
            <dl className={styles.metrics}>
              {metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            <p className={styles.hint}>O total de frases em revisão considera todo o seu histórico.</p>
          </section>
          {progressReport ? <ProgressReportPanel report={progressReport} /> :
            <p role="status">Não foi possível carregar o relatório completo. Atualize a página para tentar novamente.</p>}
          <ContextPracticeHistory db={supabase} userId={user.id} />
          <PracticePortfolioHistory key={user.id} userId={user.id} />
        </div>
        <div className={styles.stack}>
          <section className={styles.levels} aria-label="Evolução de nível">
            <div>
              <h2>Estimativa de nível</h2>
              <p className={styles.emphasis}>{cefrProfile.level ?? 'Em avaliação'}</p>
              <p>{cefrProfile.assessing
                ? 'Recalculada a cada revisão e lição.'
                : cefrProfile.nextLevel
                  ? `${cefrProgress}% rumo ao ${cefrProfile.nextLevel}`
                  : `Estimativa ${cefrProfile.level ?? 'em avaliação'} no escopo atual.`}</p>
              <p className={styles.hint}>Indicador baseado nos exercícios registrados, sem certificação CEFR.</p>
              {!cefrProfile.assessing && cefrProfile.nextLevel &&
                <div className={styles.bar} role="progressbar" aria-label="Progresso de nível" aria-valuenow={cefrProgress}>
                  <span style={{ width: `${Math.max(4, cefrProgress)}%` }} />
                </div>}
            </div>
            <div>
              <h2>Trilha B2</h2>
              <p className={styles.emphasis}>{b2Path.b2Completed}/{b2Path.b2Total}</p>
              <p>{b2Path.nextMilestone}</p>
              <div className={styles.bar} role="progressbar" aria-label="Progresso na trilha B2" aria-valuenow={b2Progress}>
                <span style={{ width: `${Math.max(b2Path.b2Total > 0 ? 4 : 0, b2Progress)}%` }} />
              </div>
            </div>
          </section>
          <div id="graficos" className={styles.charts}>
            <article>
              <h2>Evolução de acertos</h2>
              <p className={styles.hint}>Precisão por sessão · {chartData.length} {chartData.length === 1 ? 'sessão' : 'sessões'}</p>
              <HistoryChart data={chartData} />
            </article>
            <article>
              <h2>Estágios da revisão</h2>
              <p className={styles.hint}>Distribuição das frases pelo intervalo de revisão.</p>
              {retentionCounts ? <RetentionChart data={retentionData} /> : <p role="status">Distribuição indisponível no momento.</p>}
            </article>
          </div>
        </div>
        <div className={styles.stack}>
          <article>
            <h2>Resultados por tipo de prática</h2>
            <p className={styles.hint}>Acertos por modo de exercício. Conversação espontânea e escrita livre ficam fora desta estimativa.</p>
            <RadarSkillsChart data={radarSkillsData} />
          </article>
        </div>
        <div id="heatmaps" className={styles.stack}>
          {studyDays === null ? (
            <p role="status">Não foi possível carregar os mapas de estudo. Atualize a página para tentar novamente.</p>
          ) : (
            <>
              <StudyQualityHeatmap days={studyDays} today={today} since={since} />
              <article>
                <h2>Volume de estudo</h2>
                <ActivityHeatmap activityData={activityData} />
              </article>
            </>
          )}
        </div>
        <div id="sessoes" className={styles.stack}>
          <HistoryFocusAreaSection sessions={typedSessions} filterDate={filterDate} />
        </div>
      </WorkspaceSections>
    </div>
  )
}
