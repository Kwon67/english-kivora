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
  'render-contained relative overflow-hidden rounded-[32px] border border-dashed border-[#172113]/22 dark:border-[#d5e6a9]/20 bg-[#fbfcf2]/65 dark:bg-[#11160e]/65 shadow-[0_22px_64px_rgba(31,43,18,0.08)] dark:shadow-[0_22px_64px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300'
const glassTile =
  'render-contained relative overflow-hidden rounded-[28px] border border-dashed border-[#172113]/22 dark:border-[#d5e6a9]/20 bg-[#fbfcf2]/55 dark:bg-[#11160e]/55 shadow-sm backdrop-blur-sm transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-[#183b16]/10 dark:border-[#b8ff5c]/10 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#183b16] dark:text-[#b8ff5c]'
const fieldGlass =
  'field h-[58px] appearance-none !rounded-[24px] !bg-[#fbfcf2]/65 dark:!bg-[#11160e]/65 !text-[#10130f] dark:!text-[#f4f7e9] !shadow-[inset_0_0_0_1px_rgba(23,33,19,0.15)] dark:!shadow-[inset_0_0_0_1px_rgba(213,230,169,0.15)] px-4 focus:ring-2 focus:ring-[#183b16] dark:focus:ring-[#b8ff5c]'
const iconBubble =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c] shadow-sm ring-1 ring-[#183b16]/10 dark:ring-[#b8ff5c]/10'
const glassPill =
  'inline-flex items-center gap-1.5 rounded-full border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2]/55 dark:bg-[#11160e]/55 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-[#425039] dark:text-[#b9c3a4] shadow-sm backdrop-blur-sm'

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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fbfcf2]/45 via-transparent to-[#183b16]/5 dark:to-[#b8ff5c]/5" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className={softKicker}>Novo desafio</div>
              <h2 className="mt-4 font-montserrat text-2xl font-bold text-zinc-900">Monte um duelo limpo</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
                Escolha um rival online, defina o pack e selecione o formato de treino. O convite aparece em tempo real para o outro jogador.
              </p>
            </div>
            <div className={iconBubble}>
              <Send className="h-5 w-5" strokeWidth={2.3} />
            </div>
          </div>

          {availableOpponents.length === 0 ? (
            <div className="overflow-hidden rounded-[24px] border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2]/35 dark:bg-[#11160e]/35 px-4 py-4 text-sm font-semibold text-[var(--color-text-muted)] shadow-sm backdrop-blur-sm">
              Nenhum jogador online disponível para duelo no momento.
            </div>
          ) : (
            <>
              <div className={`${glassTile} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-900">Rivais online</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Selecione alguém disponível para iniciar o pareamento.
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbfcf2]/55 dark:bg-[#11160e]/55 text-[#183b16] dark:text-[#b8ff5c] shadow-sm ring-1 ring-[#172113]/15 dark:ring-[#d5e6a9]/15">
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
                        className={`flex items-center justify-between gap-3 overflow-hidden rounded-[24px] border px-4 py-3 text-left shadow-sm backdrop-blur-sm ${
                          active
                            ? 'border-[#183b16]/30 dark:border-[#b8ff5c]/30 bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c]'
                            : 'border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2]/40 dark:bg-[#11160e]/40 text-[#425039] dark:text-[#b9c3a4] hover:border-[#183b16]/30 dark:hover:border-[#b8ff5c]/30 hover:bg-[#fbfcf2]/65 dark:hover:bg-[#11160e]/65'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-black text-white shadow-sm">
                            {user.username.charAt(0).toUpperCase()}
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-zinc-900">
                              {user.username}
                            </span>
                            <span className="mt-0.5 block text-[11px] uppercase tracking-[0.14em] text-zinc-500">
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
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
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
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
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
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
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
                          className={`flex min-h-[58px] items-center gap-3 overflow-hidden rounded-[24px] border px-3 text-left shadow-sm backdrop-blur-sm ${
                            active
                              ? 'border-[#183b16]/30 dark:border-[#b8ff5c]/30 bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c]'
                              : 'border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2]/35 dark:bg-[#11160e]/35 text-[#425039] dark:text-[#b9c3a4] hover:border-[#183b16]/30 dark:hover:border-[#b8ff5c]/30 hover:bg-[#fbfcf2]/60 dark:hover:bg-[#11160e]/60'
                          }`}
                        >
                          <GameIcon className="h-4 w-4 shrink-0" strokeWidth={2.3} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black text-zinc-900">
                              {game.name}
                            </span>
                            <span className="block truncate text-[11px] text-zinc-500">
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
                      <p className="text-sm font-bold text-zinc-900">
                        Duelo preparado contra {selectedOpponentName}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
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
                  className="inline-flex min-h-12 min-w-[220px] items-center justify-center gap-2 rounded-[32px] bg-[#183b16] dark:bg-[#b8ff5c] px-5 py-4 font-montserrat text-sm font-bold text-white dark:text-[#050704] shadow-[0px_8px_15px_0px_rgba(0,0,0,0.10)] transition-colors hover:bg-[#255423] dark:hover:bg-[#a6e650] disabled:cursor-not-allowed disabled:opacity-55"
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
              className={`flex items-center gap-3 rounded-[28px] px-6 py-4 text-sm font-semibold shadow-[0_24px_60px_rgba(27,28,24,0.16)] ${
                toast.type === 'success'
                  ? 'bg-emerald-800 text-white'
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
