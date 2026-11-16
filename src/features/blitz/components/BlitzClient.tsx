'use client'

import { CELEBRATION_COLORS } from '@/lib/brandColors'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, m } from 'motion/react'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'
import { X } from 'lucide-react'
import MultipleChoice from '@/features/game/components/MultipleChoice'
import TypingMode from '@/features/game/components/TypingMode'
import MatchingGame from '@/features/game/components/MatchingGame'
import SpeakingMode from '@/features/game/components/SpeakingMode'
import ListeningMode from '@/features/game/components/ListeningMode'
import BlitzHud from '@/features/blitz/components/BlitzHud'
import BlitzResult from '@/features/blitz/components/BlitzResult'

import BlitzShell from '@/features/blitz/components/BlitzShell'
import ModalPortal from '@/components/ui/ModalPortal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { saveBlitzRun } from '@/app/actions'
import type { BlitzAiPackDraft } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { feedback } from '@/lib/feedback'
import { useUIStore } from '@/store/uiStore'
import {
  BLITZ_LIVES,
  calculateBlitzPoints,
  isGameOver,
} from '@/features/blitz/lib/blitzScoring'
import {
  BLITZ_GAME_MODES,
  DEFAULT_BLITZ_MODE,
  type BlitzGameMode,
} from '@/features/blitz/lib/blitzModes'
import { BLITZ_PRIORITY_REVIEW_LIMIT, type BlitzReviewAttempt } from '@/features/blitz/lib/blitzReviewPriority'
import { reinsertHead, rotateQueue } from '@/features/blitz/lib/blitzQueue'
import {
  INITIAL_BLITZ_RUN_STATE,
  advanceBlitzRunState,
  getBlitzPressure,
  getBlitzPressureLabel,
  getMissReinsertOffset,
  pickAdaptiveBlitzMode,
} from '@/features/blitz/lib/blitzAdaptive'
import {
  hasSpeechRecognitionSupport,
  withoutSpeaking,
} from '@/features/game/lib/speechSupport'
import {
  createBlitzMiss,
  createMatchingBlitzMiss,
  type BlitzMiss,
} from '@/features/blitz/lib/blitzMisses'
import {
  clearBlitzResultSnapshot,
  loadBlitzResultSnapshot,
  saveBlitzResultSnapshot,
} from '@/features/blitz/lib/blitzResultStorage'
import type { MatchingWrongAttempt } from '@/features/game/components/MatchingGame'
import type { SpeakingWrongDetails } from '@/features/game/components/SpeakingMode'
import type { Card } from '@/types/database.types'

interface BlitzClientProps {
  cards: Card[]
  newCardIds?: string[]
  personalBest: number
  source?: 'standard' | 'ai'
  aiPack?: BlitzAiPackDraft | null
}

