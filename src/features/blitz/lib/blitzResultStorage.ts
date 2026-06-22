import type { BlitzMiss } from '@/features/blitz/lib/blitzMisses'
import type { BlitzAiPackDraft } from '@/app/actions'

const STORAGE_KEY = 'kivora-blitz-result'
const STORAGE_TTL_MS = 2 * 60 * 60 * 1000

export type BlitzResultSnapshot = {
  score: number
  maxCombo: number
  cardsAnswered: number
  savedBest: number
  personalBest: number
  isNewRecord: boolean
  misses: BlitzMiss[]
  source?: 'standard' | 'ai'
  aiPack?: BlitzAiPackDraft | null
  savedAt?: string
  runRewards: {
    streakUpdated?: boolean
    unlockedBadges?: { name: string; icon_name: string | null }[]
    questsCompleted?: string[]
  } | null
}

export function saveBlitzResultSnapshot(snapshot: BlitzResultSnapshot) {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() }))
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function loadBlitzResultSnapshot(): BlitzResultSnapshot | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as BlitzResultSnapshot
    if (parsed.savedAt && Date.now() - new Date(parsed.savedAt).getTime() > STORAGE_TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
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
