import { redirect } from 'next/navigation'
import styles from '@/features/admin/components/AdminWorkspace.module.css'
import { WorkspaceList, WorkspaceTableBody } from '@/components/ui/WorkspacePagination'
import WorkspaceSections from '@/components/ui/WorkspaceSections'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  LayoutList,
  MousePointerClick,
  Percent,
  Target,
  Trophy,
} from 'lucide-react'
import { type CardReview } from '@/features/review/lib/spacedRepetition'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import { buildWeeklyLeaderboard, getLeaderboardTier } from '@/features/leaderboard/lib/leaderboard'
import type { SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
import type { GameSession, Pack, Profile } from '@/types/database.types'
import AdminMetric from '@/features/admin/components/AdminMetric'
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import SectionBadge from '@/components/ui/SectionBadge'
import {
  accentBadge,
  adminReportsIconBox,
  adminReportsLeaderboardRow,
  adminReportsRankBadge,
  adminReportsRankBadgeTop,
  adminReportsShell,
  adminReportsTelemetryBand,
  neutralBadge,
  sectionDivider,
  tableBodyRow,
  tableDivider,
  tableHeadRow,
} from '@/features/admin/lib/adminReportsUi'
import { homeIconGlyphSm } from '@/lib/homeStyles'
import ExportReportButton from './ExportReportButton'
import { readReportPages } from '@/features/admin/lib/reportPagination'
import ReportsHeader from './ReportsHeader'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ReportRecentSession = GameSession & {
  profiles: Pick<Profile, 'username'> | null
  assignments:
    | {
        game_mode: string
        packs: Pick<Pack, 'name'> | null
      }
    | null
  session_errors: SessionErrorLog[]
}

type LearningResourceEventRow = {
  user_id: string
  resource_id: string
  resource_title: string
  stage: string
  level: string | null
  resource_kind: string | null
  created_at: string
}

type LearningPlanHistoryReportRow = {
  user_id: string
  plan_date: string
  stage: string
  level: string | null
  outcome_status: string
  resource_ids: string[]
}

const assignmentModeLabel: Record<string, string> = {
  multiple_choice: 'Múltipla escolha',
  flashcard: 'Flashcard',
  typing: 'Digitação',
  matching: 'Combinação',
  listening: 'Escuta',
  speaking: 'Fala',
}

function isLearningIntelligenceTableMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false
  return error.code === '42P01' || /learning_resource_events|learning_plan_history/i.test(error.message || '')
}

