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
  priorityReviewCardIds?: string[]
  source?: 'standard' | 'ai'
  aiPack?: BlitzAiPackDraft | null
  savedAt?: string
  saveStatus?: 'pending' | 'saved' | 'failed'
  runRewards: {
    streakUpdated?: boolean
    unlockedBadges?: { name: string; icon_name: string | null }[]
    questsCompleted?: string[]
  } | null
}

export function saveBlitzResultSnapshot(userId: string, snapshot: BlitzResultSnapshot) {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() }))
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function loadBlitzResultSnapshot(userId: string): BlitzResultSnapshot | null {
  if (typeof window === 'undefined') return null

  try {
    // Older results contained no owner and cannot safely be restored to an account.
    sessionStorage.removeItem(STORAGE_KEY)
    const key = `${STORAGE_KEY}:${userId}`
    const raw = sessionStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as BlitzResultSnapshot
    const savedAt = Date.parse(parsed?.savedAt ?? '')
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > STORAGE_TTL_MS || !Array.isArray(parsed.misses) || !Number.isFinite(parsed.score)) {
      sessionStorage.removeItem(key)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function clearBlitzResultSnapshot(userId: string) {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(`${STORAGE_KEY}:${userId}`)
  } catch {
    // Ignore storage errors.
  }
}
