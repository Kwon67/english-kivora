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
import { getB2LearningPath } from '@/features/cefr/lib/b2Progress'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
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

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)] transition-all duration-300'
const softKicker =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]'

function HistoryBadge({ label }: { label: string }) {
  return (
    <div className="flex w-fit items-center">
      <span className="h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />
      <span className="h-px w-5 bg-brand-dark" />
      <span className={softKicker}>{label}</span>
      <span className="h-px w-5 bg-brand-dark" />
      <span className="h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />
    </div>
  )
}

function GlassStatCard({
  kicker,
  value,
  description,
  icon: Icon,
  valueClassName = 'text-brand-dark',
}: {
  kicker: string
  value: string | number
  description: string
  icon: ComponentType<{ className?: string }>
  valueClassName?: string
}) {
  return (
    <article
      className={`${glassTile} scroll-reveal group/stat p-5 hover:-translate-y-1`}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <HistoryBadge label={kicker} />
          <p className={`mt-4 font-heading text-3xl font-bold leading-none ${valueClassName}`}>{value}</p>
        </div>
        <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="relative z-10 mt-4 font-body text-sm text-brand-secondary">{description}</p>
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
      className={`${glassTile} scroll-fade relative overflow-hidden p-6 sm:p-7 ${className}`}
    >
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
    .select('id,completed_at,correct_answers,wrong_answers,max_streak,assignments(status,game_mode,packs(name,category,description),badges(name,icon_name)),session_errors(id,created_at,card_id,cards(english_phrase,portuguese_translation,audio_url))')
    .eq('user_id', user.id)

  if (filterDate) {
    query = query.gte('completed_at', `${filterDate}T00:00:00.000Z`).lte('completed_at', `${filterDate}T23:59:59.999Z`)
  } else {
    query = query.limit(50)
  }

  const [sessionsResult, cardsResult, cefrProfile, b2Path] = await Promise.all([
    query.order('completed_at', { ascending: false }),
    supabase.from('card_reviews').select('interval_days,review_date,total_reviews').eq('user_id', user.id),
    getUserCefrProfile(supabase, user.id, user.user_metadata),
    getB2LearningPath(supabase, user.id),
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
    { name: 'Aprendendo', value: retentionCounts.learning, color: 'rgb(213,224,107)' },
    { name: 'Familiar', value: retentionCounts.familiar, color: 'rgb(107,101,96)' },
    { name: 'Dominado', value: retentionCounts.mastered, color: 'rgb(28,25,21)' },
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
    'Gramática': { correct: 0, total: 0 },
    'Memória': { correct: 0, total: 0 },
  }

  const { isGrammarPack, isReadingComprehensionPack } = await import('@/features/game/lib/packPedagogy')

  typedSessions.forEach(session => {
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
    }
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
    <div className="home-mobile-optimized historico-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <HistoryMotionSection>
          <HistoryHeader
            totalSessions={totalSessions}
            averageAccuracy={averageAccuracy}
            filterDate={filterDate}
          />
        </HistoryMotionSection>

        <HistoryMotionSection className="grid gap-4 sm:grid-cols-3" stagger>
          <HistoryMotionItem>
            <GlassStatCard
              kicker="Precisão"
              value={`${averageAccuracy}%`}
              description="Média consolidada de acertos nas sessões."
              icon={Target}
            />
          </HistoryMotionItem>
          <HistoryMotionItem>
            <GlassStatCard
              kicker="Acertos"
              value={totalCorrect}
              description="Respostas corretas acumuladas no período."
              icon={Trophy}
            />
          </HistoryMotionItem>
          <HistoryMotionItem>
            <GlassStatCard
              kicker="Sequência"
              value={bestStreak}
              description="Maior sequência de acertos em uma sessão."
              icon={Zap}
            />
          </HistoryMotionItem>
        </HistoryMotionSection>

        <HistoryMotionSection className={`${glassTile} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <HistoryBadge label="Progresso CEFR" />
              <p className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                {cefrProfile.level ?? 'Em avaliação'}
              </p>
              <p className="mt-2 font-body text-sm text-brand-secondary">
                {cefrProfile.assessing
                  ? 'O nível é recalculado a cada revisão e lição.'
                  : cefrProfile.nextLevel
                    ? `${cefrProfile.progressToNext ?? 0}% rumo ao ${cefrProfile.nextLevel}`
                    : 'Nível B2 detectado no escopo atual.'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex sm:justify-end">
                <HistoryBadge label="Trilha B2" />
              </div>
              <p className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                {b2Path.b2Completed}/{b2Path.b2Total}
              </p>
              <p className="mt-2 font-body text-sm text-brand-secondary">{b2Path.nextMilestone}</p>
            </div>
          </div>
        </HistoryMotionSection>

        {(chartData.length > 0 || retentionData.length > 0) && (
          <HistoryMotionSection id="graficos" className="grid gap-4 lg:grid-cols-[1.5fr_1fr]" stagger>
            {chartData.length > 0 && (
              <HistoryMotionItem>
                <GlassPanel>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <HistoryBadge label="Progressão" />
                      <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                        Evolução de acertos
                      </h2>
                      <p className="mt-2 font-body text-sm text-brand-secondary">
                        Percentual de precisão por sessão recente.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-4 py-2 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
                      {totalSessions} sessões
                    </span>
                  </div>
                  <div className="mt-6 h-72">
                    <HistoryChart data={chartData.reverse()} />
                  </div>
                </GlassPanel>
              </HistoryMotionItem>
            )}

            {retentionData.length > 0 && (
              <HistoryMotionItem>
                <GlassPanel>
                  <div>
                    <HistoryBadge label="Retenção" />
                    <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                      Domínio de vocabulário
                    </h2>
                    <p className="mt-2 font-body text-sm text-brand-secondary">
                      Distribuição do conhecimento consolidado.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col items-center justify-center">
                    <RetentionChart data={retentionData} />
                  </div>
                </GlassPanel>
              </HistoryMotionItem>
            )}
          </HistoryMotionSection>
        )}

        {(radarSkillsData.length > 0 || Object.keys(activityData).length > 0) && (
          <HistoryMotionSection className="grid gap-4 lg:grid-cols-[1fr_1.5fr]" stagger>
            <HistoryMotionItem>
              <GlassPanel>
                <div>
                  <HistoryBadge label="Habilidades" />
                  <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                    Radar de competência
                  </h2>
                  <p className="mt-2 font-body text-sm text-brand-secondary">
                    Onde você concentra seus acertos.
                  </p>
                </div>
                <div className="mt-6 flex flex-col items-center justify-center">
                  <RadarSkillsChart data={radarSkillsData} />
                </div>
              </GlassPanel>
            </HistoryMotionItem>

            <HistoryMotionItem>
              <GlassPanel>
                <div>
                  <HistoryBadge label="Consistência" />
                  <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
                    Atividade (heatmap)
                  </h2>
                  <p className="mb-6 mt-2 font-body text-sm text-brand-secondary">
                    Seu volume de interações nas últimas 12 semanas.
                  </p>
                </div>
                <ActivityHeatmap activityData={activityData} />
              </GlassPanel>
            </HistoryMotionItem>
          </HistoryMotionSection>
        )}

        <HistoryMotionSection className="grid gap-4 sm:grid-cols-3" stagger>
          <HistoryMotionItem>
            <GlassStatCard
              kicker="Sessões"
              value={totalSessions}
              description="Treinos registrados no histórico."
              icon={TrendingUp}
            />
          </HistoryMotionItem>
          <HistoryMotionItem>
            <GlassStatCard
              kicker="Erros"
              value={totalWrong}
              description="Respostas incorretas identificadas."
              icon={Percent}
            />
          </HistoryMotionItem>
          <HistoryMotionItem>
            <GlassStatCard
              kicker="Retenção SRS"
              value={retentionTotal}
              description="Cards em revisão espaçada ativa."
              icon={Flame}
            />
          </HistoryMotionItem>
        </HistoryMotionSection>

        <HistoryMotionSection id="sessoes" className="space-y-6 pt-2">
          <div>
            <HistoryBadge label="Sessões recentes" />
            <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
              Áreas de foco
            </h2>
            <p className="mt-2 max-w-xl font-body text-sm text-brand-secondary">
              Leitura rápida das suas sessões recentes e erros para revisar.
            </p>
          </div>

          <HistoryFocusAreaSection sessions={typedSessions} filterDate={filterDate} />
        </HistoryMotionSection>
      </div>
    </div>
  )
}
