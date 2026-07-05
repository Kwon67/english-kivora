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
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import SectionBadge from '@/components/ui/SectionBadge'
import {
  accentBadge,
  adminReportsIconBox,
  adminReportsInsightCard,
  adminReportsLeaderboardRow,
  adminReportsPanel,
  adminReportsRankBadge,
  adminReportsRankBadgeTop,
  adminReportsShell,
  adminReportsTelemetryBand,
  adminReportsTelemetryCell,
  neutralBadge,
  nestedCardClass,
  sectionDivider,
  tableBodyRow,
  tableDivider,
  tableHeadRow,
} from '@/features/admin/lib/adminReportsUi'
import { homeIconGlyphSm } from '@/lib/homeStyles'
import ExportReportButton from './ExportReportButton'
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

function TelemetryMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className={adminReportsTelemetryCell}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-dark" strokeWidth={2.2} aria-hidden />
      </div>
      <p className="font-heading text-lg font-bold leading-none text-brand-dark sm:text-xl">{value}</p>
    </div>
  )
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
    <section className={`${adminReportsPanel} p-4 sm:p-5`}>
      <div className="mb-4 flex items-start gap-3">
        <span className={adminReportsIconBox}>
          <Icon className={homeIconGlyphSm} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <SectionBadge label={badge} animate={false} />
          <h2 className="mt-2 font-heading text-lg font-bold text-brand-dark sm:text-xl">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

