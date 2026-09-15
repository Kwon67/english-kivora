import { shuffleArrayDeterministic } from '../../../lib/utils'
import type { Card } from '../../../types/database.types'

export const MULTIPLE_CHOICE_WRONG_OPTIONS_COUNT = 3

type DistractorKind = 'deck' | 'hybrid' | 'micro'

type DistractorCandidate = {
  kind: DistractorKind
  score: number
  text: string
}

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

const PORTUGUESE_CONNECTORS = new Set(['da', 'das', 'de', 'do', 'dos'])

/**
 * Trocas de UMA palavra que mantêm a frase gramatical e mudam o sentido — o distrator ideal:
 * quem não leu o inglês com atenção cai; quem leu, não.
 *
 * Duas famílias foram REMOVIDAS daqui porque produziam português impossível, e um falante nativo
 * as eliminava sem olhar o inglês: `não → sim` ("Eu sim sei", "Ela sim fala português") e
 * `eu ↔ você` ("Você não quero nada", "Eu não está atrasado" — o verbo não concorda). Medido no
 * pack "Dizendo não": 19 dos 36 distratores eram agramaticais, ou seja, a questão de quatro
 * opções era na prática de duas.
 */
const MICRO_TRAPS: Array<{ from: string; to: string }> = [
  { from: 'sempre', to: 'nunca' },
  { from: 'nunca', to: 'sempre' },
  { from: 'com', to: 'sem' },
  { from: 'sem', to: 'com' },
  { from: 'antes', to: 'depois' },
  { from: 'depois', to: 'antes' },
  { from: 'hoje', to: 'amanhã' },
  { from: 'amanha', to: 'hoje' },
  { from: 'ontem', to: 'hoje' },
  { from: 'meu', to: 'seu' },
  { from: 'seu', to: 'meu' },
  { from: 'minha', to: 'sua' },
  { from: 'sua', to: 'minha' },
  { from: 'nosso', to: 'seu' },
  { from: 'nossa', to: 'sua' },
  { from: 'posso', to: 'devo' },
  { from: 'devo', to: 'posso' },
  { from: 'melhor', to: 'pior' },
  { from: 'pior', to: 'melhor' },
  // Fora também: `quero/gosto → preciso` ("Eu não preciso nada" — "preciso" pede "de") e
  // `mais ↔ menos` ("não moram MAIS aqui" é "anymore", e "moram menos aqui" não é frase).
]

/** Pontuação das trocas semânticas; os prefixos de fallback usam valores menores para nunca passar por elas. */
const MICRO_TRAP_SCORE = 94

const FALLBACK_TRAP_PREFIXES = ['Não', 'Talvez', 'Quase']
const FALLBACK_TRAP_SUFFIXES = ['agora', 'hoje', 'também']

function getPortugueseTranslation(card: Card) {
  return sanitizeOption(card.portuguese_translation || card.pt || '')
}

function getEnglishPhrase(card: Card) {
  return sanitizeOption(card.english_phrase || card.en || '')
}

