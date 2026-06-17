import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  Bot,
  Crown,
  Gauge,
  Ghost,
  Radio,
  ShieldCheck,
  Swords,
  Timer,
  Trophy,
  Zap,
  Users,
} from 'lucide-react'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import { getWeeklyLeaderboard } from '@/features/leaderboard/lib/weeklyLeaderboard'
import ArenaCreateDuel from '@/features/arena/components/ArenaCreateDuel'
import ArenaHeroVisual from '@/features/arena/components/ArenaHeroVisual'
import ArenaHistorySection from '@/features/arena/components/ArenaHistorySection'
import { getGhostChallenges } from '@/app/actions'
import ParallaxCard from '@/components/ui/ParallaxCard'
import EmptyState from '@/components/ui/EmptyState'
import StaggeredFadeIn from '@/components/ui/StaggeredFadeIn'

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

const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-border-muted/20 bg-card shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300'
const primaryButton =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-5 py-3.5 font-montserrat text-sm font-bold text-on-primary shadow-[0_10px_22px_rgba(24,59,22,0.22)] transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 bg-primary  hover:bg-primary-dark'
const softButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-border-muted/20 bg-primary-light px-5 py-3.5 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-hero-lime dark:border-border-accent/20 dark:bg-primary/8 text-primary hover:bg-primary/16'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'
const glassStat =
  'overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-4 shadow-[0_12px_34px_rgba(31,43,18,0.08)] transition-all duration-300 dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]'
const glassPill =
  'inline-flex items-center gap-1.5 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-primary shadow-sm dark:border-border-accent/18 dark:bg-primary/12'
