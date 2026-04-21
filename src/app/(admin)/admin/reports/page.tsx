import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  LayoutList,
  Percent,
} from 'lucide-react'
import { type CardReview } from '@/lib/spacedRepetition'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import { buildWeeklyLeaderboard, getLeaderboardTier } from '@/lib/leaderboard'
import type { SessionErrorLog } from '@/components/shared/SessionErrorsViewer'
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

  // ── Weakness Analytics (Ported from Dashboard) ───────────────────────────
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
    .map(item => ({ ...item, total: item.correct + item.wrong, accuracy: (item.correct + item.wrong) > 0 ? Math.round((item.correct / (item.correct + item.wrong)) * 100) : 0 }))
    .filter(item => item.total > 0).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5)
  const weakestMemberModes = [...memberModeWeaknessMap.values()]
    .map(item => ({ ...item, total: item.correct + item.wrong, accuracy: (item.correct + item.wrong) > 0 ? Math.round((item.correct / (item.correct + item.wrong)) * 100) : 0 }))
    .filter(item => item.total > 0).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5)

  const weeklyLeaderboard = buildWeeklyLeaderboard(
    members.map(m => ({ id: m.id, username: m.username })),
    typedRecentSessions.map(s => ({ user_id: s.user_id, correct_answers: s.correct_answers, wrong_answers: s.wrong_answers, max_streak: s.max_streak }))
  ).slice(0, 8)

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <section className="surface-hero p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Performance & Analytics</p>
            <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
              Relatórios consolidados e análise de desempenho.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
              Métricas detalhadas de retenção, precisão e engajamento da equipe nos últimos 30 dias.
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
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Equipe ativa</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{members.length}</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Membros sob acompanhamento</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Revisões hoje</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{todayReviews.length}</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Volume processado hoje</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Precisão Geral</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{successRate}%</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Média de acertos na primeira tentativa</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Qualidade</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{averageQuality.toFixed(1)}</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Nota média de auto-avaliação</p>
          </div>
        </div>
      </section>

      {/* LEADERBOARD SECTION */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] overflow-hidden editorial-shadow">
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Leaderboard</p>
            <h2 className="mt-4 text-3xl font-bold text-[var(--color-text)] tracking-tight">Ranking da Semana</h2>
          </div>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-2 text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest text-[10px]">Últimos 7 dias</span>
        </div>
        <div className="divide-y divide-[var(--color-border)]/30">
          {weeklyLeaderboard.map((entry) => (
            <div key={entry.userId} className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-[var(--color-surface-container-low)]/50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] font-bold text-[var(--color-text-muted)]">#{entry.rank}</div>
                <div>
                  <p className="font-bold text-[var(--color-text)]">{entry.username}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-subtle)] font-medium">{entry.sessions} sessões · {entry.accuracy}% precisão</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">{entry.score} pts</span>
                <span className="inline-flex rounded-full border border-[var(--color-border)] bg-white/50 px-3 py-1 text-xs font-bold text-[var(--color-text-muted)]">{getLeaderboardTier(entry.score)}</span>
              </div>
            </div>
          ))}
          {weeklyLeaderboard.length === 0 && (
            <p className="px-6 py-10 text-center text-[var(--color-text-subtle)] font-medium">Ainda não há dados suficientes para o ranking semanal.</p>
          )}
        </div>
      </section>

      {/* WEAKNESSES GRID */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-6 editorial-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-error)]/10 text-[var(--color-error)]"><AlertCircle className="h-6 w-6" /></div>
            <h2 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Cards Críticos</h2>
          </div>
          <div className="mt-5 space-y-3">
            {topWeakCards.map(card => (
              <div key={card.id} className="rounded-[20px] border border-[var(--color-border)]/50 bg-[var(--color-surface-container-low)] p-4 hover:border-[var(--color-error)]/30 transition-colors">
                <p className="font-bold text-[var(--color-text)]">{card.en}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-[var(--color-text-muted)] font-medium">{card.pt}</p>
                  <span className="rounded-full bg-[var(--color-error)]/10 px-2 py-0.5 text-[10px] font-black text-[var(--color-error)] uppercase">{card.count}x</span>
                </div>
              </div>
            ))}
            {topWeakCards.length === 0 && (
              <p className="text-sm text-[var(--color-text-subtle)] font-medium">Nenhum card crítico identificado.</p>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-6 editorial-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"><BookOpen className="h-6 w-6" /></div>
            <h2 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Packs Difíceis</h2>
          </div>
          <div className="mt-5 space-y-3">
            {weakestPacks.map(pack => (
              <div key={pack.packName} className="rounded-[20px] border border-[var(--color-border)]/50 bg-[var(--color-surface-container-low)] p-4 hover:border-[var(--color-accent)]/30 transition-colors">
                <p className="font-bold text-[var(--color-text)]">{pack.packName}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-muted)] font-medium">{pack.sessions} sessões</span>
                  <span className="font-black text-[var(--color-accent)] text-xs uppercase">{pack.accuracy}% acerto</span>
                </div>
              </div>
            ))}
            {weakestPacks.length === 0 && (
              <p className="text-sm text-[var(--color-text-subtle)] font-medium">Sem dados de packs no período.</p>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-6 editorial-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><LayoutList className="h-6 w-6" /></div>
            <h2 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Dificuldade por Modo</h2>
          </div>
          <div className="mt-5 space-y-3">
            {weakestMemberModes.map(entry => (
              <div key={`${entry.username}-${entry.modeLabel}`} className="rounded-[20px] border border-[var(--color-border)]/50 bg-[var(--color-surface-container-low)] p-4 hover:border-[var(--color-primary)]/30 transition-colors">
                <p className="font-bold text-[var(--color-text)]">{entry.username}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-muted)] font-medium">{entry.modeLabel}</span>
                  <span className="font-black text-[var(--color-primary)] text-xs uppercase">{entry.accuracy}% acerto</span>
                </div>
              </div>
            ))}
            {weakestMemberModes.length === 0 && (
              <p className="text-sm text-[var(--color-text-subtle)] font-medium">Sem dados de modos de jogo.</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] overflow-hidden editorial-shadow">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <p className="section-kicker">Member report</p>
          <h2 className="mt-4 text-3xl font-bold text-[var(--color-text)] tracking-tight">Resumo por membro nas revisões</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[var(--color-surface-container-low)] text-[var(--color-text-subtle)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Membro</th>
                <th className="px-6 py-4 text-center font-black uppercase tracking-widest text-[10px]">Revisões</th>
                <th className="px-6 py-4 text-center font-black uppercase tracking-widest text-[10px]">Qualidade média</th>
                <th className="px-6 py-4 text-center font-black uppercase tracking-widest text-[10px]">Taxa boa</th>
                <th className="px-6 py-4 text-center font-black uppercase tracking-widest text-[10px]">Maior repetição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]/30">
              {memberRows.map((row) => (row.reviews > 0 || row.username) && (
                <tr key={row.id} className="transition-colors hover:bg-[var(--color-surface-container-low)]/50">
                  <td className="px-6 py-4 font-bold text-[var(--color-text)]">{row.username}</td>
                  <td className="px-6 py-4 text-center font-medium text-[var(--color-text-muted)]">{row.reviews}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                      {row.averageQuality.toFixed(1)}/5
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex rounded-full bg-[var(--color-secondary-container)] px-3 py-1 text-xs font-bold text-[var(--color-secondary)]">
                      {row.goodRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-[var(--color-text-muted)]">{row.bestRepetition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-6 editorial-shadow">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={2} />
            <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight">Consistência</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)] font-medium">
            Acompanhe quem está mantendo a rotina de revisão sem ficar preso no detalhe operacional.
          </p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-6 editorial-shadow">
          <div className="flex items-center gap-3">
            <Percent className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={2} />
            <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight">Qualidade</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)] font-medium">
            A qualidade média separa volume de revisão de retenção real.
          </p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-6 editorial-shadow">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={2} />
            <h3 className="text-lg font-bold text-[var(--color-text)] tracking-tight">Tendência</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)] font-medium">
            Use este recorte como leitura semanal e mensal da revisão, não só como fotografia do dia.
          </p>
        </div>
      </section>
    </div>
  )
}