function sanitizeOption(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeOption(value: string) {
  return sanitizeOption(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function tokenize(value: string) {
  const normalized = normalizeOption(value)
  return normalized ? normalized.split(' ') : []
}

function getContentTokens(value: string) {
  return tokenize(value).filter((token) => !PORTUGUESE_FILLER_WORDS.has(token))
}

function splitWords(value: string) {
  return sanitizeOption(value).split(' ').filter(Boolean)
}

function contentIndexes(words: string[]) {
  return words
    .map((word, index) => ({ index, normalized: normalizeToken(word) }))
    .filter(({ normalized }) => normalized && !PORTUGUESE_FILLER_WORDS.has(normalized))
}

function overlapScore(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0

  const rightTokens = new Set(right)
  return left.filter((token) => rightTokens.has(token)).length
}

function scoreDeckDistractor(currentCard: Card, candidateCard: Card, correctTranslation: string) {
  const currentEnglish = tokenize(getEnglishPhrase(currentCard))
  const candidateEnglish = tokenize(getEnglishPhrase(candidateCard))
  const correctPortuguese = getContentTokens(correctTranslation)
  const candidatePortuguese = getContentTokens(getPortugueseTranslation(candidateCard))
  const englishOverlap = overlapScore(currentEnglish, candidateEnglish)
  const portugueseOverlap = overlapScore(correctPortuguese, candidatePortuguese)
  const lengthCloseness = Math.max(0, 24 - Math.abs(correctTranslation.length - getPortugueseTranslation(candidateCard).length))
  const tokenCloseness = Math.max(0, 8 - Math.abs(tokenize(correctTranslation).length - tokenize(getPortugueseTranslation(candidateCard)).length) * 2)

  return 42 + englishOverlap * 18 + portugueseOverlap * 20 + lengthCloseness + tokenCloseness
}

function isAllowedOption(text: string, blockedOptions: Set<string>) {
  const normalized = normalizeOption(text)
  return Boolean(normalized && !blockedOptions.has(normalized))
}

function addCandidate(
  candidates: DistractorCandidate[],
  blockedOptions: Set<string>,
  text: string,
  kind: DistractorKind,
  score: number
) {
  const option = sanitizeOption(text)
  if (!isAllowedOption(option, blockedOptions)) return

  candidates.push({
    kind,
    score,
    text: option,
  })
}

function replaceWord(words: string[], index: number, replacement: string) {
  const nextWords = [...words]
  // A pontuação pertence à posição, não à palavra: "hoje." vira "amanhã.", não "amanhã".
  const trailing = (words[index] || '').match(/[.,!?;:]+$/)?.[0] ?? ''
  nextWords[index] = replacement.replace(/[.,!?;:]+$/, '') + trailing
  return nextWords.join(' ')
}

function usesCompatibleConnector(words: string[], targetIndex: number, donorWords: string[], donorIndex: number) {
  const targetPrevious = normalizeToken(words[targetIndex - 1] || '')
  const donorPrevious = normalizeToken(donorWords[donorIndex - 1] || '')
  return PORTUGUESE_CONNECTORS.has(targetPrevious) === PORTUGUESE_CONNECTORS.has(donorPrevious)
}

function buildHybridDistractors(correctTranslation: string, donorTranslations: string[], blockedOptions: Set<string>) {
  const candidates: DistractorCandidate[] = []
  const correctWords = splitWords(correctTranslation)
  const correctContent = contentIndexes(correctWords)

  if (correctContent.length === 0) return candidates

  for (const donorTranslation of donorTranslations) {
    const donorWords = splitWords(donorTranslation)
    const donorContent = contentIndexes(donorWords)

    if (donorContent.length === 0) continue

    for (const [contentOffset, correctItem] of correctContent.entries()) {
      const preferredDonor = donorContent[contentOffset] || donorContent[donorContent.length - 1]
      if (!preferredDonor) continue

      const donorWord = donorWords[preferredDonor.index]
      if (!donorWord || normalizeToken(donorWord) === correctItem.normalized) continue
      if (!usesCompatibleConnector(correctWords, correctItem.index, donorWords, preferredDonor.index)) continue

      addCandidate(
        candidates,
        blockedOptions,
        replaceWord(correctWords, correctItem.index, donorWord),
        'hybrid',
        88 - Math.abs(correctItem.index - preferredDonor.index) * 3
      )
    }

    const correctFirst = correctContent[0]
    const donorFirst = donorContent[0]
    if (!correctFirst || !donorFirst) continue

    const correctTail = correctWords.slice(correctFirst.index + 1).join(' ')
    const donorTail = donorWords.slice(donorFirst.index + 1).join(' ')

    if (correctTail && donorWords[donorFirst.index]) {
      addCandidate(
        candidates,
        blockedOptions,
        `${donorWords[donorFirst.index]} ${correctTail}`,
        'hybrid',
        84
      )
    }

    if (donorTail && correctWords[correctFirst.index]) {
      addCandidate(
        candidates,
        blockedOptions,
        `${correctWords[correctFirst.index]} ${donorTail}`,
        'hybrid',
        82
      )
    }
  }

  return candidates
}

function preserveCase(source: string, replacement: string) {
  if (source === source.toUpperCase()) return replacement.toUpperCase()
  if (source[0] === source[0]?.toUpperCase()) {
    return `${replacement[0]?.toUpperCase() || ''}${replacement.slice(1)}`
  }

  return replacement
}

function buildMicroDistractors(correctTranslation: string, blockedOptions: Set<string>) {
  const candidates: DistractorCandidate[] = []
  const correctWords = splitWords(correctTranslation)

  for (const { from, to } of MICRO_TRAPS) {
    const index = correctWords.findIndex((word) => normalizeToken(word) === from)
    if (index === -1) continue

    addCandidate(
      candidates,
      blockedOptions,
      replaceWord(correctWords, index, preserveCase(correctWords[index] || '', to)),
      'micro',
      MICRO_TRAP_SCORE
    )
  }

  return candidates
}

function buildFallbackDistractors(correctTranslation: string, blockedOptions: Set<string>) {
  const candidates: DistractorCandidate[] = []
  const lowerCorrect = `${correctTranslation[0]?.toLowerCase() || ''}${correctTranslation.slice(1)}`

  for (const prefix of FALLBACK_TRAP_PREFIXES) {
    addCandidate(candidates, blockedOptions, `${prefix} ${lowerCorrect}`, 'micro', 34)
  }

  for (const suffix of FALLBACK_TRAP_SUFFIXES) {
    addCandidate(candidates, blockedOptions, `${correctTranslation} ${suffix}`, 'micro', 30)
  }

  return candidates
}

function uniqueCandidates(candidates: DistractorCandidate[]) {
  const seen = new Set<string>()
  const unique: DistractorCandidate[] = []

  for (const candidate of candidates) {
    const normalized = normalizeOption(candidate.text)
    if (!normalized || seen.has(normalized)) continue

    seen.add(normalized)
    unique.push(candidate)
  }

  return unique
}

/**
 * Ordem de preferência: uma troca semântica (no máximo UMA), depois frases REAIS do deck, e só
 * então as mutações sintéticas (híbridas e prefixos), quando o deck não tem frases suficientes.
 *
 * Antes era o contrário — os dois melhores sintéticos entravam ANTES do deck em toda questão, e
 * era daí que vinham "Nós não temos problema. para isso" e "Isso não fala português". Uma frase
 * do deck é sempre português de verdade; a mutação, só às vezes. Com o deck na frente, a única
 * forma de acertar é entender o inglês.
 */
function pickDistractors(candidates: DistractorCandidate[], count: number) {
  const byScore = (left: DistractorCandidate, right: DistractorCandidate) => right.score - left.score
  const micro = candidates.filter((candidate) => candidate.kind === 'micro' && candidate.score >= MICRO_TRAP_SCORE).sort(byScore)
  const deck = candidates.filter((candidate) => candidate.kind === 'deck').sort(byScore)
  const synthetic = candidates
    .filter((candidate) => candidate.kind !== 'deck' && !micro.includes(candidate))
    .sort(byScore)

  const ordered = uniqueCandidates([...micro.slice(0, 1), ...deck, ...synthetic])
  return ordered.slice(0, count)
}

export function buildMultipleChoiceOptions(
  card: Card,
  allCards: Card[],
  wrongOptionsCount = MULTIPLE_CHOICE_WRONG_OPTIONS_COUNT
) {
  const correctTranslation = getPortugueseTranslation(card)
  const blockedOptions = new Set([
    normalizeOption(correctTranslation),
    ...(card.accepted_translations || []).map(normalizeOption),
  ])
  const otherCards = allCards.filter((item) => item.id !== card.id)
  const donorTranslations = otherCards.map(getPortugueseTranslation).filter(Boolean)
  const candidates: DistractorCandidate[] = []

  for (const otherCard of otherCards) {
    addCandidate(
      candidates,
      blockedOptions,
      getPortugueseTranslation(otherCard),
      'deck',
      scoreDeckDistractor(card, otherCard, correctTranslation)
    )
  }

  candidates.push(
    ...buildMicroDistractors(correctTranslation, blockedOptions),
    ...buildHybridDistractors(correctTranslation, donorTranslations, blockedOptions),
    ...buildFallbackDistractors(correctTranslation, blockedOptions)
  )

  const wrongOptions = pickDistractors(uniqueCandidates(candidates), wrongOptionsCount).map((candidate) => candidate.text)

  return shuffleArrayDeterministic([correctTranslation, ...wrongOptions], card.id)
}
