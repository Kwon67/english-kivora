'use client'

import { type ComponentType, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Headphones,
  Keyboard,
  Layers,
  Mic,
  Send,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'

type GameTypeOption = {
  id: string
  name: string
  description: string
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>
}

const GAME_TYPES: GameTypeOption[] = [
  { id: 'multiple_choice', name: 'Múltipla escolha', description: 'Perguntas rápidas com leitura e precisão.', Icon: Target },
  { id: 'matching', name: 'Associação', description: 'Pares de inglês e português em fluxo visual.', Icon: Layers },
  { id: 'flashcard', name: 'Flashcard', description: 'Recall direto para medir domínio real.', Icon: Sparkles },
  { id: 'typing', name: 'Digitação', description: 'Tradução escrita com foco em exatidão.', Icon: Keyboard },
  { id: 'listening', name: 'Escuta', description: 'Ouça, compreenda e responda com clareza.', Icon: Headphones },
  { id: 'speaking', name: 'Fala', description: 'Pronúncia e repetição com feedback objetivo.', Icon: Mic },
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
  const selectedGame = GAME_TYPES.find((game) => game.id === selectedGameType) || GAME_TYPES[0]

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
    const response = await fetch('/api/arena/duels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        opponentId: selectedOpponent,
        packId: selectedPack,
        gameType: selectedGameType,
      }),
    }).catch(() => null)
    const result = response ? await response.json().catch(() => null) : null

    setLoading(false)

    if (!response?.ok || !result?.duelId) {
      setToast({
        type: 'error',
        message: response?.status === 409 ? 'Um dos jogadores já está em outro duelo.' : 'Erro ao criar duelo.',
      })
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
      <section id="novo-duelo" className="premium-card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,var(--color-primary),var(--color-secondary),transparent)]" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="section-kicker">Novo desafio</div>
              <h2 className="mt-4 text-2xl font-black text-[var(--color-text)]">Monte um duelo limpo</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                Escolha um rival online, defina o pack e selecione o formato de treino. O convite aparece em tempo real para o outro jogador.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]">
              <Send className="h-5 w-5" strokeWidth={2.3} />
            </div>
          </div>

          {availableOpponents.length === 0 ? (
            <div className="rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-4 text-sm text-[var(--color-text-muted)]">
              Nenhum jogador online disponível para duelo no momento.
            </div>
          ) : (
            <>
              <div className="rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[var(--color-text)]">Rivais online</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Selecione alguém disponível para iniciar o pareamento.
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-primary)]">
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
                        aria-pressed={active}
                        className={`flex items-center justify-between gap-3 rounded-[1rem] border px-4 py-3 text-left ${
                          active
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]'
                            : 'border-transparent bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-border-hover)]'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-black text-[var(--color-on-primary)] shadow-[0_0_18px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]">
                            {user.username.charAt(0).toUpperCase()}
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-surface-container-lowest)] bg-[var(--color-success)]" />
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
                              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                              : 'bg-[var(--color-surface-container)] text-[var(--color-primary)]'
                          }`}
                        >
                          {active ? 'Selecionado' : 'Desafiar'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div ref={formRef} className="grid gap-4 md:grid-cols-2">
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

                <div className="space-y-2 md:col-span-2">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                    Modo
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {GAME_TYPES.map((game) => {
                      const active = selectedGameType === game.id
                      const GameIcon = game.Icon

                      return (
                        <button
                          key={game.id}
                          type="button"
                          onClick={() => setSelectedGameType(game.id)}
                          aria-pressed={active}
                          className={`flex min-h-[58px] items-center gap-3 rounded-[0.75rem] border px-3 text-left ${
                            active
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                              : 'border-[var(--color-border)] bg-[var(--color-surface-container)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                          }`}
                        >
                          <GameIcon className="h-4 w-4 shrink-0" strokeWidth={2.3} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-[var(--color-text)]">
                              {game.name}
                            </span>
                            <span className="block truncate text-[11px] text-[var(--color-text-subtle)]">
                              {game.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {selectedOpponent && (
                <div className="stitch-panel bg-[var(--color-surface-container-low)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text)]">
                        Duelo preparado contra {selectedOpponentName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                        {selectedPack
                          ? selectedGame.description
                          : 'Escolha um pack para liberar o convite.'}
                      </p>
                    </div>
                    <span className="stitch-pill bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                      pronto para enviar
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={startDuel}
                  disabled={loading || !selectedOpponent || !selectedPack}
                  className="btn-primary min-w-[220px] rounded-[1rem] py-4 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading ? 'Criando...' : (
                    <>
                      <Send className="h-5 w-5" strokeWidth={2.3} />
                      Criar duelo
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
