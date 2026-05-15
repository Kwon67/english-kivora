import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  Bot,
  Clock3,
  Crown,
  Gauge,
  Radio,
  ShieldCheck,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  Zap,
  Users,
} from 'lucide-react'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/server'
import { formatAppDate, getAppDateString, shiftAppDate } from '@/lib/timezone'
import { getWeeklyLeaderboard } from '@/lib/weeklyLeaderboard'
import ArenaCreateDuel from './ArenaCreateDuel'
import ArenaHeroVisual from './ArenaHeroVisual'
import { getGhostChallenges } from '@/app/actions'
import ParallaxCard from '@/components/shared/ParallaxCard'
import EmptyState from '@/components/shared/EmptyState'
import StaggeredFadeIn from '@/components/shared/StaggeredFadeIn'

interface GhostChallenge {
  id: string;
  game_type: string;
  score: number;
  profiles: Array<{ id: string; username: string; avatar_url: string | null }>;
  packs: Array<{ id: string; name: string }>;
}

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
  player1_score: number
  player2_score: number
  player1_wrong: number
  player2_wrong: number
  player1_events: unknown
  player2_events: unknown
  game_type: string
  packs: { name: string } | null
}

function formatDuelStatus(status: ArenaDuelRow['status']) {
  const labels: Record<ArenaDuelRow['status'], string> = {
    pending: 'Aguardando',
    active: 'Ativo',
    finished: 'Finalizado',
    cancelled: 'Cancelado',
  }

  return labels[status]
}

function formatGameType(gameType: string) {
  const labels: Record<string, string> = {
    multiple_choice: 'Múltipla escolha',
    matching: 'Associação',
    flashcard: 'Flashcard',
    typing: 'Digitação',
    listening: 'Escuta',
    speaking: 'Fala',
  }

  return labels[gameType] || gameType.replace('_', ' ')
}

function countArenaEvents(events: unknown) {
  return Array.isArray(events) ? events.length : 0
}

