'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Clock3,
  Flame,
  Keyboard,
  Layers,
  Loader2,
  Mic,
  Puzzle,
  RotateCcw,
  Target,
  Trophy,
  TrendingUp,
  X,
  Headphones,
} from 'lucide-react'
import { startAssignmentTimer, submitGameResult } from '@/app/actions'
import { ANALYTICS_EVENT, trackEvent } from '@/lib/analytics'
import MultipleChoice from '@/features/game/components/MultipleChoice'
import Flashcard from '@/features/game/components/Flashcard'
import MatchingGame from '@/features/game/components/MatchingGame'
import TypingMode from '@/features/game/components/TypingMode'
import ListeningMode from '@/features/game/components/ListeningMode'
import SpeakingMode from '@/features/game/components/SpeakingMode'
import ReadingComprehension from '@/features/game/components/ReadingComprehension'
import SentenceBuildMode from '@/features/game/components/SentenceBuildMode'
import {
  getPackPassageText,
  isGuidedWritingPack,
  isReadingComprehensionPack,
} from '@/features/game/lib/packPedagogy'
import ModalPortal from '@/components/ui/ModalPortal'
import SectionBadge from '@/components/ui/SectionBadge'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { feedback } from '@/lib/feedback'
import { notify } from '@/lib/toast'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/store/uiStore'
import { landingCtaCardShadow, landingRadius, landingRadiusLg } from '@/lib/landingStyles'
import {
  homeCardClass,
  homeCardButton,
  homeIconBoxBase,
  homePrimaryButton,
  homeSecondaryButton,
  homeShellBelowContentClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'

/** Hero-weight panel — intro/result screens */
const gamePanelClass = `${homeCardClass} ${landingCtaCardShadow}`
/** Flat stat tile used inside intro/result stat grids */
const gameStatTileClass = `${landingRadius} border border-brand-dark bg-bg-card px-4 py-3`
const gameStatLabelClass = 'font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary'

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
  listening: {
    label: 'Escuta',
    icon: Headphones,
    note: 'Treino auditivo: ouça e digite a tradução.',
  },
  speaking: {
    label: 'Fala',
    icon: Mic,
    note: 'Treino de pronúncia: ouça e repita a frase.',
  },
}

