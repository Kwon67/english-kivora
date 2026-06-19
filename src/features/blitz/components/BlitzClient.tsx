'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, m } from 'framer-motion'
import { X } from 'lucide-react'
import MultipleChoice from '@/features/game/components/MultipleChoice'
import TypingMode from '@/features/game/components/TypingMode'
import MatchingGame from '@/features/game/components/MatchingGame'
import SpeakingMode from '@/features/game/components/SpeakingMode'
import BlitzHud from '@/features/blitz/components/BlitzHud'
import BlitzResult from '@/features/blitz/components/BlitzResult'
import BlitzShell from '@/features/blitz/components/BlitzShell'
import { blitzGlassPanel } from '@/features/blitz/lib/blitzUi'
import ModalPortal from '@/components/ui/ModalPortal'
import { saveBlitzRun } from '@/app/actions'
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
}

function rotateQueue(queue: Card[], count: number) {
  if (queue.length === 0) return queue
  const safeCount = Math.min(count, queue.length)
  const rotated = [...queue.slice(safeCount), ...queue.slice(0, safeCount)]
  return rotated.length > 0 ? rotated : queue
}

export default function BlitzClient({ cards, personalBest }: BlitzClientProps) {
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

    setPhase('result')
    setScore(snapshot.score)
    setMaxCombo(snapshot.maxCombo)
    setCardsAnswered(snapshot.cardsAnswered)
    setSavedBest(snapshot.savedBest)
    setMisses(snapshot.misses)
    missesRef.current = snapshot.misses
    setRunRewards(snapshot.runRewards)
    hasSavedRef.current = true
  }, [])

  useEffect(() => {
    if (phase === 'result') return

    const now = Date.now()
    sessionStartRef.current = now
    setRoundStartTime(now)
    setCardQueue(shuffleArray(cards))
    setCurrentMode(pickRandomBlitzMode())
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
      runRewards,
    })
  }, [phase, score, maxCombo, cardsAnswered, savedBest, personalBest, misses, runRewards])

  const completeBlitzRound = useCallback((options?: { latencyMs?: number; rotateCount?: number }) => {
    const latency = options?.latencyMs ?? Math.max(0, Date.now() - roundStartTime)
    const nextCombo = combo + 1
    const points = calculateBlitzPoints(nextCombo, latency)
    const rotateCount = options?.rotateCount ?? 1

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
          colors: ['#466259', '#5e7a71', '#735802', '#cae9de'],
        })
      })
    }

    setCardQueue((queue) =>
      rotateQueue(
        queue.length > 0 ? queue : shuffleArray(cards),
        Math.min(rotateCount, queue.length > 0 ? queue.length : cards.length)
      )
    )
    advanceRound()
  }, [advanceRound, cards, combo, roundStartTime])

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
    setCardQueue((queue) => rotateQueue(queue.length > 0 ? queue : shuffleArray(cards), 1))

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

  const handleCloseResult = useCallback(() => {
    clearBlitzResultSnapshot()
    router.push('/blitz', { transitionTypes: navBackTransitionTypes })
  }, [router])

  const handlePlayAgain = useCallback(() => {
    clearBlitzResultSnapshot()
    hasSavedRef.current = false
    sessionStartRef.current = Date.now()
    setRunRewards(null)
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
  }, [advanceRound, cards])

  if (!currentCard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-muted">Não há cards suficientes para jogar.</p>
      </div>
    )
  }

  return (
    <BlitzShell>
      <div className={`mx-auto max-w-3xl ${phase === 'result' ? 'pointer-events-none select-none opacity-40' : ''}`}>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border-muted/22 bg-card text-text-muted shadow-sm transition-colors hover:text-text dark:border-border-accent/20"
            aria-label="Sair do Blitz"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <BlitzHud lives={lives} score={score} combo={combo} mode={currentMode} />

        <AnimatePresence mode="wait">
          <m.div
            key={`${currentMode}-${currentCard.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className={`${blitzGlassPanel} relative overflow-hidden p-5 sm:p-6`}
          >
            <div className="relative z-0">
            {currentMode === 'multiple_choice' && (
              <MultipleChoice
                card={currentCard}
                allCards={allCards}
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
          <div className={`w-full max-w-md p-6 ${blitzGlassPanel}`}>
            <h2 className="text-xl font-bold text-text">Sair do Blitz?</h2>
            <p className="mt-2 text-sm text-text-muted">
              Seu progresso desta partida será perdido.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={() => setShowExitModal(false)}>
                Continuar
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => router.push('/blitz', { transitionTypes: navBackTransitionTypes })}
              >
                Sair
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {phase === 'result' && (
        <ModalPortal closeOnBackdrop={false} lockScroll>
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
            onPlayAgain={handlePlayAgain}
            onClose={handleCloseResult}
          />
        </ModalPortal>
      )}
    </BlitzShell>
  )
}