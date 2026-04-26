'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Swords, CheckCircle2, AlertCircle, Users } from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'

const GAME_TYPES = [
  { id: 'multiple_choice', name: 'Múltipla Escolha', description: 'Responda questões em ritmo de duelo.' },
  { id: 'matching', name: 'Associação', description: 'Associe pares de inglês e português em alta velocidade.' },
  { id: 'flashcard', name: 'Flashcard', description: 'Recall direto com decisão binária.' },
  { id: 'typing', name: 'Digitação', description: 'Escreva a tradução e pontue pela precisão.' },
  { id: 'listening', name: 'Escuta', description: 'Ouça e escreva a tradução.' },
  { id: 'speaking', name: 'Fala', description: 'Ouça e repita para treinar pronúncia.' },
]

interface ArenaCreateDuelProps {
  packs: { id: string; name: string }[]
  onlineUsers: { id: string; username: string; role?: string }[]
  currentUserId: string
}

export default function ArenaCreateDuel({ packs, onlineUsers, currentUserId }: ArenaCreateDuelProps) {
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const [selectedOpponent, setSelectedOpponent] = useState('')
  const [selectedPack, setSelectedPack] = useState('')
  const [selectedGameType, setSelectedGameType] = useState('multiple_choice')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const availableOpponents = onlineUsers.filter((u) => u.id !== currentUserId)
  const selectedOpponentName =
    availableOpponents.find((opponent) => opponent.id === selectedOpponent)?.username || ''

  function selectOpponent(opponentId: string) {
    setSelectedOpponent(opponentId)

    if (!selectedPack && packs.length === 1) {
      setSelectedPack(packs[0].id)
    }

    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function startDuel() {
    if (!selectedOpponent || !selectedPack) return

    setLoading(true)
    const supabase = createClient()

    // Auto-cancel stale pending duels
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    await supabase
      .from('arena_duels')
      .update({
        status: 'cancelled',
        finished_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .or(`player1_id.eq.${currentUserId},player2_id.eq.${currentUserId},player1_id.eq.${selectedOpponent},player2_id.eq.${selectedOpponent}`)
      .lt('created_at', fiveMinutesAgo)

    // Check for conflicting duels
    const { data: conflictingDuels } = await supabase
      .from('arena_duels')
      .select('id')
      .in('status', ['pending', 'active'])
      .or(`player1_id.eq.${currentUserId},player2_id.eq.${currentUserId},player1_id.eq.${selectedOpponent},player2_id.eq.${selectedOpponent}`)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(1)

    if (conflictingDuels && conflictingDuels.length > 0) {
      setLoading(false)
      setToast({ type: 'error', message: 'Um dos jogadores já está em outro duelo.' })
      return
    }

    // Create duel
    const { data: duel, error } = await supabase
      .from('arena_duels')
      .insert({
        player1_id: currentUserId,
        player2_id: selectedOpponent,
        pack_id: selectedPack,
        game_type: selectedGameType,
        status: 'pending',
      })
      .select()
      .single()

    setLoading(false)

    if (error || !duel) {
      setToast({ type: 'error', message: 'Erro ao criar duelo.' })
      return
    }

    setToast({ type: 'success', message: 'Duelo criado! Aguardando oponente aceitar...' })
    
    // Reset form
    setSelectedOpponent('')
    setSelectedPack('')
    setSelectedGameType('multiple_choice')
    
    // Refresh page to show pending duel
    router.refresh()
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] border border-red-950/25 bg-[linear-gradient(180deg,var(--color-card),rgba(127,29,29,0.10))] p-6 shadow-[0_22px_60px_rgba(127,29,29,0.14)] sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,#991b1b,#ef4444,#991b1b,transparent)]" />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="section-kicker !bg-red-950/10 !text-red-700">Novo massacre</div>
              <h2 className="mt-4 text-2xl font-black text-[var(--color-text)]">Escolha a vítima</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                Clique em um rival online, escolha o pack e mande o desafio direto para a arena.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-950/20 bg-red-950/10 text-red-700 shadow-[0_0_24px_rgba(220,38,38,0.18)]">
              <Swords className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>

          {availableOpponents.length === 0 ? (
            <div className="rounded-[1rem] border border-[rgba(186,26,26,0.12)] bg-[rgba(186,26,26,0.06)] px-4 py-4 text-sm text-[var(--color-error)]">
              Nenhum jogador online disponível para duelo no momento.
            </div>
          ) : (
            <>
              <div className="rounded-[1.35rem] border border-red-950/20 bg-[linear-gradient(135deg,rgba(127,29,29,0.10),var(--color-surface-container-low)_62%)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[var(--color-text)]">Rivais online</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Quem vai sangrar pontos primeiro?
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-950/10 bg-red-950/10 text-red-700">
                    <Users className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {availableOpponents.map((user) => {
                    const active = selectedOpponent === user.id

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => selectOpponent(user.id)}
                        className={`flex items-center justify-between gap-3 rounded-[1rem] border px-4 py-3 text-left ${
                          active
                            ? 'border-red-700 bg-red-950/10 shadow-[0_12px_28px_rgba(127,29,29,0.16)]'
                            : 'border-transparent bg-[var(--color-surface-container-lowest)] hover:border-red-900/30'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-700 text-sm font-black text-white shadow-[0_0_18px_rgba(185,28,28,0.30)]">
                            {user.username.charAt(0).toUpperCase()}
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-surface-container-lowest)] bg-red-500" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-[var(--color-text)]">
                              {user.username}
                            </span>
                            <span className="mt-0.5 block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                              {user.role === 'admin' ? 'admin online' : 'online agora'}
                            </span>
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                            active
                              ? 'bg-red-700 text-white'
                              : 'bg-red-950/10 text-red-700'
                          }`}
                        >
                          {active ? 'Selecionado' : 'Desafiar'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div ref={formRef} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                    Oponente
                  </label>
                  <select
                    value={selectedOpponent}
                    onChange={(e) => setSelectedOpponent(e.target.value)}
                    className="field h-[58px] appearance-none"
                  >
                    <option value="">Selecione um jogador...</option>
                    {availableOpponents.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username}
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
                    onChange={(e) => setSelectedPack(e.target.value)}
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
                    Modo de Jogo
                  </label>
                  <select
                    value={selectedGameType}
                    onChange={(e) => setSelectedGameType(e.target.value)}
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

              {selectedOpponent && (
                <div className="stitch-panel bg-[var(--color-surface-container-low)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text)]">
                        Duelo armado contra {selectedOpponentName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {selectedPack
                          ? GAME_TYPES.find((g) => g.id === selectedGameType)?.description
                          : 'Escolha um pack para liberar o ataque.'}
                      </p>
                    </div>
                    <span className="stitch-pill bg-red-950/10 text-red-700">
                      lâmina pronta
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={startDuel}
                  disabled={loading || !selectedOpponent || !selectedPack}
                  className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-[1.2rem] bg-red-700 px-6 py-4 text-sm font-black text-white shadow-[0_16px_36px_rgba(185,28,28,0.28)] hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading ? 'Armando...' : (
                    <>
                      <Swords className="h-5 w-5" strokeWidth={2.3} />
                      Derramar pontos
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

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
    </>
  )
}
