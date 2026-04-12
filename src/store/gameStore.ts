import { create } from 'zustand'
import type { Card, GameMode } from '@/types/database.types'

type GamePhase = 'intro' | 'playing' | 'result'

interface GameState {
  // Config
  cards: Card[]
  gameMode: GameMode
  assignmentId: string
  packName: string

  // Progress
  phase: GamePhase
  currentIndex: number
  correct: number
  wrong: number
  errorLog: { cardId: string; timestamp: string }[]
  currentStreak: number
  maxStreak: number

  // Actions
  setConfig: (config: {
    cards: Card[]
    gameMode: GameMode
    assignmentId: string
    packName: string
  }) => void
  startGame: () => void
  answerCorrect: () => void
  answerWrong: (cardId?: string) => void
  nextCard: () => void
  finishGame: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  // Config
  cards: [],
  gameMode: 'multiple_choice',
  assignmentId: '',
  packName: '',

  // Progress
  phase: 'intro',
  currentIndex: 0,
  correct: 0,
  wrong: 0,
  errorLog: [],
  currentStreak: 0,
  maxStreak: 0,

  // Actions
  setConfig: (config) =>
    set({
      cards: config.cards,
      gameMode: config.gameMode,
      assignmentId: config.assignmentId,
      packName: config.packName,
      phase: 'intro',
      currentIndex: 0,
      correct: 0,
      wrong: 0,
      errorLog: [],
      currentStreak: 0,
      maxStreak: 0,
    }),

  startGame: () => set({ phase: 'playing' }),

  answerCorrect: () => {
    const state = get()
    const newStreak = state.currentStreak + 1
    set({
      correct: state.correct + 1,
      currentStreak: newStreak,
      maxStreak: Math.max(state.maxStreak, newStreak),
    })
  },

  answerWrong: (cardId) =>
    set((state) => ({
      wrong: state.wrong + 1,
      currentStreak: 0,
      errorLog: cardId
        ? [...state.errorLog, { cardId, timestamp: new Date().toISOString() }]
        : state.errorLog,
    })),

  nextCard: () => {
    const state = get()
    if (state.currentIndex + 1 >= state.cards.length) {
      set({ phase: 'result' })
    } else {
      set({ currentIndex: state.currentIndex + 1 })
    }
  },

  finishGame: () => set({ phase: 'result' }),

  resetGame: () =>
    set({
      phase: 'intro',
      currentIndex: 0,
      correct: 0,
      wrong: 0,
      errorLog: [],
      currentStreak: 0,
      maxStreak: 0,
    }),
}))
