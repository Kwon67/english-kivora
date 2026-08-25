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
import { blitzHudCard, blitzKicker } from '@/features/blitz/lib/blitzUi'
import { landingRadius } from '@/lib/landingStyles'
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
      // Sem embaralhar: o servidor já ordenou por relevância (`rankCards`), com o que a pessoa
      // erra na frente e packs intercalados. Um `shuffleArray` aqui jogaria essa escolha fora.
      runStateRef.current = INITIAL_BLITZ_RUN_STATE
      setCardQueue([...cards])
      setCurrentMode(pickAdaptiveBlitzMode(INITIAL_BLITZ_RUN_STATE, [...BLITZ_GAME_MODES]))
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
      pickAdaptiveBlitzMode(runStateRef.current, [...BLITZ_GAME_MODES], { avoid: modoAnterior })
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
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['rgb(28,25,21)', 'rgb(213,224,107)', 'rgb(244,241,234)', 'rgb(107,101,96)'],
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
  }, [advanceRound, cards, currentCard, currentMode, lives, recordMiss])

  const handleMatchingFinish = useCallback(() => {
    // A combinação joga quatro cards de uma vez; todos os quatro vão para o fim da fila.
    const consumedCards = Math.min(4, cardQueue.length > 0 ? cardQueue.length : cards.length)
    completeBlitzRound({ consumedCards })
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
    runStateRef.current = INITIAL_BLITZ_RUN_STATE
    setPressureLabel('')
    setCardQueue([...cards])
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

      {/* Era um ModalPortal chamado sem `onClose`: clicar no fundo não fechava, sem Esc, sem
          foco travado, sem devolução de foco. ConfirmDialog já resolve os quatro. */}
      {showExitModal && phase !== 'result' && (
        <ConfirmDialog
          title="Sair do Blitz?"
          description="Seu progresso desta partida será perdido."
          confirmLabel="Sair"
          cancelLabel="Continuar"
          variant="danger"
          surfaceClassName="home-frosted-surface home-frosted-surface-soft"
          onConfirm={() => router.push('/blitz', { transitionTypes: navBackTransitionTypes })}
          onCancel={() => setShowExitModal(false)}
        />
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
