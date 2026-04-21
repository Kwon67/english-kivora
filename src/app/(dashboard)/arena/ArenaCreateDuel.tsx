'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Swords, CheckCircle2, AlertCircle } from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'

const GAME_TYPES = [
  { id: 'multiple_choice', name: 'Múltipla Escolha', description: 'Responda questões em ritmo de duelo.' },
  { id: 'matching', name: 'Matching', description: 'Associe pares EN ↔ PT em alta velocidade.' },
  { id: 'flashcard', name: 'Flashcard', description: 'Recall direto com decisão binária.' },
  { id: 'typing', name: 'Digitação', description: 'Escreva a tradução e pontue pela precisão.' },
]

interface ArenaCreateDuelProps {
  packs: { id: string; name: string }[]
  onlineUsers: { id: string; username: string; role?: string }[]
  currentUserId: string
}

export default function ArenaCreateDuel({ packs, onlineUsers, currentUserId }: ArenaCreateDuelProps) {
  const router = useRouter()
  const [selectedOpponent, setSelectedOpponent] = useState('')
  const [selectedPack, setSelectedPack] = useState('')
  const [selectedGameType, setSelectedGameType] = useState('multiple_choice')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const availableOpponents = onlineUsers.filter((u) => u.id !== currentUserId)

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

    setToast({ type: 'success', message: 'Duelo criado! Entrando...' })
    
    // Redirect to duel
    setTimeout(() => {
      router.push(`/arena/${duel.id}`)
    }, 1000)
  }

  return (
    <>
      <section className="premium-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="section-kicker">Novo desafio</div>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">Desafiar jogador</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                Escolha um oponente online, selecione o pack e defina o modo do confronto.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-primary)]">
              <Swords className="h-6 w-6" strokeWidth={2} />
            </div>
          </div>

          {availableOpponents.length === 0 ? (
            <div className="rounded-[1rem] border border-[rgba(186,26,26,0.12)] bg-[rgba(186,26,26,0.06)] px-4 py-4 text-sm text-[var(--color-error)]">
              Nenhum jogador online disponível para duelo no momento.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
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

              {selectedOpponent && selectedPack && (
                <div className="stitch-panel bg-[var(--color-surface-container-low)] p-4">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {GAME_TYPES.find((g) => g.id === selectedGameType)?.description}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={startDuel}
                  disabled={loading || !selectedOpponent || !selectedPack}
                  className="btn-primary min-w-[220px] justify-center rounded-[1.2rem] py-4 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading ? 'Criando...' : (
                    <>
                      <Swords className="h-5 w-5" strokeWidth={2.3} />
                      Iniciar Duelo
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
    </>
  )
}