export default async function AdminReportsPage() {
  const supabase = createAdminClient() ?? await createClient()
  const today = getAppDateString()
  const thirtyDaysAgo = shiftAppDate(today, -30)

  const [membersResult, reviewsResult, sessionsResult, resourceEventsResult, planHistoryResult] = await Promise.all([
    supabase.from('profiles').select('id, username, role').order('username'),
    supabase
      .from('card_reviews')
      .select('*')
      .gte('review_date', getAppDayStartUtcIso(thirtyDaysAgo))
      .order('review_date', { ascending: false }),
    supabase
      .from('game_sessions')
      .select('*, profiles(username), assignments(game_mode, packs(name)), session_errors(*, cards(english_phrase, portuguese_translation, audio_url))')
      .gte('completed_at', getAppDayStartUtcIso(thirtyDaysAgo))
      .order('completed_at', { ascending: false }),
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
    <div className={adminReportsShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl space-y-6 pb-8 animate-fade-in sm:space-y-8">
        <AdminMotionSection>
          <ReportsHeader
            totalMembers={members.length}
            todayReviews={todayReviews.length}
            successRate={successRate}
            averageQuality={averageQuality}
            totalReviews={reviews.length}
            totalSessions={typedRecentSessions.length}
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

        <AdminMotionSection className={adminReportsTelemetryBand} stagger>
          <AdminMotionItem>
            <TelemetryMetric label="Membros" value={String(members.length)} icon={LayoutList} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Revisões hoje" value={String(todayReviews.length)} icon={BookOpen} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Precisão" value={`${successRate}%`} icon={Percent} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Qualidade" value={`${averageQuality.toFixed(1)}/5`} icon={BarChart3} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Total revisões" value={reviews.length.toLocaleString()} icon={BookOpen} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Sessões" value={String(typedRecentSessions.length)} icon={LayoutList} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Recursos hoje" value={String(todayResourceEvents.length)} icon={MousePointerClick} />
          </AdminMotionItem>
          <AdminMotionItem>
            <TelemetryMetric label="Planos travados" value={String(stalledPlanRows.length)} icon={Target} />
          </AdminMotionItem>
        </AdminMotionSection>

        <AdminMotionSection>
          <section id="ranking" className={`${adminReportsPanel} scroll-mt-4 overflow-hidden`}>
            <div className={`flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${sectionDivider}`}>
              <div className="flex items-start gap-3">
                <span className={adminReportsIconBox}>
                  <Trophy className={homeIconGlyphSm} strokeWidth={2.2} />
                </span>
                <div>
                  <SectionBadge label="Ranking" animate={false} />
                  <h2 className="mt-2 font-heading text-xl font-bold text-brand-dark sm:text-2xl">Ranking da semana</h2>
                </div>
              </div>
              <span className={`${neutralBadge} inline-flex items-center gap-1.5`}>
                <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
                Últimos 7 dias
              </span>
            </div>
            <div className={tableDivider}>
              {weeklyLeaderboard.map((entry) => (
                <div key={entry.userId} className={adminReportsLeaderboardRow}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`${adminReportsRankBadge} ${entry.rank <= 3 ? adminReportsRankBadgeTop : ''}`}
                    >
                      #{entry.rank}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-brand-dark">{entry.username}</p>
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
              {weeklyLeaderboard.length === 0 && (
                <div className="py-12 text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-brand-secondary" />
                  <p className="mt-3 font-body text-sm text-brand-secondary">
                    Ainda não há dados suficientes para o ranking semanal.
                  </p>
                </div>
              )}
            </div>
          </section>
        </AdminMotionSection>

        <AdminMotionSection className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" stagger>
          <AdminMotionItem>
            <InsightPanel badge="Cards críticos" title="Maior fricção" icon={AlertCircle}>
              <div className="space-y-3">
                {topWeakCards.map((card) => (
                  <div key={card.id} className={`${adminReportsInsightCard} ${nestedCardClass} p-3`}>
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
              <div className="space-y-3">
                {weakestPacks.map((pack) => (
                  <div key={pack.packName} className={`${adminReportsInsightCard} ${nestedCardClass} p-3`}>
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
              <div className="space-y-3">
                {weakestMemberModes.map((entry) => (
                  <div
                    key={`${entry.username}-${entry.modeLabel}`}
                    className={`${adminReportsInsightCard} ${nestedCardClass} p-3`}
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
          </AdminMotionItem>

          <AdminMotionItem>
            <InsightPanel badge="Recursos inteligentes" title="Mais abertos" icon={MousePointerClick}>
              <div className="space-y-3">
                {topLearningResources.map((resource) => (
                  <div key={resource.resourceId} className={`${adminReportsInsightCard} ${nestedCardClass} p-3`}>
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
              <div className="space-y-3">
                {planOutcomeRows.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {planOutcomeRows.map((row) => (
                      <span key={row.status} className={row.status === 'stalled' ? neutralBadge : accentBadge}>
                        {row.status}: {row.count}
                      </span>
                    ))}
                  </div>
                ) : null}
                {stalledPlanRows.map((plan) => (
                  <div
                    key={`${plan.user_id}-${plan.plan_date}-${plan.stage}`}
                    className={`${adminReportsInsightCard} ${nestedCardClass} p-3`}
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
          </AdminMotionItem>
        </AdminMotionSection>

        <AdminMotionSection>
          <section id="membros" className={`${adminReportsPanel} scroll-mt-4 overflow-hidden`}>
            <div className={`px-4 py-5 sm:px-6 ${sectionDivider}`}>
              <div className="flex items-start gap-3">
                <span className={adminReportsIconBox}>
                  <LayoutList className={homeIconGlyphSm} strokeWidth={2.2} />
                </span>
                <div>
                  <SectionBadge label="Relatório por membro" animate={false} />
                  <h2 className="mt-2 font-heading text-xl font-bold text-brand-dark sm:text-2xl">Resumo por membro</h2>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className={tableHeadRow}>
                    <th className="px-5 py-3">Membro</th>
                    <th className="px-3 py-3 text-center">Revisões</th>
                    <th className="px-3 py-3 text-center">Qualidade média</th>
                    <th className="px-3 py-3 text-center">Taxa boa</th>
                    <th className="px-5 py-3 text-center">Maior repetição</th>
                  </tr>
                </thead>
                <tbody className={tableDivider}>
                  {memberRows.map(
                    (row) =>
                      (row.reviews > 0 || row.username) && (
                        <tr key={row.id} className={tableBodyRow}>
                          <td className="px-5 py-3 font-heading font-bold text-brand-dark">{row.username}</td>
                          <td className="px-3 py-3 text-center font-semibold text-brand-secondary">
                            {row.reviews}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={accentBadge}>{row.averageQuality.toFixed(1)}/5</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={neutralBadge}>{row.goodRate}%</span>
                          </td>
                          <td className="px-5 py-3 text-center font-semibold text-brand-secondary">
                            {row.bestRepetition}
                          </td>
                        </tr>
                      )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </AdminMotionSection>
      </div>
    </div>
  )
}