const iconBubble =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary shadow-sm ring-1 ring-border-muted/18 bg-primary/12 text-primary dark:ring-border-accent/18'

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
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-hidden bg-surface px-4 py-6 pb-10 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#050704] dark:text-text">
      {/* Background mesh grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14] z-0" />
      
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)] z-0" />

      <StaggeredFadeIn className="relative z-10 mx-auto max-w-6xl space-y-5 pb-8" staggerDelay={0.08}>
        <ParallaxCard strength={8}>
          <section className={`${glassPanel} p-0`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
              <div className="min-w-0">
                <div className={softKicker}>
                  <Swords className="h-4 w-4" strokeWidth={2.3} />
                  Arena competitiva
                </div>

                <h1 className="mt-5 max-w-2xl font-montserrat text-4xl font-bold leading-tight text-text sm:text-5xl">
                  {heroTitle}
                </h1>
                <p className="mt-4 max-w-2xl font-inter text-sm leading-relaxed text-text-muted sm:text-base">
                  {heroDescription}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={heroActionHref}
                    transitionTypes={heroTransitionTypes}
                    className={primaryButton}
                  >
                    {heroActionLabel}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.3} />
                  </Link>
                  <Link href="/ranking" transitionTypes={navForwardTransitionTypes} className={softButton}>
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
                        className={glassStat}
                      >
                        <StatIcon className="h-4 w-4 text-primary" strokeWidth={2.3} />
                        <p className="mt-3 font-montserrat text-2xl font-bold text-text">{stat.value}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-subtle">
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

        <section className="grid items-stretch gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className={`${glassPanel} flex h-full flex-col p-6 sm:p-7`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={softKicker}>Sala ao vivo</p>
                  <h2 className="mt-3 font-montserrat text-2xl font-bold text-text">
                    {currentDuel?.packs?.name || 'Ritmo competitivo, sem ruído visual'}
                  </h2>
                </div>
                <div className={iconBubble}>
                  <Radio className="h-5 w-5" strokeWidth={2.2} />
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
                {focusLabel}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className={glassStat}>
                  <Activity className="h-4 w-4 text-primary" strokeWidth={2.3} />
                  <p className="mt-3 font-montserrat text-xl font-bold text-text">{mentalEnergy}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-subtle">foco recente</p>
                </div>
                <div className={glassStat}>
                  <Crown className="h-4 w-4 text-primary" strokeWidth={2.3} />
                  <p className="mt-3 font-montserrat text-xl font-bold text-text">{weeklyRankLabel}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-subtle">
                    {myRank ? `${myRank.score} pts` : 'sem pontos'}
                  </p>
                </div>
                <div className={glassStat}>
                  <Timer className="h-4 w-4 text-primary" strokeWidth={2.3} />
                  <p className="mt-3 font-montserrat text-xl font-bold text-text">{pendingQueue.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-subtle">na fila</p>
                </div>
              </div>

              {currentDuel && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className={glassPill}>
                    {formatGameType(currentDuel.game_type)}
                  </span>
                  <span className={glassPill}>
                    {formatDuelStatus(currentDuel.status)}
                  </span>
                  {currentOpponentName && (
                    <span className={glassPill}>
                      contra {currentOpponentName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </article>

          <article className={`${glassPanel} flex h-full flex-col p-6 sm:p-7`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={softKicker}>Desafios fantasma</p>
                  <h2 className="mt-3 font-montserrat text-2xl font-bold text-text">Bata marcas salvas</h2>
                </div>
                <div className={iconBubble}>
                  <Bot className="h-5 w-5" strokeWidth={2.2} />
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
                Enfrente as melhores performances gravadas por outros jogadores, mesmo quando a sala estiver vazia.
              </p>

              <div className="mt-6 grid flex-1 gap-3 sm:grid-cols-2">
                {ghostChallenges.length > 0 ? (
                  ghostChallenges.map((ghost) => {
                    const ghostProfile = ghost.profiles[0]
                    const ghostPack = ghost.packs[0]
                    if (!ghostProfile || !ghostPack) return null

                    return (
                      <div
                        key={ghost.id}
                        className="group relative flex flex-col gap-4 overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-4 shadow-[0_12px_34px_rgba(31,43,18,0.08)] transition-all hover:-translate-y-0.5 hover:border-primary/30 dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] dark:hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-on-primary shadow-sm">
                            {ghostProfile.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-text">
                              {ghostProfile.username}
                            </p>
                            <p className="mt-1 truncate text-[11px] uppercase tracking-[0.1em] text-text-subtle">
                              {ghostPack.name} • {formatGameType(ghost.game_type)}
                            </p>
                            <div className="mt-2 flex items-center gap-1.5">
                              <Zap className="h-3 w-3 text-primary" strokeWidth={2.4} />
                              <span className="text-xs font-black text-primary">{ghost.score} pts</span>
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
                            className="inline-flex min-h-10 w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-dark sm:w-auto"
                          >
                            Desafiar
                          </button>
                        </form>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full flex min-h-[9rem] flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] px-5 py-6 text-center shadow-[0_12px_34px_rgba(31,43,18,0.08)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]">
                    <Ghost className="h-12 w-12 text-primary" strokeWidth={1.9} />
                    <p className="mt-4 font-montserrat text-lg font-bold text-text">
                      Nenhuma marca fantasma ainda.
                    </p>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-text-subtle">
                      Finalize duelos reais para liberar desafios gravados nesta sala.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </article>
        </section>

        <ArenaHistorySection
          initialGlobalDuels={globalDuels}
          isAdmin={profile.role === 'admin'}
          profileNames={Object.fromEntries(profileNameById)}
        />

        {!canCreateDuel && (
          <section className={`${glassPanel} p-6 sm:p-7`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={softKicker}>Sala da Arena</p>
                  <h2 className="mt-3 font-montserrat text-2xl font-bold text-text">
                    Jogadores online
                  </h2>
                </div>
                <div className={iconBubble}>
                  <Users className="h-5 w-5" strokeWidth={2} />
                </div>
              </div>
              {onlineUsers.length > 0 ? (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
                  {onlineUsers.length} jogadores disponíveis para duelo.
                </p>
              ) : null}
              {onlineUsers.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {onlineUsers.map((u) => (
                    <span
                      key={u.id}
                      className={glassPill}
                    >
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {u.username}
                      {u.role === 'admin' && (
                        <span className="text-[10px] text-text-subtle">(admin)</span>
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
                    className="border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.08)] dark:border-border-accent/20 dark:bg-card"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        <section className={`${glassPanel} p-6 sm:p-7`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={softKicker}>Fila de espera</p>
                <h2 className="mt-3 font-montserrat text-2xl font-bold text-text">
                  Fila de espera
                </h2>
              </div>
              <div className={iconBubble}>
                <Timer className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
            {pendingQueue.length > 0 ? (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted">
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
                      className="flex items-center justify-between gap-4 overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] px-4 py-3 shadow-[0_12px_34px_rgba(31,43,18,0.08)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text">
                          {packName || 'Pack da Arena'} • {formatGameType(duel.game_type)}
                        </p>
                        <p className="mt-1 text-xs text-text-subtle">
                          Aguardando oponente...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                        <span className="text-xs font-semibold text-primary">pendente</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-5">
                <div className="flex min-h-[11rem] flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] px-6 py-8 text-center shadow-[0_12px_34px_rgba(31,43,18,0.08)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]">
                  <Timer className="h-12 w-12 text-primary" strokeWidth={1.9} />
                  <p className="mt-4 font-montserrat text-lg font-bold text-text">
                    Fila sem duelos.
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-text-subtle">
                    Nenhum duelo está aguardando oponente no momento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </StaggeredFadeIn>
    </div>
  )
}
