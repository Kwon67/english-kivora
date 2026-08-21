import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { classifyTranslationAnswer } from '@/features/cards/lib/translationMatching'

/**
 * tailwind-merge only knows Tailwind's own utilities. Our design-system tokens
 * (`rounded-control`, `text-2xs`, `shadow-offset-*`) look like arbitrary strings to it,
 * so it does not know they conflict with `rounded-xl`, `text-sm` or `shadow-md` — and
 * `cn()` would keep BOTH, letting stylesheet order silently decide the winner.
 *
 * This bit us for real: a shadcn DialogContent ships `rounded-xl`, our override added
 * `rounded-container`, both survived the merge, and the panel rendered at 16px instead
 * of the intended 20px. Registering the tokens in their class groups makes the override
 * win the way every other Tailwind class does.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ['control', 'container'] }],
      'font-size': ['text-2xs'],
      shadow: [{ shadow: ['offset-sm', 'offset-md', 'offset-lg', 'offset-accent'] }],
    },
  },
})

export type TypingAnswerMatchKind = 'exact' | 'partial' | 'wrong'

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
  const normalizedInput = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9\s/|;(),-]/g, ' ')
    .replace(/[-/|;(),]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const normalizedCorrect = correct
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9\s/|;(),-]/g, ' ')
    .replace(/[-/|;(),]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (normalizedInput === normalizedCorrect) return true

  const distance = levenshteinDistance(normalizedInput, normalizedCorrect)
  const maxDistance = normalizedCorrect.length <= 4 ? 1 : 2

  return distance <= maxDistance
}

export function matchTypingAnswer(
  input: string,
  correct: string | string[]
): TypingAnswerMatchKind {
  const acceptedAnswers = Array.isArray(correct) ? correct : [correct]
  const result = classifyTranslationAnswer(input, acceptedAnswers)

  if (result === 'exact' || result === 'equivalent') {
    return 'exact'
  }

  if (result === 'close') {
    return 'partial'
  }

  return 'wrong'
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

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

/**
 * Embaralha de forma determinística para evitar hydration mismatch em SSR.
 */
export function shuffleArrayDeterministic<T>(array: T[], seed: string): T[] {
  return [...array]
    .map((item, index) => ({
      item,
      order: hashString(`${seed}:${index}:${String(item)}`),
    }))
    .sort((left, right) => left.order - right.order)
    .map(({ item }) => item)
}