function formatRate(value: number, total: number) {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

export default async function ArenaLandingPage() {
  const supabase = await createClient()
  const weeklyStart = shiftAppDate(getAppDateString(), -7)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fiveMinutesAgo = new Date(new Date().getTime() - 5 * 60 * 1000).toISOString()
  const fifteenMinutesAgo = new Date(new Date().getTime() - 15 * 60 * 1000).toISOString() // Active duels expire after 15 min
  const twoMinutesAgo = new Date(new Date().getTime() - 2 * 60 * 1000).toISOString() // For online users

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,username,role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  // Admin can now play in arena mode too - no redirect to admin panel

  const duelSelect =
    'id,status,created_at,finished_at,winner_id,player1_id,player2_id,player1_score,player2_score,player1_wrong,player2_wrong,player1_events,player2_events,game_type,packs(name)'
  const duelBaseQuery = supabase
    .from('arena_duels')
    .select(duelSelect)
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)

  // Get all packs for creating duels
  const { data: allPacks } = await supabase.from('packs').select('id,name').order('name')

  const [
    activeDuelResult,
    pendingDuelResult,
    recentDuelsResult,
    globalDuelsResult,
    sessionsResult,
    onlineUsersResult,
    pendingQueueResult,
    ghostChallengesResult,
  ] = await Promise.all([
    duelBaseQuery.eq('status', 'active').gte('created_at', fifteenMinutesAgo).order('created_at', { ascending: false }).limit(1),
    supabase
      .from('arena_duels')
      .select(duelSelect)
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('arena_duels')
      .select(duelSelect)
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('arena_duels')
      .select(duelSelect)
      .in('status', ['finished', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(20),
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
    getGhostChallenges(),
  ])

  const ghostChallenges = (ghostChallengesResult as unknown) as GhostChallenge[]

  const currentDuel =
    (activeDuelResult.data?.[0] as ArenaDuelRow | undefined) ||
    (pendingDuelResult.data?.[0] as ArenaDuelRow | undefined) ||
    null
  const recentDuels = (recentDuelsResult.data as ArenaDuelRow[] | null) || []
  const globalDuels = (globalDuelsResult.data as ArenaDuelRow[] | null) || []
  const sessions = sessionsResult.data || []
  const onlineUsers = (onlineUsersResult.data || []).filter((u) => u.id !== user.id)
  const pendingQueue = pendingQueueResult.data || []
  const packs = allPacks || []
  const canCreateDuel = !currentDuel && packs.length > 0

  const totalAnswers = sessions.reduce((sum, item) => sum + item.correct_answers + item.wrong_answers, 0)
  const totalCorrect = sessions.reduce((sum, item) => sum + item.correct_answers, 0)
  const mentalEnergy = totalAnswers > 0 ? Math.max(35, Math.round((totalCorrect / totalAnswers) * 100)) : 85

  const leaderboard = await getWeeklyLeaderboard(supabase, `${weeklyStart}T00:00:00.000Z`)
  const myRank = leaderboard.find((entry) => entry.userId === user.id)

  const arenaProfileIds = [...new Set(
    [
      ...(currentDuel ? [currentDuel.player1_id, currentDuel.player2_id] : []),
      ...recentDuels.flatMap((duel) => [duel.player1_id, duel.player2_id]),
      ...globalDuels.flatMap((duel) => [duel.player1_id, duel.player2_id]),
    ].filter(Boolean)
  )]
  const { data: arenaProfiles } = arenaProfileIds.length
    ? await supabase.from('profiles').select('id,username').in('id', arenaProfileIds)
    : { data: [] as Array<{ id: string; username: string }> }
  const profileNameById = new Map((arenaProfiles || []).map((item) => [item.id, item.username]))

  const currentOpponentName =
    currentDuel
      ? profileNameById.get(currentDuel.player1_id === user.id ? currentDuel.player2_id : currentDuel.player1_id) ||
        'Oponente'
      : null

  const focusLabel =
    currentDuel?.game_type === 'matching'
      ? 'Combine inglês e português com leitura visual rápida e mantenha precisão até o último par.'
      : currentDuel?.game_type === 'flashcard'
        ? 'Use recall limpo: responda, avance e preserve a sequência sem pressa desnecessária.'
        : currentDuel?.game_type === 'typing'
          ? 'Digite com precisão antes de acelerar. Cada erro evitado vale tempo ganho.'
          : 'Responda com ritmo, mantenha precisão e feche a rodada com consistência.'

  const heroStatus =
    currentDuel?.status === 'active' ? 'active' : currentDuel ? 'pending' : 'idle'
  const weeklyRankLabel = myRank ? `#${myRank.rank}` : '--'
  const heroTitle = currentDuel
    ? currentDuel.status === 'active'
      ? 'Duelo em andamento'
      : 'Convite aguardando entrada'
    : 'Modo Arena'
  const heroDescription = currentDuel
    ? currentDuel.status === 'active'
      ? `Seu duelo em ${currentDuel.packs?.name || 'Pack da Arena'} está ativo contra ${currentOpponentName || 'o oponente'}.`
      : `O desafio em ${currentDuel.packs?.name || 'Pack da Arena'} está preparado para ${currentOpponentName || 'o oponente'} entrar.`
    : 'Uma sala competitiva para treinar inglês em duelos rápidos, com histórico público, fantasmas de desempenho e ranking semanal.'
  const heroActionHref = currentDuel ? `/arena/${currentDuel.id}` : canCreateDuel ? '#novo-duelo' : '/home'
  const heroActionLabel = currentDuel ? 'Entrar no duelo' : canCreateDuel ? 'Criar desafio' : 'Voltar ao início'
  const heroTransitionTypes = currentDuel
    ? navForwardTransitionTypes
    : canCreateDuel
      ? undefined
      : navBackTransitionTypes
  const heroStats = [
    { label: 'Foco recente', value: `${mentalEnergy}%`, Icon: Gauge },
    { label: 'Ranking', value: weeklyRankLabel, Icon: Crown },
    { label: 'Online agora', value: onlineUsers.length.toString(), Icon: Users },
    { label: 'Packs', value: packs.length.toString(), Icon: ShieldCheck },
  ]

  return (
    <StaggeredFadeIn className="mx-auto max-w-6xl space-y-5 pb-8" staggerDelay={0.08}>
      <ParallaxCard strength={8}>
        <section className="premium-card relative overflow-hidden p-0">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,var(--color-primary),var(--color-secondary),transparent)]" />
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-[var(--color-secondary)]/12 blur-3xl" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-primary)]">
                <Swords className="h-4 w-4" strokeWidth={2.3} />
                Arena competitiva
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-black text-[var(--color-text)] sm:text-5xl">
                {heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                {heroDescription}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={heroActionHref}
                  transitionTypes={heroTransitionTypes}
                  className="btn-primary"
                >
                  {heroActionLabel}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.3} />
                </Link>
                <Link href="/ranking" transitionTypes={navForwardTransitionTypes} className="btn-ghost">
                  <Trophy className="h-4 w-4" strokeWidth={2.3} />
                  Ranking semanal
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {heroStats.map((stat) => {
                  const StatIcon = stat.Icon

                  return (
                    <div
                      key={stat.label}
                      className="rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)]/72 p-4 shadow-[var(--shadow-sm)] backdrop-blur"
                    >
                      <StatIcon className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2.3} />
                      <p className="mt-3 text-2xl font-black text-[var(--color-text)]">{stat.value}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">
                        {stat.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <ArenaHeroVisual
              status={heroStatus}
              onlineCount={onlineUsers.length}
              pendingCount={pendingQueue.length}
              energy={mentalEnergy}
              rankLabel={weeklyRankLabel}
            />
          </div>
        </section>
      </ParallaxCard>

      {canCreateDuel && (
        <ArenaCreateDuel
          packs={packs}
          onlineUsers={onlineUsers}
          currentUserId={user.id}
        />
      )}

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="premium-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Sala ao vivo</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                {currentDuel?.packs?.name || 'Ritmo competitivo, sem ruído visual'}
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <Radio className="h-5 w-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            {focusLabel}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="stitch-panel p-4">
              <Activity className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2.3} />
              <p className="mt-3 text-xl font-black text-[var(--color-text)]">{mentalEnergy}%</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">foco recente</p>
            </div>
            <div className="stitch-panel p-4">
              <Crown className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2.3} />
              <p className="mt-3 text-xl font-black text-[var(--color-text)]">{weeklyRankLabel}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">
                {myRank ? `${myRank.score} pts` : 'sem pontos'}
              </p>
            </div>
            <div className="stitch-panel p-4">
              <Timer className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2.3} />
              <p className="mt-3 text-xl font-black text-[var(--color-text)]">{pendingQueue.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">na fila</p>
            </div>
          </div>

          {currentDuel && (
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
                {formatGameType(currentDuel.game_type)}
              </span>
              <span className="stitch-pill bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                {formatDuelStatus(currentDuel.status)}
              </span>
              {currentOpponentName && (
                <span className="stitch-pill bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
                  contra {currentOpponentName}
                </span>
              )}
            </div>
          )}
        </article>

        <article className="premium-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Desafios fantasma</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Bata marcas salvas</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
              <Bot className="h-5 w-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            Enfrente as melhores performances gravadas por outros jogadores, mesmo quando a sala estiver vazia.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {ghostChallenges.length > 0 ? (
              ghostChallenges.map((ghost) => {
                const ghostProfile = ghost.profiles[0]
                const ghostPack = ghost.packs[0]
                if (!ghostProfile || !ghostPack) return null

                return (
                  <div
                    key={ghost.id}
                    className="group relative flex flex-col gap-4 overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4 transition-all hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-container-high)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] text-sm font-black text-[var(--color-on-primary)]">
                        {ghostProfile.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--color-text)]">
                          {ghostProfile.username}
                        </p>
                        <p className="mt-1 truncate text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">
                          {ghostPack.name} • {formatGameType(ghost.game_type)}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-[var(--color-primary)]" strokeWidth={2.4} />
                          <span className="text-xs font-black text-[var(--color-primary)]">{ghost.score} pts</span>
                        </div>
                      </div>
                    </div>

                    <form action={async () => {
                      'use server'
                      const { createGhostDuel } = await import('@/app/actions')
                      const { redirect } = await import('next/navigation')
                      const result = await createGhostDuel(ghostProfile.id, ghostPack.id, ghost.game_type)
                      if (result.success) {
                        redirect(`/arena/${result.duelId}`)
                      }
                    }}>
                      <button
                        type="submit"
                        className="btn-primary min-h-10 w-full px-4 py-2 text-xs sm:w-auto"
                      >
                        Desafiar
                      </button>
                    </form>
                  </div>
                )
              })
            ) : (
              <EmptyState
                imageSrc="/images/arena/arena-command.svg"
                imageAlt="Ilustração de painel competitivo da arena"
                title="Nenhuma marca fantasma ainda."
                description="Finalize duelos reais para liberar desafios gravados nesta sala."
                variant="arena"
                className="col-span-full"
              />
            )}
          </div>
        </article>
      </section>

      <section className="premium-card p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Confrontos recentes</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Histórico geral da arena</h2>
          </div>
          <div className="flex items-center gap-3">
            {profile.role === 'admin' && (
              <form action={async () => {
                'use server'
                const { createAdminClient } = await import('@/lib/supabase/server')
                const adminSupabase = createAdminClient()
                if (adminSupabase) {
                  await adminSupabase.from('arena_duels').delete().in('status', ['finished', 'cancelled'])
                  const { revalidatePath } = await import('next/cache')
                  revalidatePath('/arena')
                }
              }}>
                <button type="submit" className="cursor-pointer rounded-lg border border-[color-mix(in_srgb,var(--color-error)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-3 py-1.5 text-xs font-bold text-[var(--color-error)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]">
                  Limpar Histórico
                </button>
              </form>
            )}
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {globalDuels.length > 0 ? (
            globalDuels.map((duel) => {
              const player1Name = profileNameById.get(duel.player1_id) || 'Jogador 1'
              const player2Name = profileNameById.get(duel.player2_id) || 'Jogador 2'
              const winnerName = duel.winner_id ? profileNameById.get(duel.winner_id) : null
              const player1TotalAnswers = duel.player1_score + duel.player1_wrong
              const player2TotalAnswers = duel.player2_score + duel.player2_wrong
              const player1Progress = Math.max(countArenaEvents(duel.player1_events), player1TotalAnswers)
              const player2Progress = Math.max(countArenaEvents(duel.player2_events), player2TotalAnswers)
              const outcome =
                duel.status === 'finished'
                  ? winnerName
                    ? `Vitória: ${winnerName}`
                    : 'Empate'
                  : formatDuelStatus(duel.status).toUpperCase()

              const outcomeClass =
                duel.status === 'finished' && winnerName
                  ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]'

              return (
                <details
                  key={duel.id}
                  className="group rounded-[1rem] border border-transparent bg-[var(--color-surface-container-low)] px-4 py-4 transition-colors open:border-[var(--color-border-hover)] open:bg-[var(--color-surface-container-high)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-container-high)]"
                >
                  <summary className="flex cursor-pointer list-none flex-col gap-3 marker:hidden sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        {player1Name} vs {player2Name}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                        {duel.packs?.name || 'Pack da Arena'} • {formatGameType(duel.game_type)} • {formatAppDate(duel.created_at, { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span className="text-sm font-black tabular-nums text-[var(--color-text)]">
                        {duel.player1_score} x {duel.player2_score}
                      </span>
                      <span className={`stitch-pill ${outcomeClass}`}>{outcome}</span>
                      <Clock3 className="h-4 w-4 text-[var(--color-text-subtle)] transition-transform group-open:rotate-180" />
                    </div>
                  </summary>

                  <div className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4 md:grid-cols-2">
                    {[
                      {
                        name: player1Name,
                        score: duel.player1_score,
                        wrong: duel.player1_wrong,
                        progress: player1Progress,
                        totalAnswers: player1TotalAnswers,
                        isWinner: duel.winner_id === duel.player1_id,
                      },
                      {
                        name: player2Name,
                        score: duel.player2_score,
                        wrong: duel.player2_wrong,
                        progress: player2Progress,
                        totalAnswers: player2TotalAnswers,
                        isWinner: duel.winner_id === duel.player2_id,
                      },
                    ].map((player) => (
                      <div
                        key={player.name}
                        className="rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-black text-[var(--color-text)]">{player.name}</p>
                          {player.isWinner && (
                            <span className="stitch-pill bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                              Vencedor
                            </span>
                          )}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">Acertos</p>
                            <p className="mt-1 text-lg font-black text-[var(--color-text)]">{player.score}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">Erros</p>
                            <p className="mt-1 text-lg font-black text-[var(--color-error)]">{player.wrong}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">Acerto</p>
                            <p className="mt-1 text-lg font-black text-[var(--color-primary)]">{formatRate(player.score, player.totalAnswers)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">Erro</p>
                            <p className="mt-1 text-lg font-black text-[var(--color-text)]">{formatRate(player.wrong, player.totalAnswers)}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-[var(--color-text-muted)]">
                          Frases concluídas: {player.progress}/10
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              )
            })
          ) : (
            <EmptyState
              imageSrc="/images/arena/arena-command.svg"
              imageAlt="Ilustração de painel competitivo da arena"
              title="Nenhum confronto registrado."
              description="Os duelos finalizados vão aparecer aqui assim que a arena ganhar movimento."
              variant="arena"
            />
          )}
        </div>
      </section>

      {!canCreateDuel && (
        <section className="premium-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker">Sala da Arena</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                Jogadores online
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <Users className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>
          {onlineUsers.length > 0 ? (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {onlineUsers.length} jogadores disponíveis para duelo.
            </p>
          ) : null}
          {onlineUsers.length > 0 ? (
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
          ) : (
            <div className="mt-5">
              <EmptyState
                imageSrc="/images/arena/arena-command.svg"
                imageAlt="Ilustração de painel competitivo da arena"
                title="Nenhum jogador online."
                description="Quando alguém entrar na sala da arena, o perfil aparece aqui para iniciar um duelo."
                variant="arena"
              />
            </div>
          )}
        </section>
      )}

      <section className="premium-card p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Fila de espera</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
              Duelos aguardando
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
            <Timer className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        {pendingQueue.length > 0 ? (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            {pendingQueue.length} duelo(s) aguardando oponente entrar.
          </p>
        ) : null}
        {pendingQueue.length > 0 ? (
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
                      {packName || 'Pack da Arena'} • {formatGameType(duel.game_type)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                      Aguardando oponente...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-secondary)]" />
                    <span className="text-xs text-[var(--color-secondary)]">pendente</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              imageSrc="/images/arena/arena-command.svg"
              imageAlt="Ilustração de painel competitivo da arena"
              title="Fila sem duelos."
              description="Nenhum duelo está aguardando oponente no momento."
              variant="arena"
            />
          </div>
        )}
      </section>
    </StaggeredFadeIn>
  )
}
