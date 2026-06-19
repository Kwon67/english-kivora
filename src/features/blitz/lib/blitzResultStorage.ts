import type { BlitzMiss } from '@/features/blitz/lib/blitzMisses'

const STORAGE_KEY = 'kivora-blitz-result'

export type BlitzResultSnapshot = {
  score: number
  maxCombo: number
  cardsAnswered: number
  savedBest: number
  personalBest: number
  isNewRecord: boolean
  misses: BlitzMiss[]
  runRewards: {
    streakUpdated?: boolean
    unlockedBadges?: { name: string; icon_name: string | null }[]
    questsCompleted?: string[]
  } | null
}

export function saveBlitzResultSnapshot(snapshot: BlitzResultSnapshot) {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function loadBlitzResultSnapshot(): BlitzResultSnapshot | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    return JSON.parse(raw) as BlitzResultSnapshot
  } catch {
    return null
  }
}

export function clearBlitzResultSnapshot() {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors.
  }
}