function InsightPanel({
  badge,
  title,
  icon: Icon,
  children,
}: {
  badge: string
  title: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <section className={styles.insight}>
      <div className="mb-4 flex items-start gap-3">
        <span className={adminReportsIconBox}>
          <Icon className={homeIconGlyphSm} strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <SectionBadge label={badge} animate={false} />
          <h2 className="font-heading text-lg font-bold text-brand-dark sm:text-xl">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

export default async function AdminReportsPage() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await session.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/home')

  const supabase = createAdminClient()
  if (!supabase) throw new Error('A consulta administrativa está temporariamente indisponível.')
  const today = getAppDateString()
  const thirtyDaysAgo = shiftAppDate(today, -30)

  const [membersResult, reviewsResult, sessionsResult, resourceEventsResult, planHistoryResult] = await Promise.all([
    readReportPages((from, to) => supabase.from('profiles').select('id, username, role').order('username').order('id').range(from, to)),
    readReportPages((from, to) => supabase
      .from('card_reviews')
      .select('*')
      .gte('review_date', getAppDayStartUtcIso(thirtyDaysAgo))
      .order('review_date', { ascending: false }).order('id').range(from, to)),
    readReportPages((from, to) => supabase
      .from('game_sessions')
      .select('*, profiles(username), assignments(game_mode, packs(name)), session_errors(*, cards(english_phrase, portuguese_translation, audio_url))')
      .gte('completed_at', getAppDayStartUtcIso(thirtyDaysAgo))
      .order('completed_at', { ascending: false }).order('id').range(from, to)),
    supabase
      .from('learning_resource_events')
      .select('user_id,resource_id,resource_title,stage,level,resource_kind,created_at')
      .gte('created_at', getAppDayStartUtcIso(thirtyDaysAgo))
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('learning_plan_history')
      .select('user_id,plan_date,stage,level,outcome_status,resource_ids')
      .gte('plan_date', thirtyDaysAgo)
      .order('plan_date', { ascending: false })
      .limit(200),
  ])

  const resourceEventsError = resourceEventsResult.error
  const planHistoryError = planHistoryResult.error
  if (
    membersResult.error ||
    reviewsResult.error ||
    sessionsResult.error ||
    (resourceEventsError && !isLearningIntelligenceTableMissing(resourceEventsError)) ||
    (planHistoryError && !isLearningIntelligenceTableMissing(planHistoryError))
  ) {
    console.error('Admin reports query failed', {
      membersError: membersResult.error,
      reviewsError: reviewsResult.error,
      sessionsError: sessionsResult.error,
      resourceEventsError,
      planHistoryError,
    })
    throw new Error('Falha ao carregar os relatórios administrativos.')
  }

  const members = (membersResult.data ?? []).filter((member) => member.role !== 'admin')
  const reviews = (reviewsResult.data ?? []) as CardReview[]
  const typedRecentSessions = (sessionsResult.data ?? []) as unknown as ReportRecentSession[]
  const resourceEvents = resourceEventsError
    ? []
    : (resourceEventsResult.data ?? []) as LearningResourceEventRow[]
  const planHistory = planHistoryError
    ? []
    : (planHistoryResult.data ?? []) as LearningPlanHistoryReportRow[]

  const todayReviews = reviews.filter((review) => getAppDateString(review.review_date) === today)
  const todayResourceEvents = resourceEvents.filter((event) => getAppDateString(event.created_at) === today)
  const totalQuality = reviews.reduce((sum, review) => sum + review.quality, 0)
  const averageQuality = reviews.length > 0 ? totalQuality / reviews.length : 0
  const successRate =
    reviews.length > 0 ? Math.round((reviews.filter((review) => review.quality >= 3).length / reviews.length) * 100) : 0
  const bestRepetition = reviews.reduce((best, review) => Math.max(best, review.repetitions), 0)

  const memberRows = members.map((member) => {
    const memberReviews = reviews.filter((review) => review.user_id === member.id)
    const memberQualityTotal = memberReviews.reduce((sum, review) => sum + review.quality, 0)
    const memberAverageQuality = memberReviews.length > 0 ? memberQualityTotal / memberReviews.length : 0
    const memberGoodReviews = memberReviews.filter((review) => review.quality >= 3).length
    const memberGoodRate = memberReviews.length > 0
      ? Math.round((memberGoodReviews / memberReviews.length) * 100)
      : 0

    return {
      id: member.id,
      username: member.username,
      reviews: memberReviews.length,
      averageQuality: memberAverageQuality,
      goodRate: memberGoodRate,
      bestRepetition: memberReviews.reduce((best, review) => Math.max(best, review.repetitions), 0),
    }
  })

  const weaknessCardMap = new Map<string, { id: string; en: string; pt: string; count: number }>()
  const packWeaknessMap = new Map<string, { packName: string; correct: number; wrong: number; sessions: number }>()
  const memberModeWeaknessMap = new Map<string, { username: string; modeLabel: string; correct: number; wrong: number; sessions: number }>()

  for (const session of typedRecentSessions) {
    const packName = session.assignments?.packs?.name || null
    const modeLabel = assignmentModeLabel[session.assignments?.game_mode || ''] || session.assignments?.game_mode || 'Outro'
    const username = session.profiles?.username || 'Membro'

    if (packName) {
      const existing = packWeaknessMap.get(packName) || { packName, correct: 0, wrong: 0, sessions: 0 }
      existing.correct += session.correct_answers
      existing.wrong += session.wrong_answers
      existing.sessions += 1
      packWeaknessMap.set(packName, existing)
    }

    const memberModeKey = `${username}:${modeLabel}`
    const memberModeExisting = memberModeWeaknessMap.get(memberModeKey) || { username, modeLabel, correct: 0, wrong: 0, sessions: 0 }
    memberModeExisting.correct += session.correct_answers
    memberModeExisting.wrong += session.wrong_answers
    memberModeExisting.sessions += 1
    memberModeWeaknessMap.set(memberModeKey, memberModeExisting)

    for (const error of session.session_errors || []) {
      if (!error.card_id || !error.cards) continue
      const existing = weaknessCardMap.get(error.card_id) || {
        id: error.card_id,
        en: error.cards.english_phrase,
        pt: error.cards.portuguese_translation,
        count: 0,
      }
      existing.count += 1
      weaknessCardMap.set(error.card_id, existing)
    }
  }

  const topWeakCards = [...weaknessCardMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  const weakestPacks = [...packWeaknessMap.values()]
    .map((item) => ({
      ...item,
      total: item.correct + item.wrong,
      accuracy: item.correct + item.wrong > 0 ? Math.round((item.correct / (item.correct + item.wrong)) * 100) : 0,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5)
  const weakestMemberModes = [...memberModeWeaknessMap.values()]
    .map((item) => ({
      ...item,
      total: item.correct + item.wrong,
      accuracy: item.correct + item.wrong > 0 ? Math.round((item.correct / (item.correct + item.wrong)) * 100) : 0,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5)

  const resourceOpenMap = new Map<string, { resourceId: string; title: string; opens: number; level: string | null; kind: string | null }>()
  const resourceStageMap = new Map<string, number>()

  for (const event of resourceEvents) {
    const existing = resourceOpenMap.get(event.resource_id) || {
      resourceId: event.resource_id,
      title: event.resource_title,
      opens: 0,
      level: event.level,
      kind: event.resource_kind,
    }
    existing.opens += 1
    resourceOpenMap.set(event.resource_id, existing)
    resourceStageMap.set(event.stage, (resourceStageMap.get(event.stage) ?? 0) + 1)
  }

  const topLearningResources = [...resourceOpenMap.values()]
    .sort((a, b) => b.opens - a.opens)
    .slice(0, 5)
  const resourceStageRows = [...resourceStageMap.entries()]
    .map(([stage, opens]) => ({ stage, opens }))
    .sort((a, b) => b.opens - a.opens)
    .slice(0, 4)
  const planOutcomeMap = new Map<string, number>()
  const stalledPlanRows = planHistory
    .filter((plan) => plan.outcome_status === 'stalled')
    .slice(0, 5)
  const memberNameById = new Map(members.map((member) => [member.id, member.username || 'Membro']))

  for (const plan of planHistory) {
    planOutcomeMap.set(plan.outcome_status, (planOutcomeMap.get(plan.outcome_status) ?? 0) + 1)
  }

  const planOutcomeRows = [...planOutcomeMap.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  const weeklyLeaderboard = buildWeeklyLeaderboard(
    members.map((m) => ({ id: m.id, username: m.username })),
    typedRecentSessions.map((s) => ({
      user_id: s.user_id,
      correct_answers: s.correct_answers,
      wrong_answers: s.wrong_answers,
      max_streak: s.max_streak,
    }))
  ).slice(0, 8)

  return (
    <div className={`${adminReportsShell} ${styles.workspace}`}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-full space-y-6 pb-8 sm:space-y-8">
<AdminMotionSection>
          <ReportsHeader
            action={
              <ExportReportButton
                memberRows={memberRows}
                totalMembers={members.length}
                todayReviews={todayReviews.length}
                averageQuality={averageQuality}
                successRate={successRate}
                bestRepetition={bestRepetition}
                totalReviews={reviews.length}
                totalGoodReviews={reviews.filter((review) => review.quality >= 3).length}
              />
            }
          />
        </AdminMotionSection>

<WorkspaceSections label="Áreas dos relatórios" tabs={[{"id":"resumo","label":"Resumo","description":"Os principais indicadores de atividade e aprendizado.","icon":"chart","anchors":[]},{"id":"classificacao","label":"Ranking","description":"Desempenho da semana, com pontuação e precisão.","icon":"medal","anchors":["ranking"]},{"id":"diagnostico","label":"Aprendizado","description":"Identifique as dificuldades por frase, pack e modo de prática.","icon":"target","anchors":[]},{"id":"recursos","label":"Recursos IA","description":"Acompanhe o uso de recursos e os resultados dos planos.","icon":"sparkles","anchors":[]},{"id":"alunos","label":"Por membro","description":"Compare resultados individuais e consulte cada aluno.","icon":"users","anchors":["membros"]}]} >
<div className="workspace-panel-stack"><AdminMotionSection className={adminReportsTelemetryBand} stagger>
          <AdminMotionItem>
            <AdminMetric tone="tutor" label="Membros" value={String(members.length)} icon={LayoutList} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="review" label="Cards revisados hoje" value={String(todayReviews.length)} icon={BookOpen} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="success" label="Notas SRS ≥ 3" value={reviews.length ? `${successRate}%` : '—'} icon={Percent} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="streak" label="Nota média SRS" value={reviews.length ? `${averageQuality.toFixed(1)}/5` : '—'} icon={BarChart3} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="vocabulary" label="Cards acompanhados" value={reviews.length.toLocaleString()} icon={BookOpen} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="listening" label="Sessões" value={String(typedRecentSessions.length)} icon={LayoutList} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="speaking" label="Recursos hoje" value={String(todayResourceEvents.length)} icon={MousePointerClick} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="warning" label="Planos travados" value={String(stalledPlanRows.length)} icon={Target} />
          </AdminMotionItem>
        </AdminMotionSection><p className="text-sm text-brand-secondary">Indicadores SRS usam o último estado de cada card por pessoa no período. Não somam todas as tentativas nem medem proficiência. Um traço indica ausência de dados.</p></div>
<div className="workspace-panel-stack"><AdminMotionSection>
          <section id="ranking" className={`${styles.panel} scroll-mt-4 overflow-hidden`}>
            <div className={`flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${sectionDivider}`}>
              <div className="flex items-start gap-3">
                <span className={adminReportsIconBox}>
                  <Trophy className={homeIconGlyphSm} strokeWidth={1.5} />
                </span>
                <div>

                  <h2 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">Ranking da semana</h2>
                </div>
              </div>
              <span className={`${neutralBadge} inline-flex items-center gap-1.5`}>
                <Trophy className="h-3.5 w-3.5" strokeWidth={1.5} />
                Últimos 7 dias
              </span>
            </div>
            <WorkspaceList className={tableDivider}>
              {weeklyLeaderboard.map((entry) => (
                <div key={entry.userId} className={adminReportsLeaderboardRow}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`${adminReportsRankBadge} ${entry.rank <= 3 ? adminReportsRankBadgeTop : ''}`}
                    >
                      <Trophy className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-brand-dark">{entry.rank}º · {entry.username}</p>
                      <p className="mt-1 font-body text-xs text-brand-secondary">
                        {entry.sessions} sessões · {entry.accuracy}% precisão
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={accentBadge}>{entry.score} pts</span>
                    <span className={neutralBadge}>{getLeaderboardTier(entry.score)}</span>
                  </div>
                </div>
              ))}
            </WorkspaceList>
              {weeklyLeaderboard.length === 0 && (
                <div className="py-12 text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-brand-secondary" />
                  <p className="mt-3 font-body text-sm text-brand-secondary">
                    Ainda não há dados suficientes para o ranking semanal.
                  </p>
                </div>
              )}
          </section>
        </AdminMotionSection></div>
<div className="workspace-panel-stack"><AdminMotionSection className="grid gap-4 lg:grid-cols-2" stagger><AdminMotionItem>
            <InsightPanel badge="Cards críticos" title="Maior fricção" icon={AlertCircle}>
              <div className="min-w-0">
                {topWeakCards.map((card) => (
                  <div key={card.id} className={`${styles.insightRow}`}>
                    <p className="font-heading text-sm font-bold text-brand-dark">{card.en}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="font-body text-xs text-brand-secondary">{card.pt}</p>
                      <span className={neutralBadge}>{card.count}x</span>
                    </div>
                  </div>
                ))}
                {topWeakCards.length === 0 && (
                  <p className="py-8 text-center font-body text-sm text-brand-secondary">
                    Nenhum card crítico identificado.
                  </p>
                )}
              </div>
            </InsightPanel>
          </AdminMotionItem>
<AdminMotionItem>
            <InsightPanel badge="Packs difíceis" title="Menor acerto" icon={BookOpen}>
              <div className="min-w-0">
                {weakestPacks.map((pack) => (
                  <div key={pack.packName} className={`${styles.insightRow}`}>
                    <p className="font-heading text-sm font-bold text-brand-dark">{pack.packName}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-body text-xs text-brand-secondary">{pack.sessions} sessões</span>
                      <span className={accentBadge}>{pack.accuracy}% acerto</span>
                    </div>
                  </div>
                ))}
                {weakestPacks.length === 0 && (
                  <p className="py-8 text-center font-body text-sm text-brand-secondary">Sem dados de packs no período.</p>
                )}
              </div>
            </InsightPanel>
          </AdminMotionItem>
<AdminMotionItem>
            <InsightPanel badge="Dificuldade por modo" title="Por aluno" icon={LayoutList}>
              <div className="min-w-0">
                {weakestMemberModes.map((entry) => (
                  <div
                    key={`${entry.username}-${entry.modeLabel}`}
                    className={`${styles.insightRow}`}
                  >
                    <p className="font-heading text-sm font-bold text-brand-dark">{entry.username}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-body text-xs text-brand-secondary">{entry.modeLabel}</span>
                      <span className={accentBadge}>{entry.accuracy}% acerto</span>
                    </div>
                  </div>
                ))}
                {weakestMemberModes.length === 0 && (
                  <p className="py-8 text-center font-body text-sm text-brand-secondary">Sem dados de modos de jogo.</p>
                )}
              </div>
            </InsightPanel>
          </AdminMotionItem></AdminMotionSection></div>
<div className="workspace-panel-stack"><AdminMotionSection className="grid gap-4 lg:grid-cols-2" stagger><AdminMotionItem>
            <InsightPanel badge="Recursos inteligentes" title="Mais abertos" icon={MousePointerClick}>
              <div className="min-w-0">
                {topLearningResources.map((resource) => (
                  <div key={resource.resourceId} className={`${styles.insightRow}`}>
                    <p className="font-heading text-sm font-bold text-brand-dark">{resource.title}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-body text-xs text-brand-secondary">
                        {[resource.level, resource.kind].filter(Boolean).join(' · ') || 'Recurso'}
                      </span>
                      <span className={accentBadge}>{resource.opens} abertura{resource.opens === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                ))}
                {resourceStageRows.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {resourceStageRows.map((row) => (
                      <span key={row.stage} className={neutralBadge}>
                        {row.stage}: {row.opens}
                      </span>
                    ))}
                  </div>
                ) : null}
                {topLearningResources.length === 0 && (
                  <p className="py-8 text-center font-body text-sm text-brand-secondary">
                    Nenhum recurso inteligente aberto no período.
                  </p>
                )}
              </div>
            </InsightPanel>
          </AdminMotionItem>
<AdminMotionItem>
            <InsightPanel badge="Planos inteligentes" title="Resultado recente" icon={Target}>
              <div className="min-w-0">
                {planOutcomeRows.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {planOutcomeRows.map((row) => (
                      <span key={row.status} className={row.status === 'stalled' ? neutralBadge : accentBadge}>
                        {({ pending: 'Aguardando evidências', engaged: 'Em prática', improved: 'Indicadores melhoraram', stalled: 'Sem mudança observada' } as Record<string, string>)[row.status] || 'Sem classificação'}: {row.count}
                      </span>
                    ))}
                  </div>
                ) : null}
                {stalledPlanRows.map((plan) => (
                  <div
                    key={`${plan.user_id}-${plan.plan_date}-${plan.stage}`}
                    className={`${styles.insightRow}`}
                  >
                    <p className="font-heading text-sm font-bold text-brand-dark">
                      {memberNameById.get(plan.user_id) ?? 'Membro'}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-body text-xs text-brand-secondary">
                        {plan.stage}{plan.level ? ` · ${plan.level}` : ''}
                      </span>
                      <span className={neutralBadge}>{plan.plan_date}</span>
                    </div>
                  </div>
                ))}
                {planHistory.length === 0 && (
                  <p className="py-8 text-center font-body text-sm text-brand-secondary">
                    Nenhum plano inteligente registrado no período.
                  </p>
                )}
              </div>
            </InsightPanel>
          </AdminMotionItem></AdminMotionSection></div>
<div className="workspace-panel-stack"><AdminMotionSection>
          <section id="membros" className={`${styles.panel} scroll-mt-4 overflow-hidden`}>
            <div className={`px-4 py-5 sm:px-6 ${sectionDivider}`}>
              <div className="flex items-start gap-3">
                <span className={adminReportsIconBox}>
                  <LayoutList className={homeIconGlyphSm} strokeWidth={1.5} />
                </span>
                <div>

                  <h2 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">Resumo por membro</h2>
                </div>
              </div>
            </div>

            <div className="admin-table-scroll overflow-x-auto" role="region" aria-label="Resumo por membro" tabIndex={0}>

              <table role="table" className="admin-responsive-table w-full text-left text-sm">
                <thead>
                  <tr className={tableHeadRow}>
                    <th scope="col" className="px-5 py-3">Membro</th>
                    <th scope="col" className="px-3 py-3 text-center">Cards</th>
                    <th scope="col" className="px-3 py-3 text-center">Nota média SRS</th>
                    <th scope="col" className="px-3 py-3 text-center">Notas ≥ 3</th>
                    <th scope="col" className="px-5 py-3 text-center">Maior repetição</th>
                  </tr>
                </thead>
                <WorkspaceTableBody pageSize={4} columns={5} className={tableDivider}>
                  {memberRows.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-brand-secondary">Nenhum membro no relatório.</td></tr>
                  )}
                  {memberRows.map(
                    (row) =>
                      (row.reviews > 0 || row.username) && (
                        <tr key={row.id} className={tableBodyRow}>
                          <td data-label="Membro" className="px-5 py-3 font-heading font-bold text-brand-dark">{row.username}</td>
                          <td data-label="Cards" className="px-3 py-3 text-center font-semibold text-brand-secondary">
                            {row.reviews}
                          </td>
                          <td data-label="Nota média SRS" className="px-3 py-3 text-center">
                            <span className={accentBadge}>{row.reviews ? `${row.averageQuality.toFixed(1)}/5` : '—'}</span>
                          </td>
                          <td data-label="Notas ≥ 3" className="px-3 py-3 text-center">
                            <span className={neutralBadge}>{row.reviews ? `${row.goodRate}%` : '—'}</span>
                          </td>
                          <td data-label="Maior repetição" className="px-5 py-3 text-center font-semibold text-brand-secondary">
                            {row.bestRepetition}
                          </td>
                        </tr>
                      )
                  )}
                </WorkspaceTableBody>
              </table>
            </div>
          </section>
        </AdminMotionSection></div>
</WorkspaceSections>
</div>
    </div>
  )
}
