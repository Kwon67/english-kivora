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
/**
 * Multiplicadores por nota num card já graduado.
 *
 * O bug que isto corrige: o intervalo era `intervalo × ease ANTIGO` para qualquer nota que
 * passasse, então Difícil, Bom e Fácil devolviam exatamente o mesmo número — um card de 24 dias
 * com ease 2,5 mostrava "2 meses" nos três botões. O ease mudava, mas só valia para a revisão
 * seguinte; a que a pessoa estava decidindo agora era idêntica nas três.
 *
 * A correção segue o Anki: Difícil anda pouco por um fator fixo, Bom anda pelo ease, e Fácil
 * ganha um bônus por cima do ease. As três passam a ser distintas e ordenadas.
 */
export const HARD_INTERVAL_MULTIPLIER = 1.2
export const EASY_INTERVAL_BONUS = 1.3

export function calculateNextReview(
  quality: number,
  previousInterval: number,
  previousEaseFactor: number,
  repetitions: number
): ReviewResult {
  // A heurística de latência foi REMOVIDA, não desligada.
  //
  // Ela rebaixava a nota quando a resposta passava de 5 segundos, e nenhum chamador jamais passou
  // `latencyMs` — era código morto fingindo inteligência. Ligá-la seria pior que apagá-la: o
  // conteúdo aqui são frases inteiras, e ler "Sorry to keep you waiting, I really appreciate your
  // patience." já leva mais de 5 segundos para um brasileiro. O gatilho puniria quem lê com
  // atenção, não quem hesitou.
  //
  // Medir hesitação é uma ideia boa; o limite fixo aplicado a frases de tamanhos diferentes é que
  // não serve. Se voltar, que seja proporcional ao tamanho da frase e calibrado com dado real.
  const adjustedQuality = quality

  let newRepetitions: number
  let newInterval: number

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // Applied for every quality (0-5), so a total blackout (q=0) penalizes EF
  // far more than a near-miss (q=2) instead of both getting a flat -0.2.
  const easeChange = 0.1 - (5 - adjustedQuality) * (0.08 + (5 - adjustedQuality) * 0.02)
  const newEaseFactor = Math.max(1.3, previousEaseFactor + easeChange)

  if (adjustedQuality < 3) {
    // Failed review - reset
    newRepetitions = 0
    newInterval = 1
  } else {
    // Successful review
    newRepetitions = repetitions + 1

    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else if (adjustedQuality === 3) {
      // Difícil: passou, mas com esforço — anda pouco, independentemente do ease.
      newInterval = Math.round(previousInterval * HARD_INTERVAL_MULTIPLIER)
    } else if (adjustedQuality >= 5) {
      // Fácil: bônus por cima do ease.
      newInterval = Math.round(previousInterval * previousEaseFactor * EASY_INTERVAL_BONUS)
    } else {
      // Bom: o passo normal.
      newInterval = Math.round(previousInterval * previousEaseFactor)
    }

    // Um passo nunca pode encolher: mesmo com ease no piso, repetir o intervalo é melhor que
    // devolver um card graduado para antes de onde ele já estava.
    newInterval = Math.max(newInterval, previousInterval + 1)
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
    0: 'Esqueci',
    1: 'Errei',
    2: 'Difícil',
    3: 'Bom',
    4: 'Fácil',
    5: 'Perfeito'
  }
  return labels[quality] || 'Bom'
}

/**
 * Get quality button color
 */
export function getQualityColor(quality: number): string {
  const colors: Record<number, string> = {
    0: 'bg-red-600 hover:bg-red-700',
    1: 'bg-red-500 hover:bg-red-600',
    2: 'bg-brand-dark text-white hover:opacity-90',
    3: 'bg-bg-card text-brand-dark hover:bg-bg-primary',
    4: 'bg-brand-accent text-brand-dark hover:opacity-90',
    5: 'bg-brand-accent text-brand-dark hover:opacity-90'
  }
  return colors[quality] || 'bg-brand-dark text-white'
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
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate
  }
}
