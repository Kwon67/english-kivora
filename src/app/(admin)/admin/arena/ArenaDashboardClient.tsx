'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Radio, Swords, Wifi } from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'

const GAME_TYPES = [
  { id: 'multiple_choice', name: 'Múltipla Escolha', description: 'Responda questões em ritmo de duelo.' },
  { id: 'matching', name: 'Matching', description: 'Associe pares EN ↔ PT em alta velocidade.' },
  { id: 'flashcard', name: 'Flashcard', description: 'Recall direto com decisão binária.' },
  { id: 'typing', name: 'Digitação', description: 'Escreva a tradução e pontue pela precisão.' },
]

interface ArenaDashboardProps {
  packs: { id: string; name: string }[]
  profiles: { id: string; username: string; role?: string }[]
}

export default function ArenaDashboardClient({ packs, profiles }: ArenaDashboardProps) {
  const router = useRouter()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [selectedPack, setSelectedPack] = useState('')
  const [selectedGameType, setSelectedGameType] = useState('multiple_choice')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channelRef: ReturnType<typeof supabase.channel> | null = null

    async function setupPresence() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token)
      }

      const existingChannel = supabase.getChannels().find((c) => c.topic === 'realtime:member-home-realtime')
      if (existingChannel) {
        await supabase.removeChannel(existingChannel)
      }

      const channel = supabase.channel('member-home-realtime', {
        config: { presence: { key: '' } },
      })
      channelRef = channel

      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const users = new Set<string>()
        for (const id in newState) {
          const presences = newState[id] as { user_id?: string }[]
          for (const presence of presences) {
            if (presence.user_id) users.add(presence.user_id)
          }
        }
        setOnlineUsers(Array.from(users))
      })

      await channel.subscribe()
    }

    void setupPresence()

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef)
      }
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const memberProfiles = profiles.filter((profile) => profile.role !== 'admin')
  const onlineProfiles = memberProfiles.filter((profile) => onlineUsers.includes(profile.id))
  const selectedPlayer1Name = onlineProfiles.find((profile) => profile.id === player1)?.username
  const selectedPlayer2Name = onlineProfiles.find((profile) => profile.id === player2)?.username
  const selectedPackName = packs.find((pack) => pack.id === selectedPack)?.name
  const selectedGame = GAME_TYPES.find((game) => game.id === selectedGameType)

  async function startDuel() {
    if (!player1 || !player2 || !selectedPack || !selectedGameType) return

    if (player1 === player2) {
      setToast({ type: 'error', message: 'Selecione membros diferentes para o duelo.' })
      return
    }

    if (!onlineUsers.includes(player1) || !onlineUsers.includes(player2)) {
      setToast({ type: 'error', message: 'Os dois membros precisam estar online para iniciar o duelo.' })
      return
    }

    setLoading(true)
    const supabase = createClient()

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
          {onlineProfiles.length} online
        </div>
        {onlineProfiles.slice(0, 6).map((profile) => (
          <div
            key={profile.id}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] shadow-[0_6px_18px_rgba(27,28,24,0.05)]"
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
              <div className="section-kicker">Arena configuration</div>
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
                <option value="">Selecione um membro online...</option>
                {onlineProfiles.map((profile) => (
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
                <option value="">Selecione outro membro online...</option>
                {onlineProfiles.map((profile) => (
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
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-white text-lg font-bold text-[var(--color-primary)] shadow-[0_8px_18px_rgba(27,28,24,0.06)]">
                    {selectedPlayer1Name?.slice(0, 1).toUpperCase()}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">{selectedPlayer1Name}</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    VS
                  </div>
                  <div className="text-center text-xs text-[var(--color-text-subtle)]">
                    {selectedPackName}
                    <div className="mt-1 font-semibold text-[var(--color-primary)]">{selectedGame?.name}</div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-white text-lg font-bold text-[var(--color-primary)] shadow-[0_8px_18px_rgba(27,28,24,0.06)]">
                    {selectedPlayer2Name?.slice(0, 1).toUpperCase()}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">{selectedPlayer2Name}</p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-[1rem] bg-white/80 px-4 py-4 text-sm text-[var(--color-text-muted)]">
                <Radio className="mt-0.5 h-4 w-4 text-[var(--color-primary)]" />
                <span>{selectedGame?.description}</span>
              </div>
            </div>
          )}

          {onlineProfiles.length < 2 && (
            <div className="rounded-[1rem] border border-[rgba(186,26,26,0.12)] bg-[rgba(186,26,26,0.06)] px-4 py-4 text-sm text-[var(--color-error)]">
              É preciso ter pelo menos dois membros online para abrir um duelo.
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
                onlineProfiles.length < 2
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
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-error)] text-white'
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
