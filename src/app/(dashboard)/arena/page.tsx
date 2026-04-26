import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Clock3,
  Crown,
  Flame,
  Sparkles,
  Swords,
  Trophy,
  Zap,
  Users,
  Timer,
} from 'lucide-react'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/server'
import { formatAppDate, getAppDateString, shiftAppDate } from '@/lib/timezone'
import { getWeeklyLeaderboard } from '@/lib/weeklyLeaderboard'
import ArenaCreateDuel from './ArenaCreateDuel'

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

  const fiveMinutesAgo = new Date(new Date().getTime() - 5 * 60 * 1000).toISOString()
  const twoMinutesAgo = new Date(new Date().getTime() - 2 * 60 * 1000).toISOString() // For online users

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,username,role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  // Admin can now play in arena mode too - no redirect to admin panel

  const duelBaseQuery = supabase
    .from('arena_duels')
    .select('id,status,created_at,finished_at,winner_id,player1_id,player2_id,game_type,packs(name)')
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)

  // Get all packs for creating duels
  const { data: allPacks } = await supabase.from('packs').select('id,name').order('name')

  const [
    activeDuelResult,
    pendingDuelResult,
    recentDuelsResult,
    sessionsResult,
    onlineUsersResult,
    pendingQueueResult,
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
    // Get online users (profiles with activity in last 2 minutes)
    supabase
      .from('profiles')
      .select('id,username,role')
      .gte('last_seen_at', twoMinutesAgo)
      .order('last_seen_at', { ascending: false })
      .limit(20),
    // Get pending duel queue (duels waiting for opponent)
    supabase
      .from('arena_duels')
      .select('id,player1_id,player2_id,packs(name),game_type,created_at')
      .eq('status', 'pending')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const currentDuel =
    (activeDuelResult.data?.[0] as ArenaDuelRow | undefined) ||
    (pendingDuelResult.data?.[0] as ArenaDuelRow | undefined) ||
    null
  const recentDuels = (recentDuelsResult.data as ArenaDuelRow[] | null) || []
  const sessions = sessionsResult.data || []
  const onlineUsers = (onlineUsersResult.data || []).filter((u) => u.id !== user.id)
  const pendingQueue = pendingQueueResult.data || []
  const canCreateDuel = !currentDuel && allPacks && allPacks.length > 0

  const totalAnswers = sessions.reduce((sum, item) => sum + item.correct_answers + item.wrong_answers, 0)
  const totalCorrect = sessions.reduce((sum, item) => sum + item.correct_answers, 0)
  const mentalEnergy = totalAnswers > 0 ? Math.max(35, Math.round((totalCorrect / totalAnswers) * 100)) : 85

  const leaderboard = await getWeeklyLeaderboard(supabase, `${weeklyStart}T00:00:00.000Z`)
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
      ? 'Combine EN ↔ PT antes do rival e não deixe ponto vivo.'
      : currentDuel?.game_type === 'flashcard'
        ? 'Esmague as rodadas de recall com timing limpo.'
        : currentDuel?.game_type === 'typing'
          ? 'Digite mais rápido, erre menos e finalize sem piedade.'
          : 'Responda rápido, mantenha precisão e vença no sangue frio.'

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-[2rem] border border-red-950/30 bg-[linear-gradient(135deg,#1b0a0a_0%,#330b0b_46%,#120707_100%)] p-6 text-white shadow-[0_28px_80px_rgba(127,29,29,0.28)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,#dc2626,#7f1d1d,transparent)]" />
        <div className="absolute inset-x-6 top-10 h-px bg-red-500/20" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-950/70 text-red-100 shadow-[0_0_28px_rgba(220,38,38,0.35)]">
              <Swords className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-red-300">
              Modo arena sangrento
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">
              {currentDuel ? (currentDuel.status === 'active' ? 'Duelo em Chamas' : 'Caçando Oponente') : 'Arena de Sangue'}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-red-100/78">
              {currentDuel
                ? currentDuel.status === 'active'
                  ? `Seu duelo em ${currentDuel.packs?.name || 'Arena Pack'} está pegando fogo contra ${currentOpponentName}.`
                  : `Um desafio em ${currentDuel.packs?.name || 'Arena Pack'} está esperando ${currentOpponentName} entrar.`
                : 'Escolha um rival online, puxe o confronto e entre para vencer sem hesitar.'}
            </p>
          </div>

          <Link
            href={currentDuel ? `/arena/${currentDuel.id}` : '/home'}
            transitionTypes={currentDuel ? navForwardTransitionTypes : navBackTransitionTypes}
            className={currentDuel ? 'shrink-0 rounded-[1.1rem] bg-red-600 px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(220,38,38,0.32)] hover:bg-red-500' : 'shrink-0 rounded-[1.1rem] border border-red-400/30 bg-red-950/60 px-5 py-3 text-sm font-black text-red-100 hover:bg-red-900/70'}
          >
            {currentDuel ? (
              <>
                Entrar
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Recuar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-[1.75rem] border border-red-950/20 bg-[linear-gradient(180deg,rgba(127,29,29,0.13),var(--color-surface-container)_72%)] p-5 shadow-[0_16px_40px_rgba(127,29,29,0.10)]">
          <div className="flex items-center justify-between gap-3">
            <p className="section-kicker !bg-red-950/10 !text-red-700">Fúria mental</p>
            <Zap className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <p className="text-4xl font-extrabold text-[var(--color-text)]">{mentalEnergy}%</p>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
              energia de combate
            </p>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7f1d1d,#dc2626,#f97316)] shadow-[0_0_14px_rgba(220,38,38,0.55)]"
              style={{ width: `${mentalEnergy}%` }}
            />
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-red-950/20 bg-[linear-gradient(180deg,rgba(127,29,29,0.10),var(--color-surface-container)_72%)] p-5 shadow-[0_16px_40px_rgba(127,29,29,0.10)]">
          <div className="flex items-center justify-between gap-3">
            <p className="section-kicker !bg-red-950/10 !text-red-700">Trono semanal</p>
            <Crown className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-extrabold text-[var(--color-text)]">
                {myRank ? `#${myRank.rank}` : '--'}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {myRank ? `${myRank.score} pontos de domínio nesta semana` : 'Sem sangue no ranking ainda'}
              </p>
            </div>
            <Trophy className="h-5 w-5 text-red-600" />
          </div>
        </article>
      </section>

      <section className="rounded-[2rem] border border-red-950/20 bg-[linear-gradient(135deg,var(--color-card),rgba(127,29,29,0.08))] p-6 shadow-[0_18px_46px_rgba(127,29,29,0.10)] sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker !bg-red-950/10 !text-red-700">Mandato de guerra</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
              {currentDuel?.packs?.name || 'Entre, destrua, saia no topo.'}
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-950/10 text-red-700">
            <Flame className="h-5 w-5" strokeWidth={2} />
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
            <span className="stitch-pill bg-red-950/10 text-red-700">
              {currentDuel.status}
            </span>
            {currentOpponentName && (
              <span className="stitch-pill bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]">
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

      {/* Create Duel Section - Only show if no current duel */}
      {canCreateDuel && (
        <ArenaCreateDuel
          packs={allPacks}
          onlineUsers={onlineUsers}
          currentUserId={user.id}
        />
      )}

      {/* Online Users Section */}
      {!canCreateDuel && (
        <section className="premium-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Arena lobby</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                Jogadores online
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(70,98,89,0.1)] text-[var(--color-primary)]">
              <Users className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            {onlineUsers.length > 0
              ? `${onlineUsers.length} jogadores disponíveis para duelo.`
              : 'Nenhum jogador online no momento.'}
          </p>
          {onlineUsers.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {onlineUsers.map((u) => (
                <span
                  key={u.id}
                  className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text)] flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                  {u.username}
                  {u.role === 'admin' && (
                    <span className="text-[10px] text-[var(--color-text-subtle)]">(admin)</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Pending Duel Queue Section */}
      <section className="premium-card p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Fila de espera</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
              Duelos aguardando
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]">
            <Timer className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          {pendingQueue.length > 0
            ? `${pendingQueue.length} duelo(s) aguardando oponente entrar.`
            : 'Nenhum duelo na fila de espera.'}
        </p>
        {pendingQueue.length > 0 && (
          <div className="mt-5 space-y-2">
            {pendingQueue.map((duel) => {
              const packs = duel.packs as { name?: string }[] | { name?: string } | null
              const packName = Array.isArray(packs) ? packs[0]?.name : packs?.name
              return (
                <div
                  key={duel.id}
                  className="flex items-center justify-between gap-4 rounded-[1rem] bg-[var(--color-surface-container-low)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {packName || 'Arena Pack'} • {duel.game_type.replace('_', ' ')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                      Aguardando oponente...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-error)]" />
                    <span className="text-xs text-[var(--color-error)]">pendente</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
