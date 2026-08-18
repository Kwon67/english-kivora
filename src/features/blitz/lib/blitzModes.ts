import type { GameMode } from '@/types/database.types'

export const BLITZ_GAME_MODES = [
  'multiple_choice',
  'typing',
  'matching',
  'speaking',
  'listening',
] as const satisfies readonly GameMode[]

export type BlitzGameMode = (typeof BLITZ_GAME_MODES)[number]

export const DEFAULT_BLITZ_MODE: BlitzGameMode = 'multiple_choice'

const BLITZ_MODE_WEIGHTS: Record<BlitzGameMode, number> = {
  multiple_choice: 30,
  typing: 25,
  matching: 20,
  speaking: 15,
  listening: 10,
}

export function pickRandomBlitzMode(): BlitzGameMode {
  const totalWeight = BLITZ_GAME_MODES.reduce((sum, mode) => sum + BLITZ_MODE_WEIGHTS[mode], 0)
  let roll = Math.random() * totalWeight

  for (const mode of BLITZ_GAME_MODES) {
    roll -= BLITZ_MODE_WEIGHTS[mode]
    if (roll <= 0) return mode
  }

  return DEFAULT_BLITZ_MODE
}

export function getBlitzModeLabel(mode: BlitzGameMode): string {
  const labels: Record<BlitzGameMode, string> = {
    multiple_choice: 'Múltipla escolha',
    typing: 'Digitação',
    matching: 'Combinação',
    speaking: 'Fala',
    listening: 'Escuta',
  }
  return labels[mode]
}

/**
 * One-word labels for the in-game HUD strip, where "Múltipla escolha" truncates to
 * "Múltipla escol…" on a phone. Use getBlitzModeLabel anywhere with room for the full name.
 */
export function getBlitzModeShortLabel(mode: BlitzGameMode): string {
  const labels: Record<BlitzGameMode, string> = {
    multiple_choice: 'Escolha',
    typing: 'Digitação',
    matching: 'Combinação',
    speaking: 'Fala',
    listening: 'Escuta',
  }
  return labels[mode]
}