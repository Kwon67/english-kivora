'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Clock3,
  Flame,
  Keyboard,
  Layers,
  Loader2,
  Puzzle,
  Target,
  Trophy,
  TrendingUp,
  X,
} from 'lucide-react'
import { startAssignmentTimer, submitGameResult } from '@/app/actions'
import MultipleChoice from '@/components/game/MultipleChoice'
import Flashcard from '@/components/game/Flashcard'
import MatchingGame from '@/components/game/MatchingGame'
import TypingMode from '@/components/game/TypingMode'
import { useGameStore } from '@/store/gameStore'

const gameModeConfig: Record<string, { label: string; icon: typeof Target; note: string }> = {
  multiple_choice: {
    label: 'Múltipla escolha',
    icon: Target,
    note: 'Leitura rápida, contexto e decisão imediata.',
  },
  flashcard: {
    label: 'Flashcard',
    icon: Layers,
    note: 'Memorização ativa com repetição curta e objetiva.',
  },
  typing: {
    label: 'Digitação',
    icon: Keyboard,
    note: 'Recuperação escrita para consolidar tradução.',
  },
  matching: {
    label: 'Combinação',
    icon: Puzzle,
    note: 'Associação visual para ganhar velocidade de recall.',
  },
}

export default function GameWrapper({
  timerConfig,
}: {
  timerConfig: {
    timeLimitMinutes: number | null
    startedAt: string | null
    deadlineAt: string | null
  }
}) {
  const {
    phase,
    cards,
    gameMode,
    packName,
    assignmentId,
    correct,
    wrong,
    errorLog,
    currentStreak,
    maxStreak,
    startGame,
    answerCorrect,
    answerWrong,
    finishGame,
    resetGame,
  } = useGameStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [q, setQ] = useState(cards)
  const [i, setI] = useState(0)
  const [timerState, setTimerState] = useState(timerConfig)
  const [now, setNow] = useState(() => Date.now())
  const saveResultPromise = useRef<Promise<void> | null>(null)

  const currentCard = q[i]
  const totalAnswered = correct + wrong
  const accuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0
  const progress = q.length > 0 ? ((i + 1) / q.length) * 100 : 0
  const modeConfig = gameModeConfig[gameMode] || gameModeConfig.multiple_choice
  const ModeIcon = modeConfig.icon
  const estimatedMinutes =
    gameMode === 'matching' ? Math.max(4, Math.ceil(cards.length * 0.5)) : Math.max(3, Math.ceil(cards.length * 0.35))
  const hasTimer = Boolean(timerState.timeLimitMinutes)
  const timerStarted = Boolean(timerState.startedAt)
  const deadlineMs = timerState.deadlineAt ? new Date(timerState.deadlineAt).getTime() : null
  const remainingMs = deadlineMs ? Math.max(deadlineMs - now, 0) : null
  const timerExpired = deadlineMs ? deadlineMs <= now : false

  useEffect(() => {
    setTimerState(timerConfig)
  }, [timerConfig])

  useEffect(() => {
    if (!hasTimer || !timerStarted) return

    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [hasTimer, timerStarted])

  function formatRemaining(ms: number) {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  function nextCard() {
    if (i + 1 >= q.length) {
      finishGame()
      return
    }
    setI((value) => value + 1)
  }

  function handleCorrect() {
    answerCorrect()
    nextCard()
  }

  function handleWrong() {
    answerWrong(currentCard?.id)
    if (!currentCard) return

    const lastCard = i >= q.length - 1

    setQ((value) => {
      const before = value.slice(0, i)
      const after = value.slice(i + 1)
      return [...before, ...after, currentCard, currentCard]
    })
    setI(lastCard ? 0 : i)
  }

  // Auto-save when reaching the result page to prevent data loss if user closes window
  const hasSavedResult = useRef(false)
  useEffect(() => {
    if (phase === 'result' && !hasSavedResult.current) {
      hasSavedResult.current = true

      setSaving(true)
      saveResultPromise.current = submitGameResult({
        packId: currentCard?.pack_id || cards[0]?.pack_id || '',
        assignmentId: assignmentId || '',
        correct,
        wrong,
        streakMax: maxStreak,
        status: 'completed',
        errorLog,
      })
        .catch((error: unknown) => {
          console.error('Erro ao salvar resultado automaticamente:', error)
          const message = error instanceof Error ? error.message : 'Erro desconhecido'
          alert(`Aviso: falha na sincronia automática: ${message}`)
        })
        .finally(() => {
          setSaving(false)
        })
    }
  }, [phase, accuracy, currentCard?.pack_id, cards, assignmentId, correct, wrong, maxStreak, errorLog])

  async function handleFinish() {
    if (saveResultPromise.current) {
      await saveResultPromise.current
    }
    router.push('/home')
  }

  function handleExit() {
    setShowExitModal(true)
  }

  async function confirmExit() {
    setShowExitModal(false)
    setSaving(true)
    try {
      await submitGameResult({
        packId: currentCard?.pack_id || cards[0]?.pack_id || '',
        assignmentId: assignmentId || '',
        correct,
        wrong,
        streakMax: maxStreak,
        status: 'incomplete',
        errorLog,
      })
    } catch (error) {
      console.error('Erro ao salvar resultado na saída:', error)
    } finally {
      setSaving(false)
    }
    resetGame()
    router.push('/home')
  }

  if (phase === 'intro') {
    return (
      <div className="flex min-h-[78vh] items-center justify-center px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="surface-hero w-full max-w-5xl overflow-hidden p-6 sm:p-8 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="section-kicker">Training mode</div>
              <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
                {packName}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
                {modeConfig.note} Prepare alguns minutos de foco e entre na sessão com ritmo.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                    Cards
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{cards.length}</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                    Modo
                  </p>
                  <p className="mt-3 text-xl font-semibold text-[var(--color-text)]">{modeConfig.label}</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                    Ritmo
                  </p>
                  <p className="mt-3 text-xl font-semibold text-[var(--color-text)]">{estimatedMinutes} min</p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setStarting(true)
                  try {
                    startGame()
                    if (hasTimer) {
                      const result = await startAssignmentTimer(assignmentId)
                      setTimerState({
                        timeLimitMinutes: result.timeLimitMinutes,
                        startedAt: result.startedAt,
                        deadlineAt: result.deadlineAt,
                      })
                      setNow(Date.now())
                    }
                  } catch (error) {
                    console.error('Erro ao iniciar cronômetro:', error)
                  } finally {
                    setStarting(false)
                  }
                }}
                disabled={starting}
                data-testid="game-start-button"
                className="btn-primary touch-manipulation mt-8 min-w-[220px] py-4"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Carregando
                  </>
                ) : (
                  <>
                    Começar treinamento
                    <ArrowRight className="h-5 w-5" strokeWidth={2.1} />
                  </>
                )}
              </button>
            </div>

            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="icon-glow flex h-14 w-14 items-center justify-center rounded-[22px] text-[var(--color-primary)]">
                  <ModeIcon className="h-7 w-7" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                    {modeConfig.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    Sessão pronta para manter foco e repetição.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] bg-[linear-gradient(135deg,rgba(43,122,11,0.1),rgba(29,78,216,0.1),rgba(255,255,255,0.82))] p-5">
                <svg
                  aria-hidden="true"
                  className="h-auto w-full"
                  viewBox="0 0 360 220"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="24" y="26" width="312" height="168" rx="34" fill="rgba(255,255,255,0.72)" />
                  <path d="M63 98C98 71 131 58 161 58C200 58 232 73 267 102" stroke="#2B7A0B" strokeWidth="10" strokeLinecap="round" />
                  <path d="M76 137C112 116 148 105 182 105C216 105 245 114 277 132" stroke="#1f5f08" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="76" cy="137" r="12" fill="#112033" />
                  <circle cx="268" cy="102" r="14" fill="#2B7A0B" fillOpacity="0.16" />
                  <circle cx="220" cy="160" r="18" fill="#1f5f08" fillOpacity="0.12" />
                </svg>
              </div>

              <div className="mt-5 space-y-3">
                <div className="surface-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                    Estratégia
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    Responda com ritmo. Quando errar, o card reaparece e reforça o ponto fraco.
                  </p>
                </div>
                {hasTimer && timerStarted && (
                  <div className={`surface-muted flex items-center gap-2 p-4 text-sm font-semibold ${
                    timerExpired ? 'text-red-700' : 'text-[var(--color-primary)]'
                  }`}>
                    <Clock3 className="h-4 w-4" strokeWidth={2} />
                    {timerExpired ? 'Tempo encerrado' : `Cronômetro ativo: ${formatRemaining(remainingMs || 0)}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <div className="flex min-h-[78vh] items-center justify-center px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="premium-card w-full max-w-3xl p-6 sm:p-8 lg:p-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <div className="section-kicker">Session complete</div>
              <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
                {accuracy >= 80
                  ? 'Resultado forte e bem encaixado.'
                  : accuracy >= 60
                    ? 'Boa sessão. Lição concluída com sucesso!'
                    : 'Lição Incompleta. Faltou um pouco para concluir.'}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[var(--color-text-muted)]">
                {accuracy >= 80
                  ? 'Você manteve um bom nível de precisão e respondeu com consistência.'
                  : accuracy >= 60
                    ? 'A base está boa. A tarefa foi finalizada, mas mais rodadas lapidam a mente.'
                    : 'A taxa de acerto ficou abaixo de 60%. Essa tarefa continuará pendente no seu painel para você tentar de novo.'}
              </p>
            </div>

            <div
              className={`flex h-18 w-18 items-center justify-center rounded-[28px] ${
                accuracy >= 80
                  ? 'bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)]'
                  : accuracy >= 60
                    ? 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]'
                    : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
              }`}
            >
              {accuracy >= 80 ? (
                <Trophy className="h-9 w-9" strokeWidth={1.8} />
              ) : accuracy >= 60 ? (
                <TrendingUp className="h-9 w-9" strokeWidth={1.8} />
              ) : (
                <BookOpen className="h-9 w-9" strokeWidth={1.8} />
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <div className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                Acertos
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--color-primary)]">{correct}</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                Erros
              </p>
              <p className="mt-3 text-3xl font-semibold text-red-600">{wrong}</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                Precisão
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{accuracy}%</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                Melhor streak
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{maxStreak}</p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            disabled={saving}
            data-testid="game-finish-button"
            className="btn-primary touch-manipulation mt-8 w-full py-4 sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Salvando
              </>
            ) : (
              'Voltar ao inicio'
            )}
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      {hasTimer && timerStarted && (
        <div className="mx-auto mb-4 flex w-full max-w-[1100px] justify-end">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
            timerExpired
              ? 'border border-red-200 bg-red-50 text-red-700'
              : 'border border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)]'
          }`}>
            <Clock3 className="h-4 w-4" strokeWidth={2} />
            {timerExpired ? 'Tempo encerrado' : formatRemaining(remainingMs || 0)}
          </div>
        </div>
      )}
      <div className="card mx-auto w-full max-w-[1100px] p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExit}
                className="touch-manipulation flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/72 text-[var(--color-text-muted)] transition-colors hover:bg-white hover:text-[var(--color-text)]"
                title="Sair da lição"
              >
                <X className="h-5 w-5" strokeWidth={2.1} />
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                  {modeConfig.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{packName}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
                Precisão {accuracy}%
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(43,122,11,0.18)] bg-[rgba(43,122,11,0.08)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">
                <Flame className="h-4 w-4" strokeWidth={2.2} />
                {currentStreak}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--color-text-muted)]">
              Card {Math.min(i + 1, q.length)} de {q.length}
            </div>
            <div className="w-full sm:max-w-[420px]">
              <div className="h-3 overflow-hidden rounded-full bg-[rgba(17,32,51,0.08)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-secondary))] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mx-auto mt-8 w-full ${
          gameMode === 'matching' ? 'max-w-[1100px]' : 'max-w-[860px]'
        }`}
      >
        {currentCard && gameMode === 'multiple_choice' && (
          <MultipleChoice
            key={`${currentCard.id}-${i}`}
            card={currentCard}
            allCards={cards}
            onCorrect={() => {
              setTimeout(handleCorrect, 800)
            }}
            onWrong={() => {
              setTimeout(handleWrong, 1200)
            }}
          />
        )}

        {currentCard && gameMode === 'flashcard' && (
          <Flashcard
            key={`${currentCard.id}-${i}`}
            card={currentCard}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}

        {currentCard && gameMode === 'typing' && (
          <TypingMode
            key={`${currentCard.id}-${i}`}
            card={currentCard}
            onCorrect={() => {
              setTimeout(handleCorrect, 1000)
            }}
            onWrong={() => {
              setTimeout(handleWrong, 1500)
            }}
          />
        )}

        {gameMode === 'matching' && cards.length > 0 && (
          <MatchingGame
            key={`matching-${assignmentId}`}
            cards={cards}
            onCorrect={answerCorrect}
            onWrong={answerWrong}
            onFinish={finishGame}
          />
        )}
      </div>

      {/* Modal de confirmação de saída */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            {/* Backdrop */}
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[rgba(17,32,51,0.48)] backdrop-blur-sm"
              aria-label="Fechar"
              onClick={() => setShowExitModal(false)}
            />

            {/* Card do modal */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_40px_80px_-30px_rgba(17,32,51,0.45)]"
            >
            {/* Ícone de aviso */}
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[rgba(43,122,11,0.10)] text-[var(--color-primary)]">
                <AlertTriangle className="h-7 w-7" strokeWidth={1.8} />
              </div>

              <h2 className="mt-5 text-2xl font-semibold text-[var(--color-text)]">
                Sair da lição?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Seu progresso de acertos e erros até aqui será salvo, mas a lição ficará marcada como{' '}
                <span className="font-semibold text-[var(--color-primary)]">incompleta</span> — e você precisará retomá-la depois.
              </p>

              {/* Resumo do progresso atual */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[18px] bg-[var(--color-surface-container)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">Acertos</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--color-primary)]">{correct}</p>
                </div>
                <div className="rounded-[18px] bg-[var(--color-surface-container)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">Erros</p>
                  <p className="mt-1 text-2xl font-semibold text-red-500">{wrong}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmExit}
                  disabled={saving}
                  className="btn-ghost w-full border-[rgba(43,122,11,0.16)] bg-[rgba(43,122,11,0.08)] text-[var(--color-primary)] hover:bg-[rgba(43,122,11,0.12)] sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando
                    </>
                  ) : (
                    'Sair e salvar progresso'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="btn-primary w-full sm:w-auto"
                >
                  Continuar lição
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
