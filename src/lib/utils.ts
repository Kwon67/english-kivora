import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const PORTUGUESE_FILLER_WORDS = new Set([
  'a',
  'as',
  'ao',
  'aos',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'ou',
  'para',
  'por',
  'pra',
  'pro',
  'um',
  'uma',
  'uns',
  'umas',
])

const PORTUGUESE_MEANING_ALIAS_GROUPS = [
  ['com licenca', 'licenca', 'desculpe', 'desculpa', 'perdao'],
  ['oi', 'ola'],
  ['tchau', 'adeus', 'ate logo', 'ate mais'],
  ['por favor', 'faz favor'],
  ['obrigado', 'obrigada', 'valeu'],
]

export type TypingAnswerMatchKind = 'exact' | 'partial' | 'wrong'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function normalizeMeaningText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9\s/|;(),-]/g, ' ')
    .replace(/[-/|;(),]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildMeaningVariants(value: string): string[] {
  const sources = new Set<string>([
    value,
    value.replace(/\([^)]*\)/g, ' '),
  ])
  const variants = new Set<string>()

  for (const source of sources) {
    const normalizedSource = normalizeMeaningText(source)
    if (normalizedSource) variants.add(normalizedSource)

    for (const part of source.split(/\s*(?:\/|\||;|,|\bou\b)\s*/i)) {
      const normalizedPart = normalizeMeaningText(part)
      if (normalizedPart) variants.add(normalizedPart)
    }
  }

  return [...variants]
}

function expandMeaningAliases(variants: string[]): string[] {
  const expandedVariants = new Set(variants)

  for (const group of PORTUGUESE_MEANING_ALIAS_GROUPS) {
    if (group.some((member) => expandedVariants.has(member))) {
      for (const member of group) {
        expandedVariants.add(member)
      }
    }
  }

  return [...expandedVariants]
}

function extractMeaningTokens(value: string): string[] {
  return normalizeMeaningText(value)
    .split(' ')
    .filter((token) => token && !PORTUGUESE_FILLER_WORDS.has(token))
}

function tokensMatch(inputToken: string, correctToken: string): boolean {
  if (inputToken === correctToken) return true

  if (inputToken.length < 4 || correctToken.length < 4) {
    return false
  }

  return isCloseEnough(inputToken, correctToken)
}

function isMeaningEquivalent(input: string, correct: string): boolean {
  const normalizedInput = normalizeMeaningText(input)
  const normalizedCorrect = normalizeMeaningText(correct)

  if (!normalizedInput || !normalizedCorrect) return false

  if (
    normalizedInput.includes(normalizedCorrect) ||
    normalizedCorrect.includes(normalizedInput)
  ) {
    return Math.min(normalizedInput.length, normalizedCorrect.length) >= 5
  }

  const inputTokens = extractMeaningTokens(input)
  const correctTokens = extractMeaningTokens(correct)

  if (!inputTokens.length || !correctTokens.length) return false

  const matchedCorrectTokens = correctTokens.filter((token) =>
    inputTokens.some((inputToken) => tokensMatch(inputToken, token))
  )

  const matchedInputTokens = inputTokens.filter((token) =>
    correctTokens.some((correctToken) => tokensMatch(token, correctToken))
  )

  const matchedChars = matchedCorrectTokens.reduce((sum, token) => sum + token.length, 0)
  const shorterSideFullyMatched =
    matchedInputTokens.length === inputTokens.length ||
    matchedCorrectTokens.length === correctTokens.length
  const correctCoverage = matchedCorrectTokens.length / correctTokens.length
  const inputCoverage = matchedInputTokens.length / inputTokens.length

  return matchedChars >= 5 && (shorterSideFullyMatched || correctCoverage >= 0.6 || inputCoverage >= 0.6)
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
  const normalizedInput = normalizeMeaningText(input)
  const normalizedCorrect = normalizeMeaningText(correct)

  if (normalizedInput === normalizedCorrect) return true

  const distance = levenshteinDistance(normalizedInput, normalizedCorrect)
  const maxDistance = normalizedCorrect.length <= 4 ? 1 : 2

  return distance <= maxDistance
}

export function matchTypingAnswer(input: string, correct: string): TypingAnswerMatchKind {
  const normalizedInput = normalizeMeaningText(input)
  if (!normalizedInput) return 'wrong'

  const variants = buildMeaningVariants(correct)
  const expandedVariants = expandMeaningAliases(variants)

  if (variants.some((variant) => isCloseEnough(normalizedInput, variant))) {
    return 'exact'
  }

  if (
    expandedVariants.some(
      (variant) =>
        isCloseEnough(normalizedInput, variant) || isMeaningEquivalent(normalizedInput, variant)
    )
  ) {
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
