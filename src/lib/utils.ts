import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcula a distância de Levenshtein entre duas strings.
 * Usada no modo Typing para tolerância a erros de digitação.
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Verifica se a resposta digitada está "perto o suficiente" da correta.
 * Tolerância: até 2 caracteres de diferença para strings longas.
 */
export function isCloseEnough(input: string, correct: string): boolean {
  const normalizedInput = input.trim().toLowerCase()
  const normalizedCorrect = correct.trim().toLowerCase()

  if (normalizedInput === normalizedCorrect) return true

  const distance = levenshteinDistance(normalizedInput, normalizedCorrect)
  const maxDistance = normalizedCorrect.length <= 4 ? 1 : 2

  return distance <= maxDistance
}

/**
 * Embaralha um array usando o algoritmo de Fisher-Yates.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
