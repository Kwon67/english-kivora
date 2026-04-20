import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Clock3,
  Crown,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react'
import { buildWeeklyLeaderboard } from '@/lib/leaderboard'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/server'
import { formatAppDate, getAppDateString, shiftAppDate } from '@/lib/timezone'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ArenaDuelRow = {
  id: string
  status: 'pending' | 'active' | 'finished' | 'cancelled'
  created_at: string
  finished_at: string | null
  winner_id: string | null
  player1_id: string
  player2_id: string
  game_type: string
  packs: { name: string } | null
}

export default async function ArenaLandingPage() {
  const supabase = await createClient()
  const weeklyStart = shiftAppDate(getAppDateString(), -7)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,username,role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/admin/arena')

  const duelBaseQuery = supabase
    .from('arena_duels')
    .select('id,status,created_at,finished_at,winner_id,player1_id,player2_id,game_type,packs(name)')
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)

  const [
    activeDuelResult,
    pendingDuelResult,
    recentDuelsResult,
    sessionsResult,
    leaderboardMembersResult,
    leaderboardSessionsResult,
  ] = await Promise.all([
    duelBaseQuery.eq('status', 'active').order('created_at', { ascending: false }).limit(1),
    supabase
      .from('arena_duels')
      .select('id,status,created_at,finished_at,winner_id,player1_id,player2_id,game_type,packs(name)')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('arena_duels')
      .select('id,status,created_at,finished_at,winner_id,player1_id,player2_id,game_type,packs(name)')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('game_sessions')
      .select('correct_answers,wrong_answers,max_streak')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(12),
    supabase.from('profiles').select('id,username,role').order('username'),
    supabase
      .from('game_sessions')
      .select('user_id,correct_answers,wrong_answers,max_streak')
      .gte('completed_at', `${weeklyStart}T00:00:00.000Z`)
      .order('completed_at', { ascending: false })
  ])

  const currentDuel =
    (activeDuelResult.data?.[0] as ArenaDuelRow | undefined) ||
    (pendingDuelResult.data?.[0] as ArenaDuelRow | undefined) ||
    null
  const recentDuels = (recentDuelsResult.data as ArenaDuelRow[] | null) || []
  const sessions = sessionsResult.data || []

  const totalAnswers = sessions.reduce((sum, item) => sum + item.correct_answers + item.wrong_answers, 0)
  const totalCorrect = sessions.reduce((sum, item) => sum + item.correct_answers, 0)
  const mentalEnergy = totalAnswers > 0 ? Math.max(35, Math.round((totalCorrect / totalAnswers) * 100)) : 85

  const leaderboardMembers =
    (leaderboardMembersResult.data || [])
      .filter((member) => member.role !== 'admin')
      .map((member) => ({ id: member.id, username: member.username })) || []
  const leaderboardSessions =
    (leaderboardSessionsResult.data || []).map((session) => ({
      user_id: session.user_id,
      correct_answers: session.correct_answers,
      wrong_answers: session.wrong_answers,
      max_streak: session.max_streak,
    })) || []
  const leaderboard = buildWeeklyLeaderboard(leaderboardMembers, leaderboardSessions)
  const myRank = leaderboard.find((entry) => entry.userId === user.id)

  const opponentIds = [...new Set(
    recentDuels.map((duel) => (duel.player1_id === user.id ? duel.player2_id : duel.player1_id))
  )]
  const { data: opponents } = opponentIds.length
    ? await supabase.from('profiles').select('id,username').in('id', opponentIds)
    : { data: [] as Array<{ id: string; username: string }> }
  const opponentById = new Map((opponents || []).map((item) => [item.id, item.username]))

  const currentOpponentName =
    currentDuel
      ? opponentById.get(currentDuel.player1_id === user.id ? currentDuel.player2_id : currentDuel.player1_id) ||
        'Opponent'
      : null

  const mandateLabel =
    currentDuel?.game_type === 'matching'
      ? 'Match EN ↔ PT pairs before your rival.'
      : currentDuel?.game_type === 'flashcard'
        ? 'Crush recall rounds with clean timing.'
        : currentDuel?.game_type === 'typing'
          ? 'Win by typing faster and cleaner.'
          : 'Win by answering consistently and quickly.'

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8 animate-fade-in">
      <section className="premium-card overflow-hidden p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-primary)] shadow-[0_8px_26px_rgba(27,28,24,0.08)]">
              <Swords className="h-6 w-6" strokeWidth={2} />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold text-[var(--color-text)]">
              {currentDuel ? (currentDuel.status === 'active' ? 'Arena Live Match' : 'Seeking Opponent') : 'Arena Standby'}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {currentDuel
                ? currentDuel.status === 'active'
                  ? `Seu duelo em ${currentDuel.packs?.name || 'Arena Pack'} está em andamento contra ${currentOpponentName}.`
                  : `Há um duelo pendente em ${currentDuel.packs?.name || 'Arena Pack'} contra ${currentOpponentName}.`
                : 'Nenhum duelo ativo agora. Quando um desafio for aberto para você, ele aparecerá aqui.'}
            </p>
          </div>

          <Link
            href={currentDuel ? `/arena/${currentDuel.id}` : '/home'}
            transitionTypes={currentDuel ? navForwardTransitionTypes : navBackTransitionTypes}
            className={currentDuel ? 'btn-primary shrink-0' : 'btn-ghost shrink-0'}
          >
            {currentDuel ? (
              <>
                Enter arena
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Back to lounge
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="stitch-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="section-kicker">Mental energy</p>
            <Zap className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <p className="text-4xl font-extrabold text-[var(--color-text)]">{mentalEnergy}%</p>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
              based on recent sessions
            </p>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-primary-container))]"
              style={{ width: `${mentalEnergy}%` }}
            />
          </div>
        </article>

        <article className="stitch-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="section-kicker">Global standing</p>
            <Crown className="h-4 w-4 text-[var(--color-accent)]" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-extrabold text-[var(--color-text)]">
                {myRank ? `#${myRank.rank}` : '--'}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {myRank ? `${myRank.score} focus points this week` : 'No ranking data yet'}
              </p>
            </div>
            <Trophy className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
        </article>
      </section>

      <section className="premium-card p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Daily mandate</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
              {currentDuel?.packs?.name || 'Win crisp, stay composed.'}
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(70,98,89,0.1)] text-[var(--color-primary)]">
            <Shield className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          {mandateLabel}
        </p>
        {currentDuel && (
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
              {currentDuel.game_type.replace('_', ' ')}
            </span>
            <span className="stitch-pill bg-[rgba(70,98,89,0.1)] text-[var(--color-primary)]">
              {currentDuel.status}
            </span>
            {currentOpponentName && (
              <span className="stitch-pill bg-[rgba(115,88,2,0.08)] text-[var(--color-accent)]">
                vs. {currentOpponentName}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="premium-card p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Recent engagements</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Your duel history</h2>
          </div>
          <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
        </div>

        <div className="mt-6 space-y-3">
          {recentDuels.length > 0 ? (
            recentDuels.map((duel) => {
              const opponentId = duel.player1_id === user.id ? duel.player2_id : duel.player1_id
              const opponentName = opponentById.get(opponentId) || 'Opponent'
              const outcome =
                duel.status === 'finished'
                  ? duel.winner_id === user.id
                    ? 'VICTORY'
                    : duel.winner_id
                      ? 'DEFEAT'
                      : 'DRAW'
                  : duel.status.toUpperCase()

              const outcomeClass =
                outcome === 'VICTORY'
                  ? 'bg-[rgba(70,98,89,0.1)] text-[var(--color-primary)]'
                  : outcome === 'DEFEAT'
                    ? 'bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]'
                    : 'bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]'

              return (
                <Link
                  key={duel.id}
                  href={`/arena/${duel.id}`}
                  transitionTypes={navForwardTransitionTypes}
                  className="flex items-center justify-between gap-4 rounded-[1rem] bg-[var(--color-surface-container-low)] px-4 py-4 hover:bg-[var(--color-surface-container-high)]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      vs. {opponentName}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                      {duel.packs?.name || 'Arena Pack'} • {formatAppDate(duel.created_at, { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`stitch-pill ${outcomeClass}`}>{outcome}</span>
                    <Clock3 className="h-4 w-4 text-[var(--color-text-subtle)]" />
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="rounded-[1rem] bg-[var(--color-surface-container-low)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
              Nenhum confronto registrado ainda.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
