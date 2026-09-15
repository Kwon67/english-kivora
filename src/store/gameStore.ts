import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card, GameMode } from '@/types/database.types'
import type { TypingDirection } from '@/features/game/components/TypingMode'

type GamePhase = 'intro' | 'playing' | 'result'

interface GameState {
  hasHydrated: boolean

  // Config
  cards: Card[]
  gameMode: GameMode
  assignmentId: string
  packName: string
  packDescription: string
  packCategory: string | null
  /** Só importa no modo de digitação; ver features/game/lib/typingDirection.ts. */
  typingDirection: TypingDirection

  // Progress
  phase: GamePhase
  activeQueue: Card[]
  activeStep: number
  correct: number
  wrong: number
  errorLog: { cardId: string; timestamp: string }[]
  /** Cards acertados na partida. O SRS credita os que estavam vencidos (gameSrsSync.ts). */
  correctLog: string[]
  latencyLog: { cardId: string; latencyMs: number }[]
  currentStreak: number
  maxStreak: number

  // Actions
  setConfig: (config: {
    cards: Card[]
    gameMode: GameMode
    assignmentId: string
    packName: string
    packDescription?: string
    packCategory?: string | null
    typingDirection?: TypingDirection
  }) => void
  startGame: () => void
  answerCorrect: (cardId?: string, latencyMs?: number) => void
  answerWrong: (cardId?: string, latencyMs?: number, mode?: 'report' | 'move' | 'both') => void
  nextStep: () => void
  finishGame: () => void
  resetGame: () => void
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,

      // Config
      cards: [],
      gameMode: 'multiple_choice',
      assignmentId: '',
      packName: '',
      packDescription: '',
      packCategory: null,
      typingDirection: 'pt-to-en',

      // Progress
      phase: 'intro',
      activeQueue: [],
      activeStep: 0,
      correct: 0,
      wrong: 0,
      errorLog: [],
      correctLog: [],
      latencyLog: [],
      currentStreak: 0,
      maxStreak: 0,

      // Actions
      setConfig: (config) =>
        set({
          cards: config.cards,
          activeQueue: config.cards,
          gameMode: config.gameMode,
          assignmentId: config.assignmentId,
          packName: config.packName,
          packDescription: config.packDescription ?? '',
          packCategory: config.packCategory ?? null,
          typingDirection: config.typingDirection ?? 'pt-to-en',
          phase: 'intro',
          activeStep: 0,
          correct: 0,
          wrong: 0,
          errorLog: [],
          correctLog: [],
          latencyLog: [],
          currentStreak: 0,
          maxStreak: 0,
        }),

      startGame: () => set({ phase: 'playing' }),

      answerCorrect: (cardId, latencyMs) => {
        const state = get()
        const newStreak = state.currentStreak + 1
        set({
          correct: state.correct + 1,
          currentStreak: newStreak,
          maxStreak: Math.max(state.maxStreak, newStreak),
          correctLog: cardId ? [...state.correctLog, cardId] : state.correctLog,
          latencyLog: cardId && latencyMs !== undefined
            ? [...state.latencyLog, { cardId, latencyMs }]
            : state.latencyLog,
        })
      },

      answerWrong: (cardId, latencyMs, mode = 'both') => {
        const state = get()
        let newState: Partial<GameState> = {}

        if (mode === 'report' || mode === 'both') {
          newState = {
            ...newState,
            wrong: state.wrong + 1,
            currentStreak: 0,
            errorLog: cardId
              ? [...state.errorLog, { cardId, timestamp: new Date().toISOString() }]
              : state.errorLog,
            latencyLog: cardId && latencyMs !== undefined
              ? [...state.latencyLog, { cardId, latencyMs }]
              : state.latencyLog,
          }
        }

        if (mode === 'move' || mode === 'both') {
          const currentCard = state.activeQueue[state.activeStep]
          if (currentCard) {
            const lastCard = state.activeStep >= state.activeQueue.length - 1
            const before = state.activeQueue.slice(0, state.activeStep)
            const after = state.activeQueue.slice(state.activeStep + 1)
            newState = {
              ...newState,
              activeQueue: [...before, ...after, currentCard, currentCard],
              activeStep: lastCard ? before.length : state.activeStep,
            }
          }
        }

        set(newState)
      },

      nextStep: () => {
        const state = get()
        if (state.activeStep + 1 >= state.activeQueue.length) {
          set({ phase: 'result' })
        } else {
          set({ activeStep: state.activeStep + 1 })
        }
      },

      finishGame: () => set({ phase: 'result' }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      resetGame: () =>
        set({
          cards: [],
          assignmentId: '',
          packName: '',
          packDescription: '',
          packCategory: null,
          phase: 'intro',
          activeQueue: [],
          activeStep: 0,
          correct: 0,
          wrong: 0,
          errorLog: [],
          correctLog: [],
          latencyLog: [],
          currentStreak: 0,
          maxStreak: 0,
        }),
    }),
    {
      name: 'game-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
