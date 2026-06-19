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

const PORTUGUESE_PHRASE_ALIAS_GROUPS = [
  ['com licenca', 'licenca', 'desculpe', 'desculpa', 'perdao'],
  ['oi', 'ola'],
  ['tchau', 'adeus', 'ate logo', 'ate mais'],
  ['por favor', 'faz favor'],
  ['obrigado', 'obrigada', 'valeu'],
  ['como vai', 'como esta', 'como voce esta', 'como vai voce', 'tudo bem', 'beleza'],
]

const PORTUGUESE_TOKEN_ALIAS_GROUPS = [
  ['esta', 'ta', 'tá', 'vai', 'bem'],
  ['voce', 'vc', 'tu', 'te'],
  ['oi', 'ola'],
  ['obrigado', 'obrigada', 'valeu'],
]

export type TranslationMatchKind = 'exact' | 'equivalent' | 'close' | 'wrong'

function levenshteinDistance(a: string, b: string): number {
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

export function normalizeTranslationText(value: string): string {
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

function buildTranslationVariants(value: string): string[] {
  const sources = new Set<string>([
    value,
    value.replace(/\([^)]*\)/g, ' '),
  ])
  const variants = new Set<string>()

  for (const source of sources) {
    const normalizedSource = normalizeTranslationText(source)
    if (normalizedSource) variants.add(normalizedSource)

    for (const part of source.split(/\s*(?:\/|\||;|\bou\b)\s*/i)) {
      const normalizedPart = normalizeTranslationText(part)
      if (normalizedPart) variants.add(normalizedPart)
    }
  }

  return [...variants]
}

function expandPhraseAliases(variants: string[]): string[] {
  const expandedVariants = new Set(variants)

  for (const group of PORTUGUESE_PHRASE_ALIAS_GROUPS) {
    if (group.some((member) => expandedVariants.has(member))) {
      for (const member of group) {
        expandedVariants.add(member)
      }
    }
  }

  return [...expandedVariants]
}

function extractMeaningTokens(value: string): string[] {
  return normalizeTranslationText(value)
    .split(' ')
    .filter((token) => token && !PORTUGUESE_FILLER_WORDS.has(token))
}

function shareTokenAlias(left: string, right: string): boolean {
  if (left === right) return true

  return PORTUGUESE_TOKEN_ALIAS_GROUPS.some(
    (group) => group.includes(left) && group.includes(right)
  )
}

function isCloseEnoughToken(inputToken: string, correctToken: string): boolean {
  if (inputToken === correctToken) return true
  if (shareTokenAlias(inputToken, correctToken)) return true

  if (inputToken.length < 3 || correctToken.length < 3) {
    return false
  }

  const distance = levenshteinDistance(inputToken, correctToken)
  const maxDistance = Math.min(inputToken.length, correctToken.length) <= 4 ? 1 : 2

  return distance <= maxDistance
}

function isCloseEnoughPhrase(input: string, correct: string): boolean {
  const normalizedInput = normalizeTranslationText(input)
  const normalizedCorrect = normalizeTranslationText(correct)

  if (!normalizedInput || !normalizedCorrect) return false
  if (normalizedInput === normalizedCorrect) return true

  const distance = levenshteinDistance(normalizedInput, normalizedCorrect)
  const maxDistance = normalizedCorrect.length <= 4 ? 1 : 2

  return distance <= maxDistance
}

export function areTranslationsEquivalent(input: string, correct: string): boolean {
  const normalizedInput = normalizeTranslationText(input)
  const normalizedCorrect = normalizeTranslationText(correct)

  if (!normalizedInput || !normalizedCorrect) return false
  if (normalizedInput === normalizedCorrect) return true

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
    inputTokens.some((inputToken) => isCloseEnoughToken(inputToken, token))
  )

  const matchedInputTokens = inputTokens.filter((token) =>
    correctTokens.some((correctToken) => isCloseEnoughToken(token, correctToken))
  )

  const matchedChars = matchedCorrectTokens.reduce((sum, token) => sum + token.length, 0)
  const shorterSideFullyMatched =
    matchedInputTokens.length === inputTokens.length ||
    matchedCorrectTokens.length === correctTokens.length
  const correctCoverage = matchedCorrectTokens.length / correctTokens.length
  const inputCoverage = matchedInputTokens.length / inputTokens.length

  return (
    matchedChars >= 5 &&
    (shorterSideFullyMatched || correctCoverage >= 0.6 || inputCoverage >= 0.6)
  )
}

export function classifyTranslationAnswer(
  input: string,
  acceptedAnswers: string[]
): TranslationMatchKind {
  const normalizedInput = normalizeTranslationText(input)
  if (!normalizedInput) return 'wrong'

  const variants = expandPhraseAliases(
    acceptedAnswers.flatMap((answer) => buildTranslationVariants(answer))
  )

  if (variants.some((variant) => normalizedInput === variant)) {
    return 'exact'
  }

  if (variants.some((variant) => areTranslationsEquivalent(normalizedInput, variant))) {
    return 'equivalent'
  }

  if (variants.some((variant) => isCloseEnoughPhrase(normalizedInput, variant))) {
    return 'close'
  }

  return 'wrong'
}

export function isAcceptedTranslationAnswer(
  input: string,
  acceptedAnswers: string[]
): boolean {
  const result = classifyTranslationAnswer(input, acceptedAnswers)
  return result === 'exact' || result === 'equivalent'
}