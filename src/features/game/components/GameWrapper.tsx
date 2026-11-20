'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import TransitionSlot from '@/components/motion/TransitionSlot'
import { useEntrance } from '@/components/motion/useEntrance'
import {
  ArrowRight,
  Clock3,
  Flame,
  Layers,
  Loader2,
  RotateCcw,
  Target,
  X,
} from 'lucide-react'
import { startAssignmentTimer, submitGameResult } from '@/app/actions'
import { markHomeNeedsResync } from '@/lib/homeNotices'
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
  SPEECH_FALLBACK_NOTICE,
  hasSpeechRecognitionSupport,
  resolvePlayableMode,
} from '@/features/game/lib/speechSupport'
import {
  getPackPassageText,
  isGuidedWritingPack,
  isReadingComprehensionPack,
} from '@/features/game/lib/packPedagogy'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/shadcn/dialog'
import SectionBadge from '@/components/ui/SectionBadge'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { feedback } from '@/lib/feedback'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/store/uiStore'
import {
  homePrimaryButton,
  homeSecondaryButton,
} from '@/lib/homeStyles'

import '@/features/curriculum/components/activity.css'

const gameStatTileClass = 'activity-stat'
const gameStatLabelClass = 'font-heading text-[11px] font-bold uppercase tracking-widest text-brand-secondary'

const gameModeConfig: Record<string, { label: string; note: string }> = {
  multiple_choice: {
    label: 'Múltipla escolha',
    note: 'Leitura rápida, contexto e decisão imediata.',
  },
  flashcard: {
    label: 'Flashcard',
    note: 'Memorização ativa com repetição curta e objetiva.',
  },
  typing: {
    label: 'Digitação',
    note: 'Leia o português e escreva a frase em inglês de memória.',
  },
  matching: {
    label: 'Combinação',
    note: 'Associação visual para ganhar velocidade de recall.',
  },
  listening: {
    label: 'Escuta',
    note: 'Treino auditivo: ouça a frase e escreva em inglês o que ouviu.',
  },
  speaking: {
    label: 'Fala',
    note: 'Treino de pronúncia: ouça e repita a frase.',
  },
}

