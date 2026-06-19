import type { GameMode } from '@/types/database.types'

export const BLITZ_GAME_MODES = [
  'multiple_choice',
  'typing',
  'matching',
  'speaking',
] as const satisfies readonly GameMode[]

export type BlitzGameMode = (typeof BLITZ_GAME_MODES)[number]

export const DEFAULT_BLITZ_MODE: BlitzGameMode = 'multiple_choice'

export function pickRandomBlitzMode(): BlitzGameMode {
  const index = Math.floor(Math.random() * BLITZ_GAME_MODES.length)
  return BLITZ_GAME_MODES[index]
}

export function getBlitzModeLabel(mode: BlitzGameMode): string {
  const labels: Record<BlitzGameMode, string> = {
    multiple_choice: 'Múltipla escolha',
    typing: 'Digitação',
    matching: 'Combinação',
    speaking: 'Fala',
  }
  return labels[mode]
}