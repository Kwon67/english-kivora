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
      <section className="premium-card p-6 sm:p-7 relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Confrontos recentes</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
              Histórico geral da arena
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && duels.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={isPending}
                className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--color-error)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] px-3 py-1.5 text-xs font-bold text-[var(--color-error)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)] disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                Limpar Histórico
              </button>
            )}
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
        </div>

        <div className="mt-6 space-y-3 relative min-h-[100px]">
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
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]'

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
                    <details className="group rounded-[1rem] border border-transparent bg-[var(--color-surface-container-low)] px-4 py-4 transition-colors open:border-[var(--color-border-hover)] open:bg-[var(--color-surface-container-high)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-container-high)]">
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
                              <p className="truncate text-sm font-black text-[var(--color-text)]">
                                {player.name}
                              </p>
                              {player.isWinner && (
                                <span className="stitch-pill bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                                  Vencedor
                                </span>
                              )}
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                                  Acertos
                                </p>
                                <p className="mt-1 text-lg font-black text-[var(--color-text)]">
                                  {player.score}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                                  Erros
                                </p>
                                <p className="mt-1 text-lg font-black text-[var(--color-error)]">
                                  {player.wrong}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                                  Acerto
                                </p>
                                <p className="mt-1 text-lg font-black text-[var(--color-primary)]">
                                  {formatRate(player.score, player.totalAnswers)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                                  Erro
                                </p>
                                <p className="mt-1 text-lg font-black text-[var(--color-text)]">
                                  {formatRate(player.wrong, player.totalAnswers)}
                                </p>
                              </div>
                            </div>
                            <p className="mt-3 text-xs font-semibold text-[var(--color-text-muted)]">
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
                />
              </m.div>
            )}
          </AnimatePresence>
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
            className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] sm:bottom-6 left-1/2 z-50 flex items-center gap-4 rounded-full bg-[var(--color-surface-container-high)]/80 backdrop-blur-md border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-6 py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text)] select-none">
                🧹 Histórico limpo
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => handleToggleHistory(!isHistoryCleared)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isHistoryCleared
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[color-mix(in_srgb,var(--color-text)_20%,transparent)]'
              }`}
              aria-label="Toggle histórico limpo"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--color-surface)] shadow-lg ring-0 transition duration-200 ease-in-out ${
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
