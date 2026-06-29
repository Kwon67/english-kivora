import {
  AlertCircle,
  BarChart3,
  BookOpen,
  LayoutList,
  Percent,
  Trophy,
} from 'lucide-react'
import { type CardReview } from '@/features/review/lib/spacedRepetition'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import { buildWeeklyLeaderboard, getLeaderboardTier } from '@/features/leaderboard/lib/leaderboard'
import type { SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
import type { GameSession, Pack, Profile } from '@/types/database.types'
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import AdminSectionHeader from '@/features/admin/components/AdminSectionHeader'
import {
  AdminBadge,
  AdminStatCard,
  accentBadge,
  glassTile,
  iconClass,
  nestedCardClass,
  neutralBadge,
  pageInner,
  pageRoot,
  sectionDivider,
  tableBodyRow,
  tableDivider,
  tableHeadRow,
} from '@/features/admin/lib/adminUi'
import ExportReportButton from './ExportReportButton'

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

const assignmentModeLabel: Record<string, string> = {
  multiple_choice: 'Múltipla escolha',
  flashcard: 'Flashcard',
  typing: 'Digitação',
  matching: 'Combinação',
  listening: 'Escuta',
  speaking: 'Fala',
}

export default async function AdminReportsPage() {
  const supabase = createAdminClient() ?? await createClient()
  const today = getAppDateString()
  const thirtyDaysAgo = shiftAppDate(today, -30)

  const [membersResult, reviewsResult, sessionsResult] = await Promise.all([
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
  ])

  if (membersResult.error || reviewsResult.error || sessionsResult.error) {
    console.error('Admin reports query failed', {
      membersError: membersResult.error,
      reviewsError: reviewsResult.error,
      sessionsError: sessionsResult.error,
    })
    throw new Error('Falha ao carregar os relatórios administrativos.')
  }

  const members = (membersResult.data ?? []).filter((member) => member.role !== 'admin')
  const reviews = (reviewsResult.data ?? []) as CardReview[]
  const typedRecentSessions = (sessionsResult.data ?? []) as unknown as ReportRecentSession[]

  const todayReviews = reviews.filter((review) => getAppDateString(review.review_date) === today)
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

  const weeklyLeaderboard = buildWeeklyLeaderboard(
    members.map((m) => ({ id: m.id, username: m.username })),
    typedRecentSessions.map((s) => ({
      user_id: s.user_id,
      correct_answers: s.correct_answers,
      wrong_answers: s.wrong_answers,
      max_streak: s.max_streak,
    }))
  ).slice(0, 8)

  const reportStats = [
    {
      label: 'Equipe ativa',
      value: members.length,
      icon: LayoutList,
      subtitle: 'Membros monitorados no período',
    },
    {
      label: 'Revisões hoje',
      value: todayReviews.length,
      icon: BookOpen,
      subtitle: 'Registradas no dia atual',
    },
    {
      label: 'Precisão',
      value: `${successRate}%`,
      icon: Percent,
      subtitle: `Qualidade média ${averageQuality.toFixed(1)}/5`,
    },
  ]

  return (
    <div className={pageRoot}>
      <div className={pageInner}>
        <AdminMotionSection>
          <AdminSectionHeader
            breadcrumb={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Relatórios' },
            ]}
            badge="Análise consolidada"
            title="Relatórios do programa"
            description="Retenção, precisão e engajamento dos últimos 30 dias."
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

        <AdminMotionSection className="grid gap-4 sm:grid-cols-3" stagger>
          {reportStats.map((stat) => (
            <AdminMotionItem key={stat.label}>
              <AdminStatCard
                label={stat.label}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
              />
            </AdminMotionItem>
          ))}
        </AdminMotionSection>

        <AdminMotionSection>
          <section className={`${glassTile} overflow-hidden`}>
            <div className={`flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${sectionDivider}`}>
              <div>
                <AdminBadge label="Ranking" />
                <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Ranking da semana</h2>
              </div>
              <span className={`${neutralBadge} inline-flex items-center gap-1.5`}>
                <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
                Últimos 7 dias
              </span>
            </div>
            <div className={tableDivider}>
              {weeklyLeaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-bg-primary sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-bg-primary font-heading text-sm font-bold text-brand-dark shadow-[2px_2px_0_var(--color-brand-dark)]">
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

        <AdminMotionSection className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" stagger>
          <AdminMotionItem>
            <section className={`${glassTile} p-4 sm:p-5`}>
              <div className="flex items-center justify-between gap-3">
                <AdminBadge label="Cards críticos" />
                <div className={iconClass}>
                  <AlertCircle className="h-4 w-4" strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {topWeakCards.map((card) => (
                  <div key={card.id} className={`${nestedCardClass} p-3`}>
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
            </section>
          </AdminMotionItem>

          <AdminMotionItem>
            <section className={`${glassTile} p-4 sm:p-5`}>
              <div className="flex items-center justify-between gap-3">
                <AdminBadge label="Packs difíceis" />
                <div className={iconClass}>
                  <BookOpen className="h-4 w-4" strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {weakestPacks.map((pack) => (
                  <div key={pack.packName} className={`${nestedCardClass} p-3`}>
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
            </section>
          </AdminMotionItem>

          <AdminMotionItem>
            <section className={`${glassTile} p-4 sm:p-5`}>
              <div className="flex items-center justify-between gap-3">
                <AdminBadge label="Dificuldade por modo" />
                <div className={iconClass}>
                  <LayoutList className="h-4 w-4" strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {weakestMemberModes.map((entry) => (
                  <div key={`${entry.username}-${entry.modeLabel}`} className={`${nestedCardClass} p-3`}>
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
            </section>
          </AdminMotionItem>
        </AdminMotionSection>

        <AdminMotionSection>
          <section className={`${glassTile} overflow-hidden`}>
            <div className={`px-4 py-5 sm:px-6 ${sectionDivider}`}>
              <AdminBadge label="Relatório por membro" />
              <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Resumo por membro</h2>
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