export default function BlitzClient({
  cards,
  newCardIds,
  personalBest,
  source = 'standard',
  aiPack = null,
}: BlitzClientProps) {
  const router = useRouter()
  const setZenMode = useUIStore((state) => state.setZenMode)
  const [phase, setPhase] = useState<'playing' | 'result'>('playing')
  const [lives, setLives] = useState(BLITZ_LIVES)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [cardsAnswered, setCardsAnswered] = useState(0)
  const [selectedMode, setCurrentMode] = useState<BlitzGameMode>(DEFAULT_BLITZ_MODE)
  const [cardQueue, setCardQueue] = useState(() => [...cards])
  const reduceMotion = useHydratedReducedMotion()
  const [roundStartTime, setRoundStartTime] = useState(0)
  const [showExitModal, setShowExitModal] = useState(false)
  const [savedBest, setSavedBest] = useState(personalBest)
  const [runRewards, setRunRewards] = useState<{
    streakUpdated?: boolean
    unlockedBadges?: { name: string; icon_name: string | null }[]
    questsCompleted?: string[]
  } | null>(null)
  const [misses, setMisses] = useState<BlitzMiss[]>([])
  const [priorityReviewCardIds, setPriorityReviewCardIds] = useState<string[] | null>(null)
  const priorityAttempts = useRef<BlitzReviewAttempt[]>([])
  const correctCardIdsRef = useRef<string[]>([])
  const [learnedCards, setLearnedCards] = useState<Set<string>>(() => new Set())
  const replayDeck = useRef<Card[] | null>(null)
  const newIds = useMemo(() => new Set(newCardIds), [newCardIds])
  // Estado vivo que a adaptação lê. Fica em ref porque `advanceRound` precisa do valor já
  // atualizado na mesma rodada — passar por state chegaria um render atrasado.
  const runStateRef = useRef(INITIAL_BLITZ_RUN_STATE)
  const [pressureLabel, setPressureLabel] = useState('')
  const [activeSource, setActiveSource] = useState<'standard' | 'ai'>(source)
  const [activeAiPack, setActiveAiPack] = useState<BlitzAiPackDraft | null>(aiPack)
  const missesRef = useRef<BlitzMiss[]>([])
  const sessionStartRef = useRef(0)
  const hasSavedRef = useRef(false)
  const missCountRef = useRef(0)
  // Modos disponíveis no sorteio. Sem reconhecimento de voz a fala sai da lista — antes ela era
  // sorteada mesmo assim, a tela travava num erro e "Pular" custava uma vida.
  const availableModesRef = useRef<BlitzGameMode[]>([...BLITZ_GAME_MODES])
  useEffect(() => {
    if (!hasSpeechRecognitionSupport()) availableModesRef.current = withoutSpeaking([...BLITZ_GAME_MODES])
  }, [])
  const dropSpeakingMode = useCallback(() => {
    availableModesRef.current = withoutSpeaking(availableModesRef.current)
    // A rodada atual troca para escuta na hora, sem custar vida: a frase e o áudio são os mesmos.
    setCurrentMode('listening')
    setRoundStartTime(Date.now())
  }, [])

  const allCards = useMemo(() => (cardQueue.length > 0 ? cardQueue : cards), [cardQueue, cards])
  const currentCard = allCards[0]
  const matchingCards = useMemo(() => {
    const firstCards = allCards.slice(0, 4)
    const firstNewIndex = firstCards.findIndex(card => newIds.has(card.id) && !learnedCards.has(card.id))
    return firstNewIndex < 0 ? firstCards : firstCards.slice(0, firstNewIndex)
  }, [allCards, learnedCards, newIds])
  const isAiWarmup = activeSource === 'ai' && cardsAnswered < 3 && selectedMode !== 'matching'
  const currentMode = isAiWarmup || (currentCard && newIds.has(currentCard.id) && !learnedCards.has(currentCard.id)) ||
    (selectedMode === 'matching' && matchingCards.length < 2)
    ? 'multiple_choice'
    : selectedMode

  useEffect(() => {
    setZenMode(true)
    return () => setZenMode(false)
  }, [setZenMode])

  useEffect(() => {
    const snapshot = loadBlitzResultSnapshot()
    if (!snapshot) return
    if ((snapshot.source ?? 'standard') !== source) {
      clearBlitzResultSnapshot()
      return
    }

    const restoreTimer = window.setTimeout(() => {
      setPhase('result')
      setScore(snapshot.score)
      setMaxCombo(snapshot.maxCombo)
      setCardsAnswered(snapshot.cardsAnswered)
      setSavedBest(snapshot.savedBest)
      setMisses(snapshot.misses)
      missesRef.current = snapshot.misses
      setRunRewards(snapshot.runRewards)
      setPriorityReviewCardIds(snapshot.priorityReviewCardIds ?? [])
      setActiveSource(snapshot.source ?? 'standard')
      setActiveAiPack(snapshot.aiPack ?? null)
      hasSavedRef.current = true
    }, 0)

    return () => window.clearTimeout(restoreTimer)
  }, [source])

  useEffect(() => {
    if (phase === 'result') return

    const now = Date.now()
    sessionStartRef.current = now

    const startTimer = window.setTimeout(() => {
      setRoundStartTime(now)
      // Sem embaralhar: o servidor já ordenou por relevância (`rankCards`), com o que a pessoa
      // erra na frente e packs intercalados. Um `shuffleArray` aqui jogaria essa escolha fora.
      runStateRef.current = INITIAL_BLITZ_RUN_STATE
      setCardQueue(replayDeck.current ?? [...cards])
      replayDeck.current = null
      setCurrentMode(pickAdaptiveBlitzMode(INITIAL_BLITZ_RUN_STATE, ['multiple_choice', 'matching']))
      setPressureLabel('')
    }, 0)

    return () => window.clearTimeout(startTimer)
  }, [cards, phase])

  /**
   * A próxima rodada.
   *
   * Antes: `pickRandomBlitzMode()` — sorteio com pesos fixos, idêntico na primeira rodada e depois
   * de dez acertos seguidos. Agora a exigência do modo acompanha o desempenho: quem está travando
   * recebe reconhecimento (múltipla escolha, combinação), quem está embalado recebe produção
   * (digitação, fala). E o rótulo aparece no HUD, para a adaptação ser percebida em vez de
   * silenciosa — um professor que pega leve avisa que está pegando leve.
   */
  const advanceRound = useCallback((correct?: boolean) => {
    if (typeof correct === 'boolean') {
      runStateRef.current = advanceBlitzRunState(runStateRef.current, correct)
    }

    setCurrentMode((modoAnterior) =>
      pickAdaptiveBlitzMode(runStateRef.current, availableModesRef.current, { avoid: modoAnterior })
    )
    setPressureLabel(getBlitzPressureLabel(getBlitzPressure(runStateRef.current)))
    setRoundStartTime(Date.now())
  }, [])

  const recordMiss = useCallback(
    (
      card: Card,
      mode: BlitzGameMode,
      options?: {
        detail?: string
        speechDetails?: SpeakingWrongDetails
        wasNew?: boolean
      }
    ) => {
      missCountRef.current += 1
      const miss = createBlitzMiss(card, mode, {
        ...options,
        idSuffix: `${missCountRef.current}`,
      })
      const next = [...missesRef.current, miss]
      missesRef.current = next
      setMisses(next)
    },
    []
  )

  function recordPriorityAttempt(mode: BlitzReviewAttempt['mode'], answer: string) {
    const text = answer.trim()
    if (activeSource !== 'standard' || !currentCard || !text || text.length > 500 ||
      priorityAttempts.current.length >= BLITZ_PRIORITY_REVIEW_LIMIT) return
    priorityAttempts.current.push({ cardId: currentCard.id, mode, answer: text })
  }

  const persistRun = useCallback(async () => {
    if (hasSavedRef.current) return
    hasSavedRef.current = true
    const startedAt = sessionStartRef.current

    try {
      const result = await saveBlitzRun({
        score,
        maxCombo,
        cardsAnswered,
        durationMs: Date.now() - sessionStartRef.current,
        correctCardIds: [...new Set(correctCardIdsRef.current)].slice(0, 500),
        reviewAttempts: priorityAttempts.current.slice(),
      })
      if (sessionStartRef.current !== startedAt) return
      setPriorityReviewCardIds(result.priorityReviewCardIds ?? [])
      if (result.bestScore > savedBest) {
        setSavedBest(result.bestScore)
      }
      if ('streakUpdated' in result || 'unlockedBadges' in result) {
        setRunRewards({
          streakUpdated: result.streakUpdated,
          unlockedBadges: result.unlockedBadges,
          questsCompleted: result.questsCompleted,
        })
      }
    } catch (error) {
      if (sessionStartRef.current === startedAt) setPriorityReviewCardIds([])
      console.error('Erro ao salvar partida de Blitz:', error)
    }
  }, [cardsAnswered, maxCombo, savedBest, score])

  useEffect(() => {
    if (phase === 'result') {
      void persistRun()
    }
  }, [phase, persistRun])

  useEffect(() => {
    if (phase !== 'result') return

    saveBlitzResultSnapshot({
      score,
      maxCombo,
      cardsAnswered,
      savedBest,
      personalBest: Math.max(savedBest, score),
      isNewRecord: score > personalBest,
      misses,
      priorityReviewCardIds: priorityReviewCardIds ?? undefined,
      source: activeSource,
      aiPack: activeAiPack,
      runRewards,
    })
  }, [phase, score, maxCombo, cardsAnswered, savedBest, personalBest, misses, activeSource, activeAiPack, runRewards, priorityReviewCardIds])

  const completeBlitzRound = useCallback((options?: { latencyMs?: number; consumedCards?: number }) => {
    const latency = options?.latencyMs ?? Math.max(0, Date.now() - roundStartTime)
    const nextCombo = combo + 1
    const points = calculateBlitzPoints(nextCombo, latency)
    const consumedCards = options?.consumedCards ?? 1

    setScore((value) => value + points)
    setCombo(nextCombo)
    setMaxCombo((value) => Math.max(value, nextCombo))
    setCardsAnswered((value) => value + 1)
    feedback.streak(Math.min(nextCombo, 3))

    if (nextCombo >= 5) {
      void import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          disableForReducedMotion: true,
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: CELEBRATION_COLORS,
        })
      })
    }

    setCardQueue((queue) => {
      const activeQueue = queue.length > 0 ? queue : [...cards]

      // Rodada que consumiu vários cards (combinação) manda todos eles para o fim. Rodada de um
      // card só reinsere ESSE card no fim — antes girava a fila em teto(len/3), o que pulava as
      // frases do meio e prendia a partida num punhado delas.
      return consumedCards > 1
        ? rotateQueue(activeQueue, consumedCards)
        : reinsertHead(activeQueue, activeQueue.length - 1)
    })
    advanceRound(true)
  }, [advanceRound, cards, combo, roundStartTime])

  const handleCorrect = useCallback((latencyMs?: number) => {
    if (currentCard) {
      correctCardIdsRef.current.push(currentCard.id)
      if (newIds.has(currentCard.id)) setLearnedCards(previous => previous.has(currentCard.id) ? previous : new Set([...previous, currentCard.id]))
    }
    completeBlitzRound({ latencyMs })
  }, [completeBlitzRound, currentCard, newIds])

  const handleMatchingPairCorrect = useCallback(() => {
    feedback.streak(1)
  }, [])

  const handleMatchingWrong = useCallback((attempt?: MatchingWrongAttempt) => {
    feedback.error()
    const matchingMiss = createMatchingBlitzMiss(
      matchingCards,
      attempt ? `${attempt.english} ↔ ${attempt.portuguese}` : undefined
    )
    if (matchingMiss) {
      missCountRef.current += 1
      const next = [
        ...missesRef.current,
        { ...matchingMiss, id: `${matchingMiss.id}-${missCountRef.current}` },
      ]
      missesRef.current = next
      setMisses(next)
    }
    const nextLives = lives - 1
    setLives(nextLives)
    setCombo(0)
    setCardsAnswered((value) => value + 1)

    if (isGameOver(nextLives)) {
      setPhase('result')
    }
  }, [lives, matchingCards])

  const handleWrong = useCallback((
    latencyMs?: number,
    mode?: 'report' | 'move' | 'both',
    details?: SpeakingWrongDetails
  ) => {
    if (mode === 'report') {
      return
    }

    if (currentCard) {
      recordMiss(currentCard, currentMode, {
        speechDetails: details,
        wasNew: activeSource === 'ai' || (newIds.has(currentCard.id) && !learnedCards.has(currentCard.id)),
      })
    }

    feedback.error()
    const nextLives = lives - 1
    setLives(nextLives)
    setCombo(0)
    setCardsAnswered((value) => value + 1)
    setCardQueue((queue) => {
      const activeQueue = queue.length > 0 ? queue : [...cards]
      // O card errado volta depois de algumas outras frases: 3 quando a pessoa está bem — perto o
      // bastante para fixar — e 6 quando está travando, porque repetir logo o que acabou de
      // derrubar frustra em vez de ensinar. Com `reinsertHead` a distância é literal; com o
      // `rotateQueue` de antes, as frases intermediárias eram puladas.
      const distancia = getMissReinsertOffset(runStateRef.current, activeQueue.length)
      return reinsertHead(activeQueue, distancia)
    })

    if (isGameOver(nextLives)) {
      setPhase('result')
      return
    }

    advanceRound(false)
  }, [activeSource, advanceRound, cards, currentCard, currentMode, learnedCards, lives, newIds, recordMiss])

  const handleMatchingFinish = useCallback(() => {
    // A combinação joga quatro cards de uma vez; todos os quatro vão para o fim da fila.
    completeBlitzRound({ consumedCards: matchingCards.length })
  }, [matchingCards.length, completeBlitzRound])

  const handleLeaveResult = useCallback(() => {
    clearBlitzResultSnapshot()
  }, [])

  const handleCloseResult = useCallback(() => {
    handleLeaveResult()
    router.push('/blitz', { transitionTypes: navBackTransitionTypes })
  }, [handleLeaveResult, router])

  const handlePlayAgain = useCallback(() => {
    clearBlitzResultSnapshot()
    hasSavedRef.current = false
    sessionStartRef.current = Date.now()
    setRunRewards(null)
    setPriorityReviewCardIds(null)
    priorityAttempts.current = []
    correctCardIdsRef.current = []
    setActiveSource(source)
    setActiveAiPack(aiPack)
    setPhase('playing')
    setLives(BLITZ_LIVES)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setCardsAnswered(0)
    setMisses([])
    const missedIds = new Set(missesRef.current.filter(miss => miss.mode !== 'matching').map(miss => miss.cardId))
    replayDeck.current = [...cards.filter(card => !missedIds.has(card.id)), ...cards.filter(card => missedIds.has(card.id))]
    missesRef.current = []
    missCountRef.current = 0
    runStateRef.current = INITIAL_BLITZ_RUN_STATE
    setPressureLabel('')
    setCardQueue(replayDeck.current)
    setCurrentMode(DEFAULT_BLITZ_MODE)
  }, [aiPack, cards, source])

  if (!currentCard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-body text-brand-secondary">Não há cards suficientes para jogar.</p>
      </div>
    )
  }

  return (
    <BlitzShell>
      <div className={`mx-auto w-full min-w-0 max-w-3xl ${phase === 'result' ? 'pointer-events-none select-none opacity-40' : ''}`}>
        {/* No breadcrumb during a live match: this screen runs in zen mode, a timed run should
            not offer two navigation trails out of it, and the exit button already covers leaving
            (with its confirm dialog, which a breadcrumb link bypassed entirely). */}
        <header className="blitz-match-heading">
          <div>
            <p className="blitz-kicker">Partida</p>
            <h1>{activeSource === 'ai' ? 'Blitz IA' : 'Blitz'}</h1>
          </div>
          <button type="button" onClick={() => setShowExitModal(true)} className="blitz-close" aria-label="Sair do Blitz">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <BlitzHud
          adaptationLabel={pressureLabel}
          lives={lives}
          score={score}
          combo={combo}
          mode={currentMode}
          cardsAnswered={cardsAnswered}
          totalCards={cards.length}
        />

        <AnimatePresence mode="wait">
          <m.div
            key={`${currentMode}-${currentCard.id}`}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="blitz-round"
          >
            {currentMode === 'multiple_choice' && (
              <MultipleChoice
                card={currentCard}
                allCards={allCards}
                variant="blitz"
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            )}
            {currentMode === 'typing' && (
              <TypingMode
                card={currentCard}
                variant="blitz"
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onWrongAnswer={answer => recordPriorityAttempt('typing', answer)}
              />
            )}
            {currentMode === 'speaking' && (
              <SpeakingMode
                card={currentCard}
                variant="blitz"
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onSpeechUnavailable={dropSpeakingMode}
              />
            )}
            {currentMode === 'listening' && (
              <ListeningMode
                card={currentCard}
                variant="blitz"
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onWrongAnswer={answer => recordPriorityAttempt('listening', answer)}
              />
            )}
            {currentMode === 'matching' && matchingCards.length >= 2 && (
              <MatchingGame
                cards={matchingCards}
                layout="compact"
                onCorrect={handleMatchingPairCorrect}
                onWrong={handleMatchingWrong}
                onFinish={handleMatchingFinish}
              />
            )}
          </m.div>
        </AnimatePresence>
      </div>

      {/* Era um ModalPortal chamado sem `onClose`: clicar no fundo não fechava, sem Esc, sem
          foco travado, sem devolução de foco. ConfirmDialog já resolve os quatro. */}
      {showExitModal && phase !== 'result' && (
        <ConfirmDialog
          title="Sair do Blitz?"
          description="Seu progresso desta partida será perdido."
          confirmLabel="Sair"
          cancelLabel="Continuar"
          variant="danger"
          surfaceClassName="blitz-confirm"
          onConfirm={() => router.push('/blitz', { transitionTypes: navBackTransitionTypes })}
          onCancel={() => setShowExitModal(false)}
        />
      )}

      {phase === 'result' && (
        <ModalPortal
          closeOnBackdrop={false}
          lockScroll
          className="fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center overflow-y-auto overscroll-contain bg-brand-dark/45 p-3 pb-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:p-4 sm:pt-4"
        >
          <BlitzResult
            score={score}
            maxCombo={maxCombo}
            cardsAnswered={cardsAnswered}
            personalBest={Math.max(savedBest, score)}
            isNewRecord={score > personalBest}
            streakUpdated={runRewards?.streakUpdated}
            unlockedBadges={runRewards?.unlockedBadges}
            questsCompleted={runRewards?.questsCompleted}
            misses={misses}
            priorityReviewCardIds={priorityReviewCardIds ?? []}
            priorityReviewPending={priorityReviewCardIds === null && activeSource === 'standard' && misses.some(miss => miss.mode === 'typing' || miss.mode === 'listening')}
            source={activeSource}
            aiPack={activeAiPack}
            onPlayAgain={handlePlayAgain}
            onClose={handleCloseResult}
            onLeaveResult={handleLeaveResult}
          />
        </ModalPortal>
      )}
    </BlitzShell>
  )
}
