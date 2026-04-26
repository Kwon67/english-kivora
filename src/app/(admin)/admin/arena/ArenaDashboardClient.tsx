'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Radio, Swords, Wifi, Trash2 } from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'
import { usePresenceStore } from '@/store/presenceStore'

const GAME_TYPES = [
  { id: 'multiple_choice', name: 'Múltipla Escolha', description: 'Responda questões em ritmo de duelo.' },
  { id: 'matching', name: 'Associação', description: 'Associe pares de inglês e português em alta velocidade.' },
  { id: 'flashcard', name: 'Flashcard', description: 'Recordação direta com decisão binária.' },
  { id: 'typing', name: 'Digitação', description: 'Escreva a tradução e pontue pela precisão.' },
  { id: 'listening', name: 'Escuta', description: 'Ouça e escreva a tradução.' },
  { id: 'speaking', name: 'Fala', description: 'Ouça e repita para treinar pronúncia.' },
]

interface ArenaDashboardProps {
  packs: { id: string; name: string }[]
  profiles: { id: string; username: string; role?: string }[]
}

interface ActiveDuel {
  id: string
  player1_id: string
  player2_id: string
  pack_id: string
  game_type: string
  status: string
  created_at: string
}

export default function ArenaDashboardClient({ packs, profiles }: ArenaDashboardProps) {
  const router = useRouter()
  const onlineUsers = usePresenceStore((state) => state.onlineUserIds)
  const presenceStatus = usePresenceStore((state) => state.status)
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [selectedPack, setSelectedPack] = useState('')
  const [selectedGameType, setSelectedGameType] = useState('multiple_choice')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [activeDuels, setActiveDuels] = useState<ActiveDuel[]>([])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const supabase = createClient()
    
    const fetchDuels = async () => {
      const { data } = await supabase
        .from('arena_duels')
        .select('*')
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })
      if (data) setActiveDuels(data)
    }

    fetchDuels()

    const channel = supabase.channel('arena_admin_duels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_duels' }, () => {
        fetchDuels()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function cancelDuel(id: string) {
    const supabase = createClient()
    await supabase.from('arena_duels').update({
      status: 'cancelled',
      finished_at: new Date().toISOString()
    }).eq('id', id)
    setToast({ type: 'success', message: 'Duelo cancelado com sucesso.' })
  }

  const onlineProfiles = profiles.filter((profile) => onlineUsers.includes(profile.id))
  const selectableProfiles = profiles
  const selectedPlayer1Name = selectableProfiles.find((profile) => profile.id === player1)?.username
  const selectedPlayer2Name = selectableProfiles.find((profile) => profile.id === player2)?.username
  const selectedPackName = packs.find((pack) => pack.id === selectedPack)?.name
  const selectedGame = GAME_TYPES.find((game) => game.id === selectedGameType)

  async function startDuel() {
    if (!player1 || !player2 || !selectedPack || !selectedGameType) return

    if (player1 === player2) {
      setToast({ type: 'error', message: 'Selecione membros diferentes para o duelo.' })
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Auto-cancel stale pending duels (older than 5 minutes) for these players
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    await supabase
      .from('arena_duels')
      .update({
        status: 'cancelled',
        finished_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .or(`player1_id.eq.${player1},player2_id.eq.${player1},player1_id.eq.${player2},player2_id.eq.${player2}`)
      .lt('created_at', fiveMinutesAgo)

    const [{ data: packCards, error: packCardsError }, { data: conflictingDuels, error: conflictingDuelsError }] =
      await Promise.all([
        supabase
          .from('cards')
          .select('id')
          .eq('pack_id', selectedPack)
          .limit(1),
        supabase
          .from('arena_duels')
          .select('id')
          .in('status', ['pending', 'active'])
          .or(
            `player1_id.eq.${player1},player2_id.eq.${player1},player1_id.eq.${player2},player2_id.eq.${player2}`
          )
          .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Only check duels from last 5 minutes
          .limit(1),
      ])

    if (packCardsError || conflictingDuelsError) {
      console.error(packCardsError || conflictingDuelsError)
      setLoading(false)
      setToast({ type: 'error', message: 'Não foi possível validar o duelo agora.' })
      return
    }

    if (!packCards || packCards.length === 0) {
      setLoading(false)
      setToast({ type: 'error', message: 'Esse pack não possui cards disponíveis para duelo.' })
      return
    }

    if (conflictingDuels && conflictingDuels.length > 0) {
      setLoading(false)
      setToast({ type: 'error', message: 'Um dos membros já está em outro duelo pendente ou ativo.' })
      return
    }

    const { data: duel, error } = await supabase
      .from('arena_duels')
      .insert({
        player1_id: player1,
        player2_id: player2,
        pack_id: selectedPack,
        game_type: selectedGameType,
        status: 'pending',
      })
      .select()
      .single()

    setLoading(false)

    if (error || !duel) {
      console.error(error)
      setToast({ type: 'error', message: 'Erro ao iniciar o duelo. Tente novamente.' })
      return
    }

    setToast({ type: 'success', message: 'Duelo iniciado e notificado para os dois membros.' })
    setPlayer1('')
    setPlayer2('')
    setSelectedPack('')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]">
          <Wifi className="h-3 w-3" />
          {presenceStatus === 'live' ? `${onlineProfiles.length} online` : 'Sincronizando presenca'}
        </div>
        {onlineProfiles.slice(0, 6).map((profile) => (
          <div
            key={profile.id}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-container-low)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] shadow-[var(--shadow-sm)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            </span>
            {profile.username}
          </div>
        ))}
      </div>

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card overflow-hidden p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="section-kicker">Configuração da Arena</div>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">Configurar duelo</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                Escolha dois membros online, selecione o pack e defina o modo do confronto. O duelo só inicia com pareamento em tempo real.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
              <Swords className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Jogador 1
              </label>
              <select
                value={player1}
                onChange={(event) => setPlayer1(event.target.value)}
                className="field h-[58px] appearance-none"
              >
                <option value="">Selecione um membro...</option>
                {selectableProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Jogador 2
              </label>
              <select
                value={player2}
                onChange={(event) => setPlayer2(event.target.value)}
                className="field h-[58px] appearance-none"
              >
                <option value="">Selecione outro membro...</option>
                {selectableProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Pack
              </label>
              <select
                value={selectedPack}
                onChange={(event) => setSelectedPack(event.target.value)}
                className="field h-[58px] appearance-none"
              >
                <option value="">Selecione um pack...</option>
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Modo
              </label>
              <select
                value={selectedGameType}
                onChange={(event) => setSelectedGameType(event.target.value)}
                className="field h-[58px] appearance-none"
              >
                {GAME_TYPES.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {player1 && player2 && selectedPack && player1 !== player2 && (
            <div className="stitch-panel bg-[var(--color-surface-container-low)] p-6">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-[var(--color-surface-container-low)] text-lg font-bold text-[var(--color-primary)] shadow-[var(--shadow-sm)]">
                    {selectedPlayer1Name?.slice(0, 1).toUpperCase()}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">{selectedPlayer1Name}</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-on-primary)]">
                    VS
                  </div>
                  <div className="text-center text-xs text-[var(--color-text-subtle)]">
                    {selectedPackName}
                    <div className="mt-1 font-semibold text-[var(--color-primary)]">{selectedGame?.name}</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-[var(--color-surface-container-low)] text-lg font-bold text-[var(--color-primary)] shadow-[var(--shadow-sm)]">
                    {selectedPlayer2Name?.slice(0, 1).toUpperCase()}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">{selectedPlayer2Name}</p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-[1rem] bg-[var(--color-surface-container-low)]/80 px-4 py-4 text-sm text-[var(--color-text-muted)]">
                <Radio className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                <span>{selectedGame?.description}</span>
              </div>
            </div>
          )}

          {selectableProfiles.length < 2 && (
            <div className="rounded-[1rem] border border-[rgba(186,26,26,0.12)] bg-[rgba(186,26,26,0.06)] px-4 py-4 text-sm text-[var(--color-error)]">
              É preciso ter pelo menos dois membros para abrir um duelo.
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={startDuel}
              disabled={
                loading ||
                !player1 ||
                !player2 ||
                !selectedPack ||
                !selectedGameType ||
                player1 === player2 ||
                selectableProfiles.length < 2
              }
              className="btn-primary min-w-[220px] justify-center rounded-[1.2rem] py-4 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading ? (
                'Iniciando...'
              ) : (
                <>
                  <Swords className="h-5 w-5" strokeWidth={2.3} />
                  Iniciar duelo
                </>
              )}
            </button>
          </div>
        </div>
      </m.div>

      {activeDuels.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card overflow-hidden p-6 sm:p-8"
        >
          <div className="section-kicker mb-4">Duelos em andamento</div>
          <div className="flex flex-col gap-4">
            {activeDuels.map((duel) => {
              const p1 = profiles.find((p) => p.id === duel.player1_id)?.username
              const p2 = profiles.find((p) => p.id === duel.player2_id)?.username
              const pack = packs.find((p) => p.id === duel.pack_id)?.name
              return (
                <div key={duel.id} className="flex items-center justify-between rounded-xl border border-[var(--color-surface-container-highest)] bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
                  <div>
                    <div className="font-semibold text-[var(--color-text)]">
                      {p1} <span className="text-[var(--color-primary)] mx-1 text-xs">VS</span> {p2}
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {pack} • {GAME_TYPES.find((g) => g.id === duel.game_type)?.name} •{' '}
                      <span className="font-medium text-[var(--color-text)]">
                        {duel.status === 'pending' ? 'Pendente' : 'Ativo'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelDuel(duel.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(186,26,26,0.1)] text-[var(--color-error)] transition-colors hover:bg-[rgba(186,26,26,0.15)]"
                    title="Cancelar duelo"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )
            })}
          </div>
        </m.div>
      )}

      <AnimatePresence>
        {toast && (
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 z-[9999] -translate-x-1/2"
          >
            <div
              className={`flex items-center gap-3 rounded-2xl px-6 py-4 text-sm font-semibold shadow-[0_24px_60px_rgba(27,28,24,0.16)] ${
                toast.type === 'success'
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'bg-[var(--color-error)] text-[var(--color-on-primary)]'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {toast.message}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
