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

const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] shadow-[0_18px_48px_rgba(31,43,18,0.14)] transition-all duration-300 dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]'
const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] transition-all duration-300 dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c]'
const fieldGlass =
  'field h-[58px] appearance-none !rounded-[20px] !bg-[#fbfcf2] px-4 !text-[#10130f] !shadow-[inset_0_0_0_1px_rgba(23,33,19,0.15)] focus:ring-2 focus:ring-[#183b16] dark:!bg-[#11160e] dark:!text-[#f4f7e9] dark:!shadow-[inset_0_0_0_1px_rgba(213,230,169,0.15)] dark:focus:ring-[#b8ff5c]'
const iconBubble =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] shadow-sm ring-1 ring-[#172113]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c] dark:ring-[#d5e6a9]/18'
const glassPill =
  'inline-flex items-center gap-1.5 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-[#183b16] shadow-sm dark:border-[#d5e6a9]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c]'

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
      <section id="novo-duelo" className={`${glassPanel} p-6 sm:p-8`}>
        <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className={softKicker}>Novo desafio</div>
              <h2 className="mt-4 font-montserrat text-2xl font-bold text-[var(--color-text)]">Monte um duelo limpo</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                Escolha um rival online, defina o pack e selecione o formato de treino. O convite aparece em tempo real para o outro jogador.
              </p>
            </div>
            <div className={iconBubble}>
              <Send className="h-5 w-5" strokeWidth={2.3} />
            </div>
          </div>

          {availableOpponents.length === 0 ? (
            <div className="overflow-hidden rounded-[20px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] px-4 py-4 text-sm font-semibold text-[var(--color-text-muted)] shadow-sm dark:border-[#d5e6a9]/20 dark:bg-[#11160e]">
              Nenhum jogador online disponível para duelo no momento.
            </div>
          ) : (
            <>
              <div className={`${glassTile} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[var(--color-text)]">Rivais online</p>
                    <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                      Selecione alguém disponível para iniciar o pareamento.
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbfcf2] dark:bg-[#11160e] text-[#183b16] dark:text-[#b8ff5c] shadow-sm ring-1 ring-[#172113]/15 dark:ring-[#d5e6a9]/15">
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
                        className={`flex items-center justify-between gap-3 overflow-hidden rounded-[20px] border px-4 py-3 text-left shadow-sm ${
                          active
                            ? 'border-[#183b16]/30 dark:border-[#b8ff5c]/30 bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c]'
                              : 'border-[#172113]/18 bg-[#f7f8ef] text-[#425039] hover:border-[#183b16]/30 hover:bg-[#fbfcf2] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:text-[#b9c3a4] dark:hover:border-[#b8ff5c]/30'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#183b16] text-sm font-black text-[#f7f8ef] shadow-sm dark:bg-[#b8ff5c] dark:text-[#050704]">
                            {user.username.charAt(0).toUpperCase()}
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#fbfcf2] bg-[#b8ff5c] dark:border-[#11160e]" />
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
                              ? 'bg-[#183b16] dark:bg-[#b8ff5c] text-white dark:text-[#050704]'
                              : 'bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c]'
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
                    className={fieldGlass}
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
                    className={fieldGlass}
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
                          className={`flex min-h-[58px] items-center gap-3 overflow-hidden rounded-[20px] border px-3 text-left shadow-sm ${
                            active
                              ? 'border-[#183b16]/30 dark:border-[#b8ff5c]/30 bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c]'
                              : 'border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#f7f8ef] dark:bg-[#11160e] text-[#425039] dark:text-[#b9c3a4] hover:border-[#183b16]/30 dark:hover:border-[#b8ff5c]/30 hover:bg-[#fbfcf2] dark:hover:bg-[#11160e]'
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
                <div className={`${glassTile} p-4`}>
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
                    <span className={glassPill}>
                      pronto para enviar
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={startDuel}
                  disabled={loading || !selectedOpponent || !selectedPack}
                  className="inline-flex min-h-12 min-w-[220px] items-center justify-center gap-2 rounded-full bg-[#183b16] px-5 py-4 font-montserrat text-sm font-bold text-[#f7f8ef] shadow-[0_10px_22px_rgba(24,59,22,0.22)] transition-colors hover:bg-[#24551d] disabled:cursor-not-allowed disabled:opacity-55 dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83]"
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
              className={`flex items-center gap-3 rounded-[20px] px-6 py-4 text-sm font-semibold shadow-[0_24px_60px_rgba(27,28,24,0.16)] ${
                toast.type === 'success'
                  ? 'bg-[#183b16] text-[#f7f8ef] dark:bg-[#b8ff5c] dark:text-[#050704]'
                  : 'bg-red-700 text-white'
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
