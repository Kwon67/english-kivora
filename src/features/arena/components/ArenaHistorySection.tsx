'use client'

import { useState, useTransition } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Clock3, Sparkles, Trash2, Loader2 } from 'lucide-react'
import { formatAppDate } from '@/lib/timezone'
import { clearArenaHistory } from '@/app/actions'
import EmptyState from '@/components/ui/EmptyState'

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

interface ArenaHistorySectionProps {
  initialGlobalDuels: ArenaDuelRow[]
  isAdmin: boolean
  profileNames: Record<string, string>
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
  if (!Array.isArray(events)) return 0
  return events.filter((event) => (
    event &&
    typeof event === 'object' &&
    'correct' in event &&
    event.correct === true
  )).length
}

function formatRate(value: number, total: number) {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

const glassPanel =
  'render-contained relative overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 shadow-[0_24px_70px_rgba(24,32,29,0.12)] backdrop-blur-md'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-emerald-800'
const glassPill =
  'inline-flex items-center gap-1.5 rounded-full border border-zinc-200/60 bg-white/45 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-zinc-600 shadow-sm backdrop-blur-sm'

export default function ArenaHistorySection({
  initialGlobalDuels,
  isAdmin,
  profileNames,
}: ArenaHistorySectionProps) {
  const [duels, setDuels] = useState<ArenaDuelRow[]>(initialGlobalDuels)
  const [backupDuels, setBackupDuels] = useState<ArenaDuelRow[]>([])
  const [isPending, startTransition] = useTransition()
  
  // Track if the history is marked as cleared in UI
  const [isHistoryCleared, setIsHistoryCleared] = useState(initialGlobalDuels.length === 0)
  
  // We only show the floating toggle once a clear has been executed in the session
  // or if the initial list is empty, allowing users to toggle show/hide.
  const [hasClearedSession, setHasClearedSession] = useState(false)

  const [prevInitialGlobalDuels, setPrevInitialGlobalDuels] = useState<ArenaDuelRow[]>(initialGlobalDuels)

  if (initialGlobalDuels !== prevInitialGlobalDuels) {
    setPrevInitialGlobalDuels(initialGlobalDuels)
    if (!hasClearedSession) {
      setDuels(initialGlobalDuels)
      setIsHistoryCleared(initialGlobalDuels.length === 0)
    }
  }


  const handleClearHistory = () => {
    if (isPending) return
    
    // Save current duels to backup state
    setBackupDuels(duels)
    setHasClearedSession(true)
    
    // Step 1: Trigger exit animation by empty out the duels array
    setDuels([])
    setIsHistoryCleared(true)

    // Step 2: Call server action after animation (approx. 800ms to allow exit transitions to complete)
    setTimeout(() => {
      startTransition(async () => {
        try {
          await clearArenaHistory()
        } catch (error) {
          console.error('Erro ao limpar histórico no banco:', error)
          // Restore on failure
          setDuels(backupDuels)
          setIsHistoryCleared(false)
          setHasClearedSession(false)
        }
      })
    }, 800)
  }

  const handleToggleHistory = (checked: boolean) => {
    setIsHistoryCleared(checked)
    if (checked) {
      // Clear UI
      setBackupDuels(duels)
      setDuels([])
    } else {
      // Restore UI from backup (or initial if backup is empty)
      const listToRestore = backupDuels.length > 0 ? backupDuels : initialGlobalDuels
      setDuels(listToRestore)
    }
  }

  const showFloatingToggle = hasClearedSession || initialGlobalDuels.length === 0

  return (
    <>
      <section className={`${glassPanel} p-6 sm:p-7`}>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-emerald-50/30" />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={softKicker}>Confrontos recentes</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold text-zinc-900">
                Histórico geral da arena
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && duels.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={isPending}
                  className="flex cursor-pointer items-center gap-1.5 rounded-[24px] border border-red-200/70 bg-white/45 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50/80 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Limpar Histórico
                </button>
              )}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 shadow-sm ring-1 ring-emerald-900/10">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="relative mt-6 min-h-[100px] space-y-3">
            <AnimatePresence mode="popLayout">
              {duels.length > 0 ? (
                duels.map((duel, index) => {
                const player1Name = profileNames[duel.player1_id] || 'Jogador 1'
                const player2Name = profileNames[duel.player2_id] || 'Jogador 2'
                const winnerName = duel.winner_id ? profileNames[duel.winner_id] : null
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
                    ? 'border-emerald-900/10 bg-emerald-50/70 text-emerald-800'
                    : 'border-zinc-200/60 bg-white/45 text-zinc-600'

                return (
                  <m.div
                    key={duel.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      x: -120,
                      scale: 0.95,
                      filter: 'blur(4px)',
                      transition: {
                        duration: 0.45,
                        delay: index * 0.04, // Beautiful staggered exit wave!
                        ease: [0.32, 0, 0.67, 0]
                      }
                    }}
                    className="origin-left overflow-hidden content-visibility-auto"
                  >
                    <details className="group rounded-[28px] border border-zinc-200/55 bg-white/35 px-4 py-4 shadow-[0_12px_34px_rgba(24,32,29,0.05)] backdrop-blur-sm transition-colors open:border-emerald-900/15 open:bg-white/60 hover:border-emerald-900/15 hover:bg-white/55">
                      <summary className="flex cursor-pointer list-none flex-col gap-3 marker:hidden sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900">
                            {player1Name} vs {player2Name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                            {duel.packs?.name || 'Pack da Arena'} • {formatGameType(duel.game_type)} • {formatAppDate(duel.created_at, { day: '2-digit', month: '2-digit' })}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <span className="text-sm font-black tabular-nums text-zinc-900">
                            {duel.player1_score} x {duel.player2_score}
                          </span>
                          <span className={`${glassPill} ${outcomeClass}`}>{outcome}</span>
                          <Clock3 className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" />
                        </div>
                      </summary>

                      <div className="mt-4 grid gap-3 border-t border-zinc-200/55 pt-4 md:grid-cols-2">
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
                            className="rounded-[24px] border border-zinc-200/55 bg-white/45 p-4 shadow-sm backdrop-blur-sm"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-sm font-black text-zinc-900">
                                {player.name}
                              </p>
                              {player.isWinner && (
                                <span className={`${glassPill} border-emerald-900/10 bg-emerald-50/70 text-emerald-800`}>
                                  Vencedor
                                </span>
                              )}
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                                  Acertos
                                </p>
                                <p className="mt-1 text-lg font-black text-zinc-900">
                                  {player.score}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                                  Erros
                                </p>
                                <p className="mt-1 text-lg font-black text-red-700">
                                  {player.wrong}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                                  Acerto
                                </p>
                                <p className="mt-1 text-lg font-black text-emerald-800">
                                  {formatRate(player.score, player.totalAnswers)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                                  Erro
                                </p>
                                <p className="mt-1 text-lg font-black text-zinc-900">
                                  {formatRate(player.wrong, player.totalAnswers)}
                                </p>
                              </div>
                            </div>
                            <p className="mt-3 text-xs font-semibold text-zinc-600">
                              Frases concluídas: {player.progress}/10
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </m.div>
                )
              })
            ) : (
              <m.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <EmptyState
                  imageSrc="/images/arena/arena-command.svg"
                  imageAlt="Ilustração de painel competitivo da arena"
                  title="Nenhum confronto registrado."
                  description="Os duelos finalizados vão aparecer aqui assim que a arena ganhar movimento."
                  variant="arena"
                  className="border-zinc-200/55 bg-white/35 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm"
                />
              </m.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Floating glassmorphic toggle at the bottom of the screen */}
      <AnimatePresence>
        {showFloatingToggle && (
          <m.div
            initial={{ y: 80, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 80, x: '-50%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex items-center gap-4 rounded-full border border-zinc-200/55 bg-white/70 px-6 py-3.5 shadow-[0_20px_50px_rgba(24,32,29,0.16)] backdrop-blur-md transition-all sm:bottom-6"
          >
            <div className="flex items-center gap-2">
              <span className="select-none text-sm font-semibold text-zinc-900">
                🧹 Histórico limpo
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => handleToggleHistory(!isHistoryCleared)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isHistoryCleared
                  ? 'bg-emerald-800'
                  : 'bg-zinc-300'
              }`}
              aria-label="Toggle histórico limpo"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-50 shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isHistoryCleared ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
