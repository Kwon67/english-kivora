import {
  Headphones,
  Keyboard,
  Layers,
  Mic,
  Puzzle,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { PLAYABLE_GAME_MODES } from '@/features/review/lib/reviewSchedules'
import type { GameMode } from '@/types/database.types'

export type GameModeOption = {
  id: GameMode
  label: string
  shortLabel: string
  note: string
  icon: LucideIcon
}

export const GAME_MODE_OPTIONS: GameModeOption[] = [
  {
    id: 'multiple_choice',
    label: 'Múltipla escolha',
    shortLabel: 'Tradução',
    note: 'Escolha a melhor tradução com contexto imediato.',
    icon: Target,
  },
  {
    id: 'flashcard',
    label: 'Flashcard',
    shortLabel: 'Revisão',
    note: 'Memorização ativa com repetição curta e objetiva.',
    icon: Layers,
  },
  {
    id: 'typing',
    label: 'Digitação',
    shortLabel: 'Digitação',
    note: 'Recuperação escrita para consolidar tradução.',
    icon: Keyboard,
  },
  {
    id: 'matching',
    label: 'Combinação',
    shortLabel: 'Associação',
    note: 'Associação visual para ganhar velocidade de recall.',
    icon: Puzzle,
  },
  {
    id: 'listening',
    label: 'Escuta',
    shortLabel: 'Escuta',
    note: 'Treino auditivo: ouça e digite a tradução.',
    icon: Headphones,
  },
  {
    id: 'speaking',
    label: 'Fala',
    shortLabel: 'Fala',
    note: 'Pronúncia e fluência com feedback imediato.',
    icon: Mic,
  },
]

export const gameModeConfig = Object.fromEntries(
  GAME_MODE_OPTIONS.map((option) => [option.id, { label: option.shortLabel }])
) as Record<GameMode, { label: string }>

export function isPlayableGameMode(value: string): value is GameMode {
  return PLAYABLE_GAME_MODES.includes(value as GameMode)
}

export function getGameModeOption(mode: string) {
  return GAME_MODE_OPTIONS.find((option) => option.id === mode) ?? GAME_MODE_OPTIONS[0]
}