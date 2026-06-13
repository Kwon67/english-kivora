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

const nestedCardClass =
  'rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-3 transition-colors hover:border-[var(--color-border-hover)]'

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
      accent: 'bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)] border-[var(--color-border)]',
      subtitle: 'Membros monitorados no período',
    },
    {
      label: 'Revisões hoje',
      value: todayReviews.length,
      icon: BookOpen,
      accent: 'bg-[var(--color-secondary-container)] text-[var(--color-secondary)] border-[var(--color-secondary-container)]',
      subtitle: 'Registradas no dia atual',
    },
    {
      label: 'Precisão',
      value: `${successRate}%`,
      icon: Percent,
      accent: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary-light)]',
      subtitle: `Qualidade média ${averageQuality.toFixed(1)}/5`,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Análise consolidada</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Relatórios do programa
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Retenção, precisão e engajamento dos últimos 30 dias.
          </p>
        </div>
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
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {reportStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--color-border-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{stat.value}</p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${stat.accent}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">{stat.subtitle}</p>
            </div>
          )
        })}
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">Ranking</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--color-text)]">Ranking da semana</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
            <Trophy className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={2} />
            Últimos 7 dias
          </span>
        </div>
        <div className="divide-y divide-[var(--color-border)]/30">
          {weeklyLeaderboard.map((entry) => (
            <div
              key={entry.userId}
              className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-container-low)] sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-container-high)] text-sm font-bold text-[var(--color-text-muted)]">
                  #{entry.rank}
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text)]">{entry.username}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {entry.sessions} sessões · {entry.accuracy}% precisão
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full border border-[var(--color-primary-light)] bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                  {entry.score} pts
                </span>
                <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text-muted)]">
                  {getLeaderboardTier(entry.score)}
                </span>
              </div>
            </div>
          ))}
          {weeklyLeaderboard.length === 0 && (
            <div className="py-12 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-[var(--color-text-subtle)]" />
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Ainda não há dados suficientes para o ranking semanal.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
              Cards críticos
            </h2>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]">
              <AlertCircle className="h-4 w-4" strokeWidth={2} />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {topWeakCards.map((card) => (
              <div key={card.id} className={nestedCardClass}>
                <p className="text-sm font-bold text-[var(--color-text)]">{card.en}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-[var(--color-text-muted)]">{card.pt}</p>
                  <span className="inline-flex rounded-full border border-[rgba(186,26,26,0.18)] bg-[rgba(186,26,26,0.08)] px-2 py-0.5 text-xs font-bold text-[var(--color-error)]">
                    {card.count}x
                  </span>
                </div>
              </div>
            ))}
            {topWeakCards.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                Nenhum card crítico identificado.
              </p>
            )}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
              Packs difíceis
            </h2>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-accent-light)] bg-[var(--color-accent-light)] text-[var(--color-warning)]">
              <BookOpen className="h-4 w-4" strokeWidth={2} />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {weakestPacks.map((pack) => (
              <div key={pack.packName} className={nestedCardClass}>
                <p className="text-sm font-bold text-[var(--color-text)]">{pack.packName}</p>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-xs text-[var(--color-text-muted)]">{pack.sessions} sessões</span>
                  <span className="inline-flex rounded-full border border-[var(--color-accent-light)] bg-[var(--color-accent-light)] px-2 py-0.5 text-xs font-bold text-[var(--color-warning)]">
                    {pack.accuracy}% acerto
                  </span>
                </div>
              </div>
            ))}
            {weakestPacks.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Sem dados de packs no período.</p>
            )}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
              Dificuldade por modo
            </h2>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-secondary-container)] bg-[var(--color-secondary-container)] text-[var(--color-secondary)]">
              <LayoutList className="h-4 w-4" strokeWidth={2} />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {weakestMemberModes.map((entry) => (
              <div key={`${entry.username}-${entry.modeLabel}`} className={nestedCardClass}>
                <p className="text-sm font-bold text-[var(--color-text)]">{entry.username}</p>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-xs text-[var(--color-text-muted)]">{entry.modeLabel}</span>
                  <span className="inline-flex rounded-full border border-[var(--color-primary-light)] bg-[var(--color-primary-light)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary)]">
                    {entry.accuracy}% acerto
                  </span>
                </div>
              </div>
            ))}
            {weakestMemberModes.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Sem dados de modos de jogo.</p>
            )}
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
            Relatório por membro
          </p>
          <h2 className="mt-2 text-xl font-bold text-[var(--color-text)]">Resumo por membro</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-container-low)] text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">
                <th className="px-5 py-3">Membro</th>
                <th className="px-3 py-3 text-center">Revisões</th>
                <th className="px-3 py-3 text-center">Qualidade média</th>
                <th className="px-3 py-3 text-center">Taxa boa</th>
                <th className="px-5 py-3 text-center">Maior repetição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/30">
              {memberRows.map(
                (row) =>
                  (row.reviews > 0 || row.username) && (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-[var(--color-surface-container-low)]"
                    >
                      <td className="px-5 py-3 font-bold text-[var(--color-text)]">{row.username}</td>
                      <td className="px-3 py-3 text-center font-semibold text-[var(--color-text-muted)]">
                        {row.reviews}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-primary-light)] px-2.5 py-1 text-[10px] font-black uppercase text-[var(--color-primary)]">
                          {row.averageQuality.toFixed(1)}/5
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-container)] px-2.5 py-1 text-[10px] font-black uppercase text-[var(--color-text-muted)]">
                          {row.goodRate}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-[var(--color-text-muted)]">
                        {row.bestRepetition}
                      </td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}