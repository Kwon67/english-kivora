'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, m } from 'motion/react'
import { X } from 'lucide-react'
import MultipleChoice from '@/features/game/components/MultipleChoice'
import TypingMode from '@/features/game/components/TypingMode'
import MatchingGame from '@/features/game/components/MatchingGame'
import SpeakingMode from '@/features/game/components/SpeakingMode'
import ListeningMode from '@/features/game/components/ListeningMode'
import BlitzHud from '@/features/blitz/components/BlitzHud'
import BlitzResult from '@/features/blitz/components/BlitzResult'

import BlitzShell from '@/features/blitz/components/BlitzShell'
import { blitzHudCard, blitzKicker, blitzSoftBtn, blitzPrimaryBtn } from '@/features/blitz/lib/blitzUi'
import { landingRadius } from '@/lib/landingStyles'
import ModalPortal from '@/components/ui/ModalPortal'
import { saveBlitzRun } from '@/app/actions'
import type { BlitzAiPackDraft } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { feedback } from '@/lib/feedback'
import { shuffleArray } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import {
  BLITZ_LIVES,
  calculateBlitzPoints,
  isGameOver,
} from '@/features/blitz/lib/blitzScoring'
import {
  DEFAULT_BLITZ_MODE,
  pickRandomBlitzMode,
  type BlitzGameMode,
} from '@/features/blitz/lib/blitzModes'
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
  personalBest: number
  source?: 'standard' | 'ai'
  aiPack?: BlitzAiPackDraft | null
}

function rotateQueue(queue: Card[], count: number) {
  if (queue.length === 0) return queue
  const safeCount = Math.min(count, queue.length)
  const rotated = [...queue.slice(safeCount), ...queue.slice(0, safeCount)]
  return rotated.length > 0 ? rotated : queue
}

