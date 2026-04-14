// SM-2 Spaced Repetition Algorithm (Anki's algorithm)
// Based on: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

export interface CardReview {
  id: string
  user_id: string
  card_id: string
  pack_id: string
  review_date: string
  next_review_date: string
  interval_days: number
  ease_factor: number
  repetitions: number
  quality: number
  total_reviews: number
}

export interface ReviewResult {
  intervalDays: number
  easeFactor: number
  repetitions: number
  nextReviewDate: Date
}

/**
 * Calculate the next review date using SM-2 algorithm
 * @param quality - 0-5 rating (0=Blackout, 1=Wrong, 2=Hard, 3=Good, 4=Easy, 5=Perfect)
 * @param previousInterval - Previous interval in days
 * @param previousEaseFactor - Previous ease factor
 * @param repetitions - Number of successful reviews
 */
export function calculateNextReview(
  quality: number,
  previousInterval: number,
  previousEaseFactor: number,
  repetitions: number
): ReviewResult {
  // Minimum quality threshold is 3 (Good)
  // If quality < 3, reset repetitions and keep interval at 1 day
  
  let newRepetitions: number
  let newInterval: number
  let newEaseFactor: number
  
  if (quality < 3) {
    // Failed review - reset
    newRepetitions = 0
    newInterval = 1
    newEaseFactor = Math.max(1.3, previousEaseFactor - 0.2)
  } else {
    // Successful review
    newRepetitions = repetitions + 1
    
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(previousInterval * previousEaseFactor)
    }
    
    // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const easeChange = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    newEaseFactor = Math.max(1.3, previousEaseFactor + easeChange)
  }
  
  // Cap interval at 365 days (1 year)
  newInterval = Math.min(newInterval, 365)
  
  // Calculate next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)
  
  return {
    intervalDays: newInterval,
    easeFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimals
    repetitions: newRepetitions,
    nextReviewDate
  }
}

/**
 * Get quality label for display
 */
export function getQualityLabel(quality: number): string {
  const labels: Record<number, string> = {
    0: 'Blackout',
    1: 'Wrong',
    2: 'Hard',
    3: 'Good',
    4: 'Easy',
    5: 'Perfect'
  }
  return labels[quality] || 'Good'
}

/**
 * Get quality button color
 */
export function getQualityColor(quality: number): string {
  const colors: Record<number, string> = {
    0: 'bg-red-600 hover:bg-red-700',
    1: 'bg-red-500 hover:bg-red-600',
    2: 'bg-[var(--color-primary)] hover:bg-[rgb(31,95,8)]',
    3: 'bg-[var(--color-primary-light)] hover:bg-[rgba(223,236,205,0.88)]',
    4: 'bg-[rgba(43,122,11,0.18)] hover:bg-[rgba(43,122,11,0.24)]',
    5: 'bg-[rgba(43,122,11,0.28)] hover:bg-[rgba(43,122,11,0.34)]'
  }
  return colors[quality] || 'bg-blue-500'
}

/**
 * Format relative time (e.g., "in 2 days", "tomorrow")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 30) return `${diffDays} days`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
  return `${Math.floor(diffDays / 365)} years`
}

/**
 * Get initial review data for a new card
 */
export function getInitialReview(): ReviewResult {
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + 1) // Review tomorrow
  
  return {
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate
  }
}