/** This page renders a breadcrumb above the shell, so it uses the no-top-bleed variant. */
function GameShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${homeShellBelowContentClass} min-h-[calc(100svh-5rem)]`}>
      <div className="home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(28,25,21,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(28,25,21,0.10)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative z-10">{children}</div>
    </div>
  )
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
    packDescription,
    packCategory,
    assignmentId,
    activeQueue,
    activeStep,
    correct,
    wrong,
    errorLog,
    latencyLog,
    currentStreak,
    maxStreak,
    startGame,
    answerCorrect,
    answerWrong,
    nextStep,
    finishGame,
    resetGame,
  } = useGameStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [timerState, setTimerState] = useState(timerConfig)
  const [now, setNow] = useState(() => Date.now())
  const [errorReviewQueue, setErrorReviewQueue] = useState(cards)
  const [errorReviewInitialCount, setErrorReviewInitialCount] = useState(0)
  const [errorReviewRetries, setErrorReviewRetries] = useState(0)
  const [adaptiveMode, setAdaptiveMode] = useState<'flashcard' | 'multiple_choice' | null>(null)
  const [adaptiveQueue, setAdaptiveQueue] = useState(cards)
  const [adaptiveInitialCount, setAdaptiveInitialCount] = useState(0)
  const [adaptiveRetries, setAdaptiveRetries] = useState(0)
  const saveResultPromise = useRef<Promise<void> | null>(null)
  const prefersReducedMotion = useReducedMotion()

  const currentCard = activeQueue[activeStep]
  const totalAnswered = correct + wrong
  const accuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0
  const progress = activeQueue.length > 0 ? ((activeStep + 1) / activeQueue.length) * 100 : 0
  const modeConfig = gameModeConfig[gameMode] || gameModeConfig.multiple_choice
  const ModeIcon = modeConfig.icon
  const useReadingMode =
    gameMode === 'multiple_choice' &&
    isReadingComprehensionPack(packCategory, packDescription)
  const useGuidedWritingMode =
    gameMode === 'typing' && isGuidedWritingPack(packCategory)
  const passageText = getPackPassageText(packDescription)
  const estimatedMinutes =
    gameMode === 'matching' ? Math.max(4, Math.ceil(cards.length * 0.5)) : Math.max(3, Math.ceil(cards.length * 0.35))
  const hasTimer = Boolean(timerState.timeLimitMinutes)
  const timerStarted = Boolean(timerState.startedAt)
  const deadlineMs = timerState.deadlineAt ? new Date(timerState.deadlineAt).getTime() : null
  const remainingMs = deadlineMs ? Math.max(deadlineMs - now, 0) : null
  const timerExpired = deadlineMs ? deadlineMs <= now : false
  const cardTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.26, ease: [0.16, 1, 0.3, 1] as const }
  const pageTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  const cardMotionInitial = prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.985 }
  const cardMotionExit = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.985 }
  const errorReviewCards = useMemo(() => {
    const cardMap = new Map(cards.map((card) => [card.id, card]))
    const seen = new Set<string>()

    return errorLog.flatMap((entry) => {
      if (!entry.cardId || seen.has(entry.cardId)) return []

      const card = cardMap.get(entry.cardId)
      if (!card) return []

      seen.add(entry.cardId)
      return [card]
    })
  }, [cards, errorLog])
  const currentErrorReviewCard = errorReviewQueue[0] || null
  const isErrorReviewActive = errorReviewInitialCount > 0
  const isErrorReviewComplete = isErrorReviewActive && errorReviewQueue.length === 0
  const currentAdaptiveCard = adaptiveQueue[0] || null
  const isAdaptiveActive = adaptiveMode !== null
  const isAdaptiveComplete = isAdaptiveActive && adaptiveQueue.length === 0
  const shouldSuggestAdaptive =
    gameMode === 'typing' && errorReviewCards.length > 0 && (accuracy < 70 || wrong >= 2)

  const setZenMode = useUIStore((state) => state.setZenMode)

  useEffect(() => {
    setZenMode(true)
    return () => setZenMode(false)
  }, [setZenMode])

  useEffect(() => {
    setTimeout(() => setTimerState(timerConfig), 0)
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

  function handleCorrect(latencyMs?: number) {
    answerCorrect(currentCard?.id, latencyMs)
    nextStep()
  }

  function handleWrong(latencyMs?: number, mode: 'report' | 'move' | 'both' = 'both') {
    feedback.error()
    answerWrong(currentCard?.id, latencyMs, mode)
  }

  function startErrorReview() {
    if (errorReviewCards.length === 0) return

    setErrorReviewQueue(errorReviewCards)
    setErrorReviewInitialCount(errorReviewCards.length)
    setErrorReviewRetries(0)
  }

  function closeErrorReview() {
    setErrorReviewInitialCount(0)
    setErrorReviewRetries(0)
  }

  function handleErrorReviewCorrect() {
    setErrorReviewQueue((queue) => queue.slice(1))
  }

  function handleErrorReviewWrong() {
    setErrorReviewRetries((value) => value + 1)
    setErrorReviewQueue((queue) => {
      if (queue.length <= 1) return queue
      return [...queue.slice(1), queue[0]]
    })
  }

  function startAdaptivePractice(mode: 'flashcard' | 'multiple_choice') {
    if (errorReviewCards.length === 0) return

    setAdaptiveMode(mode)
    setAdaptiveQueue(errorReviewCards)
    setAdaptiveInitialCount(errorReviewCards.length)
    setAdaptiveRetries(0)
  }

  function closeAdaptivePractice() {
    setAdaptiveMode(null)
    setAdaptiveInitialCount(0)
    setAdaptiveRetries(0)
  }

  function handleAdaptiveCorrect() {
    setAdaptiveQueue((queue) => queue.slice(1))
  }

  function handleAdaptiveWrong() {
    setAdaptiveRetries((value) => value + 1)
    setAdaptiveQueue((queue) => {
      if (queue.length <= 1) return queue
      return [...queue.slice(1), queue[0]]
    })
  }

  // Auto-save when reaching the result page to prevent data loss if user closes window
  const hasSavedResult = useRef(false)
  useEffect(() => {
    if (phase === 'result' && !hasSavedResult.current) {
      hasSavedResult.current = true

      setSaving(true)
      trackEvent(ANALYTICS_EVENT.SESSION_COMPLETED, {
        mode: gameMode,
        cards: cards.length,
        accuracy,
        maxStreak,
      })
      saveResultPromise.current = submitGameResult({
        packId: currentCard?.pack_id || cards[0]?.pack_id || '',
        assignmentId: assignmentId || '',
        correct,
        wrong,
        streakMax: maxStreak,
        status: 'completed',
        errorLog,
        latencyLog,
      })
        .catch((error: unknown) => {
          console.error('Erro ao salvar resultado automaticamente:', error)
          notify.error('Erro ao carregar dados')
        })
        .finally(() => {
          setSaving(false)
        })
    }
  }, [phase, accuracy, currentCard?.pack_id, cards, assignmentId, correct, wrong, maxStreak, errorLog, latencyLog, gameMode])

  async function handleFinish() {
    try {
      if (saveResultPromise.current) {
        await saveResultPromise.current
      }
    } catch (error) {
      console.error('Erro ao aguardar finalização do salvamento:', error)
      // Continuamos mesmo com erro no promise para não prender o usuário na tela de resultado
    }
    resetGame()
    router.push('/home?sessionComplete=true', { transitionTypes: navBackTransitionTypes })
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
        latencyLog,
      })
    } catch (error) {
      console.error('Erro ao salvar resultado na saída:', error)
    } finally {
      setSaving(false)
    }
    // We intentionally DO NOT call resetGame() here so that local progress is preserved
    // and the user can resume exactly where they left off.
    router.push('/home', { transitionTypes: navBackTransitionTypes })
  }

  if (phase === 'intro') {
    return (
      <GameShell>
      <div className="flex min-h-[78vh] items-center justify-center py-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={pageTransition}
          className={`${gamePanelClass} w-full max-w-5xl overflow-hidden p-6 sm:p-8 lg:p-10`}
        >
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <SectionBadge label="Modo de treinamento" />
              <h1 className="mt-5 font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
                {packName}
              </h1>
              <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-brand-secondary sm:text-lg">
                {modeConfig.note} Prepare alguns minutos de foco e entre na sessão com ritmo.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className={gameStatTileClass}>
                  <p className={gameStatLabelClass}>Cards</p>
                  <p className="mt-3 font-heading text-3xl font-bold text-brand-dark">{cards.length}</p>
                </div>
                <div className={gameStatTileClass}>
                  <p className={gameStatLabelClass}>Modo</p>
                  <p className="mt-3 font-heading text-xl font-bold text-brand-dark">{modeConfig.label}</p>
                </div>
                <div className={gameStatTileClass}>
                  <p className={gameStatLabelClass}>Ritmo</p>
                  <p className="mt-3 font-heading text-xl font-bold text-brand-dark">{estimatedMinutes} min</p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setStarting(true)
                  try {
                    trackEvent(ANALYTICS_EVENT.SESSION_STARTED, { mode: gameMode, cards: cards.length })
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
                className={`${homePrimaryButton} touch-manipulation mt-6 w-full min-w-[220px] py-4 sm:w-auto lg:mt-8`}
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

              {/* Phone-only echo of the side column, which is hidden below `lg`. It sits after
                  the CTA so the button stays above the fold, but now a few pixels away instead
                  of behind ~800px of decorative panel. */}
              <div className={`${landingRadius} mt-4 border border-brand-dark bg-bg-primary p-4 lg:hidden`}>
                <p className={gameStatLabelClass}>Estratégia</p>
                <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                  Responda com ritmo. Quando errar, o card reaparece e reforça o ponto fraco.
                </p>
              </div>

              {hasTimer && timerStarted && (
                <div className={`${landingRadius} mt-3 flex items-center gap-2 border p-4 font-body text-sm font-semibold lg:hidden ${
                  timerExpired ? 'border-red-500/40 bg-red-500/10 text-[var(--color-error)]' : 'border-brand-dark bg-bg-primary text-brand-dark'
                }`}>
                  <Clock3 className="h-4 w-4" strokeWidth={2} />
                  {timerExpired ? 'Tempo encerrado' : `Cronômetro ativo: ${formatRemaining(remainingMs || 0)}`}
                </div>
              )}
            </div>

            {/* Desktop-only: on a phone this column is just filler stacked after the CTA, and
                its mode label repeated the "Modo" stat tile a few pixels above it. */}
            <div className={`${homeCardClass} hidden p-5 sm:p-6 lg:block`}>
              <div className="flex items-center gap-3">
                <div className={`${homeIconBoxBase} h-14 w-14 p-3`}>
                  <ModeIcon className="h-7 w-7" strokeWidth={1.8} />
                </div>
                <p className="font-body text-sm leading-relaxed text-brand-secondary">
                  Sessão pronta para manter foco e repetição.
                </p>
              </div>

              <div className={`mt-6 ${landingRadius} border border-brand-dark bg-bg-primary p-5`}>
                <svg
                  aria-hidden="true"
                  className="h-auto w-full"
                  viewBox="0 0 360 220"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="24" y="26" width="312" height="168" rx="34" fill="#F4F1EA" fillOpacity="0.9" />
                  <path d="M63 98C98 71 131 58 161 58C200 58 232 73 267 102" stroke="#1C1915" strokeWidth="10" strokeLinecap="round" />
                  <path d="M76 137C112 116 148 105 182 105C216 105 245 114 277 132" stroke="#D5E06B" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="76" cy="137" r="12" fill="#D5E06B" fillOpacity="0.9" />
                  <circle cx="268" cy="102" r="14" fill="#1C1915" fillOpacity="0.16" />
                  <circle cx="220" cy="160" r="18" fill="#D5E06B" fillOpacity="0.24" />
                </svg>
              </div>

              <div className="mt-5 space-y-3">
                <div className={`${landingRadius} border border-brand-dark bg-bg-primary p-4`}>
                  <p className={gameStatLabelClass}>Estratégia</p>
                  <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                    Responda com ritmo. Quando errar, o card reaparece e reforça o ponto fraco.
                  </p>
                </div>
                {hasTimer && timerStarted && (
                  <div className={`${landingRadius} flex items-center gap-2 border p-4 font-body text-sm font-semibold ${
                    timerExpired ? 'border-red-500/40 bg-red-500/10 text-[var(--color-error)]' : 'border-brand-dark bg-bg-primary text-brand-dark'
                  }`}>
                    <Clock3 className="h-4 w-4" strokeWidth={2} />
                    {timerExpired ? 'Tempo encerrado' : `Cronômetro ativo: ${formatRemaining(remainingMs || 0)}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </m.div>
      </div>
      </GameShell>
    )
  }

  if (phase === 'result' && isAdaptiveActive) {
    return (
      <GameShell>
      <div className="flex min-h-[78vh] items-center justify-center py-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={pageTransition}
          className="w-full max-w-4xl"
        >
          {!isAdaptiveComplete && currentAdaptiveCard && adaptiveMode ? (
            <div className="space-y-6">
              <div className={`${homeCardClass} p-5 sm:p-6`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <SectionBadge label="Reforço adaptativo" />
                    <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                      Reforço antes de voltar para a digitação.
                    </h2>
                    <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary">
                      Quando o typing pesa demais, uma passada curta em {adaptiveMode === 'flashcard' ? 'flashcards' : 'múltipla escolha'} ajuda a consolidar o significado sem travar o ritmo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAdaptivePractice}
                    className={homeSecondaryButton}
                  >
                    Voltar ao resumo
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className={gameStatTileClass}>
                    <p className={gameStatLabelClass}>Modo</p>
                    <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">
                      {adaptiveMode === 'flashcard' ? 'Flashcard' : 'Múltipla escolha'}
                    </p>
                  </div>
                  <div className={gameStatTileClass}>
                    <p className={gameStatLabelClass}>Restantes</p>
                    <p className="mt-3 font-heading text-3xl font-bold text-brand-dark">
                      {adaptiveQueue.length}
                    </p>
                  </div>
                  <div className={gameStatTileClass}>
                    <p className={gameStatLabelClass}>Repetições</p>
                    <p className="mt-3 font-heading text-3xl font-bold text-brand-dark">
                      {adaptiveRetries}
                    </p>
                  </div>
                </div>
              </div>

              {adaptiveMode === 'flashcard' ? (
                <Flashcard
                  key={`adaptive-flashcard-${currentAdaptiveCard.id}-${adaptiveQueue.length}-${adaptiveRetries}`}
                  card={currentAdaptiveCard}
                  onCorrect={handleAdaptiveCorrect}
                  onWrong={handleAdaptiveWrong}
                />
              ) : (
                <MultipleChoice
                  key={`adaptive-mc-${currentAdaptiveCard.id}-${adaptiveQueue.length}-${adaptiveRetries}`}
                  card={currentAdaptiveCard}
                  allCards={cards}
                  onCorrect={() => {
                    setTimeout(handleAdaptiveCorrect, 800)
                  }}
                  onWrong={() => {
                    setTimeout(handleAdaptiveWrong, 1200)
                  }}
                />
              )}
            </div>
          ) : (
            <div className={`${gamePanelClass} w-full p-6 sm:p-8 lg:p-10`}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xl">
                  <SectionBadge label="Reforço adaptativo concluído" />
                  <h2 className="mt-5 font-heading text-2xl font-bold leading-[1.1] text-brand-dark sm:text-3xl">
                    O reforço adaptativo terminou.
                  </h2>
                  <p className="mt-4 font-body text-base leading-relaxed text-brand-secondary">
                    Você fez uma rodada curta de {adaptiveMode === 'flashcard' ? 'flashcards' : 'múltipla escolha'} com {adaptiveInitialCount} {adaptiveInitialCount === 1 ? 'card' : 'cards'} mais sensíveis desta sessão.
                  </p>
                </div>

                <div className={`${homeIconBoxBase} h-16 w-16 p-3`}>
                  <Layers className="h-8 w-8" strokeWidth={1.8} />
                </div>
              </div>

              <button
                type="button"
                onClick={closeAdaptivePractice}
                className={`${homePrimaryButton} mt-8 w-full py-4 sm:w-auto`}
              >
                Voltar ao resultado
              </button>
            </div>
          )}
        </m.div>
      </div>
      </GameShell>
    )
  }

  if (phase === 'result' && isErrorReviewActive) {
    return (
      <GameShell>
      <div className="flex min-h-[78vh] items-center justify-center py-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={pageTransition}
          className="w-full max-w-4xl"
        >
          {!isErrorReviewComplete && currentErrorReviewCard ? (
            <div className="space-y-6">
              <div className={`${homeCardClass} p-5 sm:p-6`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <SectionBadge label="Revisão de erros" />
                    <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                      Mini-rodada só com os cards que saíram do eixo.
                    </h2>
                    <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary">
                      Passe pelos erros recentes e empurre de volta para o fim da fila aquilo que ainda não ficou firme.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeErrorReview}
                    className={homeSecondaryButton}
                  >
                    Voltar ao resumo
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className={gameStatTileClass}>
                    <p className={gameStatLabelClass}>Restantes</p>
                    <p className="mt-3 font-heading text-3xl font-bold text-brand-dark">
                      {errorReviewQueue.length}
                    </p>
                  </div>
                  <div className={gameStatTileClass}>
                    <p className={gameStatLabelClass}>Corrigidos</p>
                    <p className="mt-3 font-heading text-3xl font-bold text-brand-dark">
                      {errorReviewInitialCount - errorReviewQueue.length}
                    </p>
                  </div>
                  <div className={gameStatTileClass}>
                    <p className={gameStatLabelClass}>Repetições</p>
                    <p className="mt-3 font-heading text-3xl font-bold text-brand-dark">
                      {errorReviewRetries}
                    </p>
                  </div>
                </div>
              </div>

              <Flashcard
                key={`error-review-${currentErrorReviewCard.id}-${errorReviewQueue.length}-${errorReviewRetries}`}
                card={currentErrorReviewCard}
                onCorrect={handleErrorReviewCorrect}
                onWrong={handleErrorReviewWrong}
              />
            </div>
          ) : (
            <div className={`${gamePanelClass} w-full p-6 sm:p-8 lg:p-10`}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xl">
                  <SectionBadge label="Revisão de erros concluída" />
                  <h2 className="mt-5 font-heading text-2xl font-bold leading-[1.1] text-brand-dark sm:text-3xl">
                    Os pontos fracos desta sessão já passaram por uma rodada extra.
                  </h2>
                  <p className="mt-4 font-body text-base leading-relaxed text-brand-secondary">
                    Você revisou {errorReviewInitialCount} {errorReviewInitialCount === 1 ? 'card' : 'cards'} com erro e precisou de {errorReviewRetries} {errorReviewRetries === 1 ? 'repetição' : 'repetições'} adicionais.
                  </p>
                </div>

                <div className={`${homeIconBoxBase} h-16 w-16 p-3`}>
                  <RotateCcw className="h-8 w-8" strokeWidth={1.8} />
                </div>
              </div>

              <button
                type="button"
                onClick={closeErrorReview}
                className={`${homePrimaryButton} mt-8 w-full py-4 sm:w-auto`}
              >
                Voltar ao resultado
              </button>
            </div>
          )}
        </m.div>
      </div>
      </GameShell>
    )
  }

  if (phase === 'result') {
    return (
      <GameShell>
      <div className="flex min-h-[78vh] items-center justify-center py-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={pageTransition}
          className={`${gamePanelClass} w-full max-w-3xl p-6 sm:p-8 lg:p-10`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <SectionBadge label="Sessão concluída" />
              <h1 className="mt-5 font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
                {accuracy >= 80
                  ? 'Resultado forte e bem encaixado.'
                  : accuracy >= 60
                    ? 'Boa sessão. Lição concluída com sucesso!'
                    : 'Lição Incompleta. Faltou um pouco para concluir.'}
              </h1>
              <p className="mt-4 font-body text-base leading-relaxed text-brand-secondary">
                {accuracy >= 80
                  ? 'Você manteve um bom nível de precisão e respondeu com consistência.'
                  : accuracy >= 60
                    ? 'A base está boa. A tarefa foi finalizada, mas mais rodadas lapidam a mente.'
                    : 'A taxa de acerto ficou abaixo de 60%. Essa tarefa continuará pendente no seu painel para você tentar de novo.'}
              </p>
            </div>

            <div className={`${homeIconBoxBase} h-16 w-16 p-3 ${accuracy >= 80 ? 'bg-brand-accent' : ''}`}>
              {accuracy >= 80 ? (
                <Trophy className="h-8 w-8" strokeWidth={1.8} />
              ) : accuracy >= 60 ? (
                <TrendingUp className="h-8 w-8" strokeWidth={1.8} />
              ) : (
                <BookOpen className="h-8 w-8" strokeWidth={1.8} />
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-4">
              <div className={gameStatTileClass}>
                <p className={gameStatLabelClass}>Acertos</p>
                <p className="mt-3 font-heading text-3xl font-bold text-brand-dark">{correct}</p>
              </div>
            <div className={gameStatTileClass}>
              <p className={gameStatLabelClass}>Erros</p>
              <p className="mt-3 font-heading text-3xl font-bold text-[var(--color-error)]">{wrong}</p>
            </div>
            <div className={gameStatTileClass}>
              <p className={gameStatLabelClass}>Precisão</p>
              <p className="mt-3 font-heading text-3xl font-bold text-brand-dark">{accuracy}%</p>
            </div>
            <div className={gameStatTileClass}>
              <p className={gameStatLabelClass}>Melhor sequência</p>
              <p className="mt-3 font-heading text-3xl font-bold text-brand-dark">{maxStreak}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {shouldSuggestAdaptive && (
              <>
                <button
                  type="button"
                  onClick={() => startAdaptivePractice('flashcard')}
                  className={`${homeSecondaryButton} touch-manipulation w-full py-4 sm:w-auto`}
                >
                  <Layers className="h-5 w-5" strokeWidth={2} />
                  Reforçar com flashcards
                </button>
                <button
                  type="button"
                  onClick={() => startAdaptivePractice('multiple_choice')}
                  className={`${homeSecondaryButton} touch-manipulation w-full py-4 sm:w-auto`}
                >
                  <Target className="h-5 w-5" strokeWidth={2} />
                  Reforçar com múltipla escolha
                </button>
              </>
            )}
            {errorReviewCards.length > 0 && (
              <button
                type="button"
                onClick={startErrorReview}
                className={`${homeSecondaryButton} touch-manipulation w-full py-4 sm:w-auto`}
              >
                <RotateCcw className="h-5 w-5" strokeWidth={2} />
                Revisar erros ({errorReviewCards.length})
              </button>
            )}
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              data-testid="game-finish-button"
              className={`${homePrimaryButton} touch-manipulation w-full py-4 sm:w-auto`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Salvando
                </>
              ) : (
                'Voltar ao início'
              )}
            </button>
          </div>
        </m.div>
      </div>
      </GameShell>
    )
  }

  return (
    <GameShell>
    <div className="pb-4">
      {hasTimer && timerStarted && (
        <div className="mx-auto mb-4 flex w-full max-w-[1100px] justify-end">
          <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-heading text-sm font-bold ${
            timerExpired
              ? 'border-red-500/40 bg-red-500/10 text-[var(--color-error)]'
              : 'border-brand-dark bg-brand-accent text-brand-dark'
          }`}>
            <Clock3 className="h-4 w-4" strokeWidth={2} />
            {timerExpired ? 'Tempo encerrado' : formatRemaining(remainingMs || 0)}
          </div>
        </div>
      )}
      <div className={`${homeCardClass} mx-auto w-full max-w-[1100px] p-4 sm:p-5`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExit}
                className={`${landingRadius} touch-manipulation flex h-11 w-11 items-center justify-center border border-brand-dark bg-bg-card text-brand-dark shadow-[3px_3px_0_#1C1915] transition-[transform,box-shadow,background-color] duration-200 hover:bg-brand-accent hover:shadow-[4px_4px_0_#D5E06B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
                title="Sair da lição"
              >
                <X className="h-5 w-5" strokeWidth={2.1} />
              </button>

              <div>
                <p className={gameStatLabelClass}>{modeConfig.label}</p>
                <p className="mt-1 font-heading text-lg font-bold text-brand-dark">{packName}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className={homeSmallPillClass}>Precisão {accuracy}%</div>
              <div className={`${homeSmallPillClass} gap-1 bg-brand-accent`}>
                <Flame className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                {currentStreak}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-body text-sm text-brand-secondary">
              Card {Math.min(activeStep + 1, activeQueue.length)} de {activeQueue.length}
            </div>
            <div className="w-full sm:max-w-[420px]">
              <div className="h-2 overflow-hidden rounded-full bg-brand-border">
                <div
                  className="h-full rounded-full bg-brand-dark transition-all duration-500 ease-out"
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
        <AnimatePresence mode="wait" initial={false}>
          {currentCard && gameMode === 'multiple_choice' && useReadingMode && (
            <m.div
              key={`reading-${currentCard.id}-${activeStep}-${correct + wrong}`}
              initial={cardMotionInitial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={cardMotionExit}
              transition={cardTransition}
            >
              <ReadingComprehension
                card={currentCard}
                allCards={cards}
                passageText={passageText}
                onCorrect={() => {
                  setTimeout(handleCorrect, 800)
                }}
                onWrong={() => {
                  setTimeout(handleWrong, 1200)
                }}
              />
            </m.div>
          )}

          {currentCard && gameMode === 'multiple_choice' && !useReadingMode && (
            <m.div
              key={`multiple-choice-${currentCard.id}-${activeStep}-${correct + wrong}`}
              initial={cardMotionInitial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={cardMotionExit}
              transition={cardTransition}
            >
              <MultipleChoice
                card={currentCard}
                allCards={cards}
                onCorrect={() => {
                  setTimeout(handleCorrect, 800)
                }}
                onWrong={() => {
                  setTimeout(handleWrong, 1200)
                }}
              />
            </m.div>
          )}

          {currentCard && gameMode === 'flashcard' && (
            <m.div
              key={`flashcard-${currentCard.id}-${activeStep}-${correct + wrong}`}
              initial={cardMotionInitial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={cardMotionExit}
              transition={cardTransition}
            >
              <Flashcard
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </m.div>
          )}

          {currentCard && gameMode === 'typing' && useGuidedWritingMode && (
            <m.div
              key={`sentence-build-${currentCard.id}-${activeStep}-${correct + wrong}`}
              initial={cardMotionInitial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={cardMotionExit}
              transition={cardTransition}
            >
              <SentenceBuildMode
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </m.div>
          )}

          {currentCard && gameMode === 'typing' && !useGuidedWritingMode && (
            <m.div
              key={`typing-${currentCard.id}-${activeStep}-${correct + wrong}`}
              initial={cardMotionInitial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={cardMotionExit}
              transition={cardTransition}
            >
              <TypingMode
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </m.div>
          )}

          {currentCard && gameMode === 'listening' && (
            <m.div
              key={`listening-${currentCard.id}-${activeStep}-${correct + wrong}`}
              initial={cardMotionInitial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={cardMotionExit}
              transition={cardTransition}
            >
              <ListeningMode
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </m.div>
          )}

          {currentCard && gameMode === 'speaking' && (
            <m.div
              key={`speaking-${currentCard.id}-${activeStep}-${activeQueue.length}`}
              initial={cardMotionInitial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={cardMotionExit}
              transition={cardTransition}
            >
              <SpeakingMode
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </m.div>
          )}

          {gameMode === 'matching' && cards.length > 0 && (
            <m.div
              key={`matching-${assignmentId}`}
              initial={cardMotionInitial}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={cardMotionExit}
              transition={cardTransition}
            >
              <MatchingGame
                cards={cards}
                onCorrect={answerCorrect}
                onWrong={() => answerWrong(currentCard?.id)}
                onFinish={finishGame}
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de confirmação de saída */}
      <AnimatePresence>
        {showExitModal && (
          <ModalPortal
            onClose={() => setShowExitModal(false)}
            className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-y-auto overscroll-contain bg-brand-dark/30 px-4 backdrop-blur-sm"
          >
            <m.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`relative my-auto w-full max-w-md overflow-hidden ${landingRadiusLg} border border-brand-dark bg-bg-card p-8 ${landingCtaCardShadow}`}
            >
            {/* Ícone de aviso */}
              <div className={`${homeIconBoxBase} h-14 w-14 p-3`}>
                <AlertTriangle className="h-7 w-7" strokeWidth={1.8} />
              </div>

              <h2 className="mt-5 font-heading text-2xl font-bold text-brand-dark">
                Sair da lição?
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary">
                Seu progresso de acertos e erros até aqui será salvo, mas a lição ficará marcada como{' '}
                <span className="font-bold text-brand-dark">incompleta</span> — e você precisará retomá-la depois.
              </p>

              {/* Resumo do progresso atual */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className={gameStatTileClass}>
                  <p className={gameStatLabelClass}>Acertos</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-brand-dark">{correct}</p>
                </div>
                <div className={gameStatTileClass}>
                  <p className={gameStatLabelClass}>Erros</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-[var(--color-error)]">{wrong}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button
              type="button"
              onClick={confirmExit}
              disabled={saving}
              className={`${homeCardButton} w-full sm:w-auto`}
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
              className={`${homePrimaryButton} w-full sm:w-auto`}
              >
              Continuar lição
              </button>
              </div>
            </m.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
    </GameShell>
  )
}