export default function BlitzClient({
  cards,
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
  const [currentMode, setCurrentMode] = useState<BlitzGameMode>(DEFAULT_BLITZ_MODE)
  const [cardQueue, setCardQueue] = useState(() => [...cards])
  const [roundStartTime, setRoundStartTime] = useState(0)
  const [showExitModal, setShowExitModal] = useState(false)
  const [savedBest, setSavedBest] = useState(personalBest)
  const [runRewards, setRunRewards] = useState<{
    streakUpdated?: boolean
    unlockedBadges?: { name: string; icon_name: string | null }[]
    questsCompleted?: string[]
  } | null>(null)
  const [misses, setMisses] = useState<BlitzMiss[]>([])
  const [activeSource, setActiveSource] = useState<'standard' | 'ai'>(source)
  const [activeAiPack, setActiveAiPack] = useState<BlitzAiPackDraft | null>(aiPack)
  const missesRef = useRef<BlitzMiss[]>([])
  const sessionStartRef = useRef(0)
  const hasSavedRef = useRef(false)
  const missCountRef = useRef(0)

  const allCards = useMemo(() => (cardQueue.length > 0 ? cardQueue : cards), [cardQueue, cards])
  const currentCard = allCards[0]
  const matchingCards = useMemo(() => allCards.slice(0, Math.min(4, allCards.length)), [allCards])

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
      setCardQueue(shuffleArray(cards))
      setCurrentMode(pickRandomBlitzMode())
    }, 0)

    return () => window.clearTimeout(startTimer)
  }, [cards, phase])

  const advanceRound = useCallback(() => {
    setCurrentMode(pickRandomBlitzMode())
    setRoundStartTime(Date.now())
  }, [])

  const recordMiss = useCallback(
    (
      card: Card,
      mode: BlitzGameMode,
      options?: {
        detail?: string
        speechDetails?: SpeakingWrongDetails
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

  const persistRun = useCallback(async () => {
    if (hasSavedRef.current) return
    hasSavedRef.current = true

    try {
      const result = await saveBlitzRun({
        score,
        maxCombo,
        cardsAnswered,
        durationMs: Date.now() - sessionStartRef.current,
      })
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
      source: activeSource,
      aiPack: activeAiPack,
      runRewards,
    })
  }, [phase, score, maxCombo, cardsAnswered, savedBest, personalBest, misses, activeSource, activeAiPack, runRewards])

  const completeBlitzRound = useCallback((options?: { latencyMs?: number; rotateCount?: number }) => {
    const latency = options?.latencyMs ?? Math.max(0, Date.now() - roundStartTime)
    const nextCombo = combo + 1
    const points = calculateBlitzPoints(nextCombo, latency)
    const baseRotate = options?.rotateCount ?? 1
    const queueLen = cardQueue.length > 0 ? cardQueue.length : cards.length
    // Push the answered card further back so it doesn't reappear too soon
    const rotateCount = Math.max(baseRotate, Math.min(Math.ceil(queueLen / 3), queueLen))

    setScore((value) => value + points)
    setCombo(nextCombo)
    setMaxCombo((value) => Math.max(value, nextCombo))
    setCardsAnswered((value) => value + 1)
    feedback.streak(Math.min(nextCombo, 3))

    if (nextCombo >= 5) {
      void import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['rgb(28,25,21)', 'rgb(213,224,107)', 'rgb(244,241,234)', 'rgb(107,101,96)'],
        })
      })
    }

    setCardQueue((queue) => {
      const activeQueue = queue.length > 0 ? queue : shuffleArray(cards)
      return rotateQueue(activeQueue, Math.min(rotateCount, activeQueue.length))
    })
    advanceRound()
  }, [advanceRound, cardQueue.length, cards, combo, roundStartTime])

  const handleCorrect = useCallback((latencyMs?: number) => {
    completeBlitzRound({ latencyMs })
  }, [completeBlitzRound])

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
      recordMiss(currentCard, currentMode, details ? { speechDetails: details } : undefined)
    }

    feedback.error()
    const nextLives = lives - 1
    setLives(nextLives)
    setCombo(0)
    setCardsAnswered((value) => value + 1)
    setCardQueue((queue) => {
      const activeQueue = queue.length > 0 ? queue : shuffleArray(cards)
      // On wrong answer, push the card at least halfway through the queue so it doesn't repeat immediately
      const missRotate = Math.max(3, Math.floor(activeQueue.length / 2))
      return rotateQueue(activeQueue, Math.min(missRotate, activeQueue.length))
    })

    if (isGameOver(nextLives)) {
      setPhase('result')
      return
    }

    advanceRound()
  }, [advanceRound, cards, currentCard, currentMode, lives, recordMiss])

  const handleMatchingFinish = useCallback(() => {
    const rotateCount = Math.min(4, cardQueue.length > 0 ? cardQueue.length : cards.length)
    completeBlitzRound({ rotateCount })
  }, [cardQueue.length, cards.length, completeBlitzRound])

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
    setActiveSource(source)
    setActiveAiPack(aiPack)
    setPhase('playing')
    setLives(BLITZ_LIVES)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setCardsAnswered(0)
    setMisses([])
    missesRef.current = []
    missCountRef.current = 0
    setCardQueue(shuffleArray(cards))
    advanceRound()
  }, [advanceRound, aiPack, cards, source])

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
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className={`${blitzKicker} bg-brand-accent`}>
            {activeSource === 'ai' ? 'Blitz IA' : 'Partida'}
          </span>
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center ${landingRadius} border border-brand-dark bg-bg-card text-brand-dark transition-colors hover:bg-brand-dark hover:text-white`}
            aria-label="Sair do Blitz"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <BlitzHud
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className={`${blitzHudCard} relative overflow-hidden p-4 sm:p-6`}
          >
            <div className="relative z-0">
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
              />
            )}
            {currentMode === 'speaking' && (
              <SpeakingMode
                card={currentCard}
                variant="blitz"
                onCorrect={handleCorrect}
                onWrong={handleWrong}
              />
            )}
            {currentMode === 'listening' && (
              <ListeningMode
                card={currentCard}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
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
            </div>
          </m.div>
        </AnimatePresence>
      </div>

      {showExitModal && phase !== 'result' && (
        <ModalPortal>
          <div className={`w-full max-w-md p-5 sm:p-6 ${blitzHudCard}`}>
            <h2 className="font-heading text-xl font-bold text-brand-dark">Sair do Blitz?</h2>
            <p className="mt-2 font-body text-sm text-brand-secondary">
              Seu progresso desta partida será perdido.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" className={`${blitzSoftBtn} flex-1`} onClick={() => setShowExitModal(false)}>
                Continuar
              </button>
              <button
                type="button"
                className={`${blitzPrimaryBtn} flex-1`}
                onClick={() => router.push('/blitz', { transitionTypes: navBackTransitionTypes })}
              >
                Sair
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {phase === 'result' && (
        <ModalPortal
          closeOnBackdrop={false}
          lockScroll
          className="fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center overflow-y-auto overscroll-contain bg-brand-dark/15 p-3 pb-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] backdrop-blur-2xl sm:p-4 sm:pt-4"
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