function GameShell({ children }: { children: ReactNode }) {
  return <div className="assignment-activity">{children}</div>
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
    correctLog,
    latencyLog,
    typingDirection,
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
  const [saveError, setSaveError] = useState('')
  const [starting, setStarting] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [timerState, setTimerState] = useState(timerConfig)
  const [now, setNow] = useState(() => Date.now())
  const [errorReviewQueue, setErrorReviewQueue] = useState(cards)
  const [errorReviewInitialCount, setErrorReviewInitialCount] = useState(0)
  const [errorReviewRetries, setErrorReviewRetries] = useState(0)
  const [adaptiveMode, setAdaptiveMode] = useState<'flashcard' | 'multiple_choice' | null>(null)
  // Começa otimista e cai para escuta assim que o aparelho prova que não ouve: sem API na
  // montagem, ou microfone negado/ausente no meio da sessão (SpeakingMode avisa).
  const [speechAvailable, setSpeechAvailable] = useState(true)
  useEffect(() => {
    if (!hasSpeechRecognitionSupport()) setTimeout(() => setSpeechAvailable(false), 0)
  }, [])
  const [adaptiveQueue, setAdaptiveQueue] = useState(cards)
  const [adaptiveInitialCount, setAdaptiveInitialCount] = useState(0)
  const [adaptiveRetries, setAdaptiveRetries] = useState(0)
  const saveResultPromise = useRef<Promise<boolean> | null>(null)
  const enterPage = useEntrance(4, 0, 0.2)

  const currentCard = activeQueue[activeStep]
  const totalAnswered = correct + wrong
  const accuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0
  const progress = activeQueue.length > 0 ? ((activeStep + 1) / activeQueue.length) * 100 : 0
  // O modo que de fato roda. Só difere de `gameMode` quando a fala cai para escuta.
  const playedMode = resolvePlayableMode(gameMode, speechAvailable)
  const isSpeechFallback = playedMode !== gameMode
  const modeConfig = gameModeConfig[playedMode] || gameModeConfig.multiple_choice
  // A descrição da digitação depende do lado: no primeiro contato com o pack ela é compreensão.
  const modeNote =
    playedMode === 'typing' && typingDirection === 'en-to-pt'
      ? 'Veja a frase em inglês e escreva o que ela quer dizer.'
      : modeConfig.note
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

  // Keep the result in the persisted store until the server confirms it.
  const hasSavedResult = useRef(false)
  const saveInFlight = useRef(false)
  const persistResult = useCallback(async () => {
    if (saveInFlight.current) return saveResultPromise.current ?? false
    saveInFlight.current = true; setSaving(true); setSaveError('')
    const submissionId = useGameStore.getState().resultSubmissionId
    const promise = submitGameResult({
      ...(submissionId ? { clientSessionId: submissionId } : {}),
      packId: currentCard?.pack_id || cards[0]?.pack_id || '', assignmentId: assignmentId || '',
      correct, wrong, streakMax: maxStreak, status: 'completed', errorLog, correctCardIds: correctLog, latencyLog,
      playedMode: isSpeechFallback && playedMode === 'listening' ? 'listening' : undefined,
    }).then(() => { hasSavedResult.current = true; return true })
      .catch(() => { setSaveError('Resultado ainda não confirmado. Seu resultado continua nesta tela. Tente salvar novamente.'); return false })
      .finally(() => { saveInFlight.current = false; setSaving(false) })
    saveResultPromise.current = promise
    return promise
  }, [currentCard?.pack_id, cards, assignmentId, correct, wrong, maxStreak, errorLog, correctLog, latencyLog, isSpeechFallback, playedMode])
  const attemptedAutoSave = useRef(false)
  useEffect(() => {
    if (phase !== 'result' || attemptedAutoSave.current) return
    attemptedAutoSave.current = true
    trackEvent(ANALYTICS_EVENT.SESSION_COMPLETED, { mode: gameMode, cards: cards.length, accuracy, maxStreak })
    void persistResult()
  }, [phase, gameMode, cards.length, accuracy, maxStreak, persistResult])

  async function handleFinish() {
    const confirmed = hasSavedResult.current || await persistResult()
    if (!confirmed) return
    resetGame()
    markHomeNeedsResync()
    router.push('/home?sessionComplete=true#trilha', { transitionTypes: navBackTransitionTypes })
  }

  const exitButton = useRef<HTMLButtonElement>(null)
  const keepPlayingButton = useRef<HTMLButtonElement>(null)
  const resultHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (phase === 'result' && !isAdaptiveActive && !isErrorReviewActive) resultHeading.current?.focus()
  }, [phase, isAdaptiveActive, isErrorReviewActive])

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
        correctCardIds: correctLog,
        latencyLog,
        playedMode: isSpeechFallback && playedMode === 'listening' ? 'listening' : undefined,
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
        <section ref={enterPage} className="practice-intro" aria-labelledby="practice-intro-title">
          <p className="editorial-eyebrow">{modeConfig.label}</p>
          <h1 id="practice-intro-title">{packName}</h1>
          <p className="practice-intro-note">{modeNote}</p>
          <dl className="practice-intro-meta"><div><dt>Cards</dt><dd>{cards.length}</dd></div><div><dt>Duração estimada</dt><dd>{estimatedMinutes} min</dd></div></dl>
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
                className={`${homePrimaryButton} practice-intro-start`}
              >
                {starting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Carregando
                  </>
                ) : (
                  <>
                    Começar prática
                    <ArrowRight className="h-5 w-5" strokeWidth={1.5} />
                  </>
                )}
              </button>
          {hasTimer && timerStarted && <p className="practice-intro-timer" role="status"><Clock3 size={16} aria-hidden="true" />{timerExpired ? 'Tempo encerrado' : `Cronômetro ativo: ${formatRemaining(remainingMs || 0)}`}</p>}
        </section>
      </GameShell>
    )
  }

  if (phase === 'result' && isAdaptiveActive) {
    return (
      <GameShell>
      <div className="mx-auto w-full max-w-2xl">
        <div
          ref={enterPage}
          className="w-full max-w-4xl"
        >
          {!isAdaptiveComplete && currentAdaptiveCard && adaptiveMode ? (
            <div className="space-y-6">
              <section className="activity-review-heading">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <SectionBadge label="Reforço adaptativo" />
                    <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                      Reforço para voltar à digitação
                    </h2>
                    <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary">
                      Pratique em {adaptiveMode === 'flashcard' ? 'flashcards' : 'múltipla escolha'} antes de retomar a escrita.
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

                <div className="activity-stats activity-stats-three">
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
              </section>

              {adaptiveMode === 'flashcard' ? (
                <Flashcard
                  key={`adaptive-flashcard-${currentAdaptiveCard.id}-${adaptiveQueue.length}-${adaptiveRetries}`}
                  card={currentAdaptiveCard}
                  onCorrect={handleAdaptiveCorrect}
                  onWrong={handleAdaptiveWrong}
                />
              ) : (
                <MultipleChoice
                  variant="assignment"
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
            <div className="w-full">
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
        </div>
      </div>
      </GameShell>
    )
  }

  if (phase === 'result' && isErrorReviewActive) {
    return (
      <GameShell>
      <div className="mx-auto w-full max-w-2xl">
        <div
          ref={enterPage}
          className="w-full max-w-4xl"
        >
          {!isErrorReviewComplete && currentErrorReviewCard ? (
            <div className="space-y-6">
              <section className="activity-review-heading">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <SectionBadge label="Revisão de erros" />
                    <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                      Revise as respostas incorretas
                    </h2>
                    <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary">
                      As respostas incorretas voltam para o fim da fila.
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

                <div className="activity-stats activity-stats-three">
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
              </section>

              <Flashcard
                key={`error-review-${currentErrorReviewCard.id}-${errorReviewQueue.length}-${errorReviewRetries}`}
                card={currentErrorReviewCard}
                onCorrect={handleErrorReviewCorrect}
                onWrong={handleErrorReviewWrong}
              />
            </div>
          ) : (
            <div className="w-full">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xl">
                  <SectionBadge label="Revisão de erros concluída" />
                  <h2 className="mt-5 font-heading text-2xl font-bold leading-[1.1] text-brand-dark sm:text-3xl">
                    Revisão concluída
                  </h2>
                  <p className="mt-4 font-body text-base leading-relaxed text-brand-secondary">
                    Você revisou {errorReviewInitialCount} {errorReviewInitialCount === 1 ? 'card' : 'cards'} com erro e precisou de {errorReviewRetries} {errorReviewRetries === 1 ? 'repetição' : 'repetições'} adicionais.
                  </p>
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
        </div>
      </div>
      </GameShell>
    )
  }

  if (phase === 'result') {
    return (
      <GameShell>
      <div className="mx-auto w-full max-w-2xl">
        <div
          ref={enterPage}
          className="w-full"
        >
          <div className="max-w-xl" aria-busy={saving}>
              <SectionBadge label={saving ? "Salvando resultado" : saveError ? "Resultado pendente" : "Rodada concluída"} />
              <h1 ref={resultHeading} tabIndex={-1} className="activity-result-title mt-3 font-heading text-brand-dark">Resultado da prática</h1>
              <p className="mt-3 max-w-[55ch] text-sm leading-relaxed text-brand-secondary">
                {accuracy >= 80
                  ? 'Você respondeu com consistência.'
                  : accuracy >= 60
                    ? 'Confira o resultado para escolher o que revisar.'
                    : 'Revise os erros e tente aplicar as frases em outro contexto.'}
              </p>
          </div>

          {saveError && <p role="alert" className="product-error mt-6">{saveError}</p>}
          <div className="activity-stats activity-stats-four">
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

          <div className="activity-actions">
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              data-testid="game-finish-button"
              className={`${homePrimaryButton} touch-manipulation w-full py-4 sm:w-auto`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Salvando
                </>
              ) : (
                saveError ? 'Tentar salvar novamente' : 'Voltar ao início'
              )}
            </button>
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
          </div>
        </div>
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
              ? 'border-error/30 bg-error-soft text-[var(--color-error)]'
              : 'border-brand-dark bg-brand-accent text-brand-dark'
          }`}>
            <Clock3 className="h-4 w-4" strokeWidth={2} />
            {timerExpired ? 'Tempo encerrado' : formatRemaining(remainingMs || 0)}
          </div>
        </div>
      )}
      <div className="activity-toolbar">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Sair da lição"
                onClick={handleExit}
                ref={exitButton}
                className="activity-exit"
                title="Sair da lição"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>

              <div>
                <p className={gameStatLabelClass}>{modeConfig.label}</p>
                <h1 className="activity-lesson-title">{packName}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="activity-metric">Precisão {accuracy}%</span>
              <span className="activity-metric">
                <Flame className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span><span className="sr-only">Sequência: </span>{currentStreak}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-body text-sm text-brand-secondary">
              Item {Math.min(activeStep + 1, activeQueue.length)} de {activeQueue.length}
            </div>
            <div className="w-full sm:max-w-[420px]">
              <div className="learning-progress" data-tone="grammar" role="progressbar" aria-label="Progresso da lição" aria-valuenow={Math.round(progress)}>
                <span
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`activity-exercise mx-auto mt-6 w-full ${
          gameMode === 'matching' ? 'max-w-[1100px]' : 'max-w-[860px]'
        }`}
      >
        <TransitionSlot duration={0.16} enterY={4} ease="expo.out" animateFirst={false}>
          {currentCard && gameMode === 'multiple_choice' && useReadingMode && (
            <div
              key={`reading-${currentCard.id}-${activeStep}-${correct + wrong}`}

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
            </div>
          )}

          {currentCard && gameMode === 'multiple_choice' && !useReadingMode && (
            <div
              key={`multiple-choice-${currentCard.id}-${activeStep}-${correct + wrong}`}

            >
              <MultipleChoice
                  variant="assignment"
                card={currentCard}
                allCards={cards}
                onCorrect={() => {
                  setTimeout(handleCorrect, 800)
                }}
                onWrong={() => {
                  setTimeout(handleWrong, 1200)
                }}
              />
            </div>
          )}

          {currentCard && gameMode === 'flashcard' && (
            <div
              key={`flashcard-${currentCard.id}-${activeStep}-${correct + wrong}`}

            >
              <Flashcard
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </div>
          )}

          {currentCard && gameMode === 'typing' && useGuidedWritingMode && (
            <div
              key={`sentence-build-${currentCard.id}-${activeStep}-${correct + wrong}`}

            >
              <SentenceBuildMode
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </div>
          )}

          {currentCard && gameMode === 'typing' && !useGuidedWritingMode && (
            <div
              key={`typing-${currentCard.id}-${activeStep}-${correct + wrong}`}

            >
              <TypingMode
                card={currentCard}
                direction={typingDirection}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </div>
          )}

          {currentCard && playedMode === 'listening' && (
            <div
              key={`listening-${currentCard.id}-${activeStep}-${correct + wrong}`}

            >
              {isSpeechFallback ? (
                <p className="mx-auto mb-3 max-w-[760px] text-center font-body text-xs font-semibold text-brand-secondary">
                  {SPEECH_FALLBACK_NOTICE}
                </p>
              ) : null}
              <ListeningMode
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            </div>
          )}

          {currentCard && playedMode === 'speaking' && (
            <div
              key={`speaking-${currentCard.id}-${activeStep}-${activeQueue.length}`}

            >
              <SpeakingMode
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onSpeechUnavailable={() => setSpeechAvailable(false)}
              />
            </div>
          )}

          {gameMode === 'matching' && cards.length > 0 && (
            <div
              key={`matching-${assignmentId}`}

            >
              <MatchingGame
                cards={cards}
                onCorrect={answerCorrect}
                onWrong={() => answerWrong(currentCard?.id)}
                onFinish={finishGame}
              />
            </div>
          )}
        </TransitionSlot>
      </div>

      <Dialog open={showExitModal} onOpenChange={(next) => { if (!next) setShowExitModal(false) }}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 sm:max-w-md"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            keepPlayingButton.current?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            exitButton.current?.focus()
          }}
        >
          <DialogTitle className="font-heading text-2xl font-bold text-brand-dark">
            Sair da lição?
          </DialogTitle>
          <DialogDescription className="mt-3 leading-relaxed text-brand-secondary">
            Vamos guardar seus acertos e erros. A lição ficará incompleta até você retomá-la.
          </DialogDescription>

          {/* Resumo do progresso atual */}
          <div className="activity-stats">
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
              className={`${homeSecondaryButton} w-full sm:w-auto`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Salvando
                </>
              ) : (
                'Sair e salvar progresso'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowExitModal(false)}
              ref={keepPlayingButton}
              className={`${homePrimaryButton} w-full sm:w-auto`}
            >
              Continuar lição
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </GameShell>
  )
}
