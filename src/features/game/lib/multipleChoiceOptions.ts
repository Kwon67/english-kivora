import { shuffleArrayDeterministic } from '../../../lib/utils'
import type { Card } from '../../../types/database.types'

export const MULTIPLE_CHOICE_WRONG_OPTIONS_COUNT = 3

type DistractorKind = 'deck' | 'micro'

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

/** Pontuação das trocas semânticas limitadas. */
const MICRO_TRAP_SCORE = 94


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

/** Use at most one limited semantic swap, then existing deck phrases. Never pad a short deck. */
function pickDistractors(candidates: DistractorCandidate[], count: number) {
  const byScore = (left: DistractorCandidate, right: DistractorCandidate) => right.score - left.score
  const micro = candidates.filter((candidate) => candidate.kind === 'micro' && candidate.score >= MICRO_TRAP_SCORE).sort(byScore)
  const deck = candidates.filter((candidate) => candidate.kind === 'deck').sort(byScore)
  const ordered = uniqueCandidates([...micro.slice(0, 1), ...deck])
  return ordered.slice(0, count)
}

export function buildMultipleChoiceOptions(
  card: Card,
  allCards: Card[],
  wrongOptionsCount = MULTIPLE_CHOICE_WRONG_OPTIONS_COUNT
) {
  const correctTranslation = getPortugueseTranslation(card)
  if (!correctTranslation) return []
  const blockedOptions = new Set([
    normalizeOption(correctTranslation),
    ...(card.accepted_translations || []).map(normalizeOption),
  ])
  const otherCards = allCards.filter((item) => item.id !== card.id)
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
    ...buildMicroDistractors(correctTranslation, blockedOptions)
  )

  const wrongOptions = pickDistractors(uniqueCandidates(candidates), wrongOptionsCount).map((candidate) => candidate.text)

  return shuffleArrayDeterministic([correctTranslation, ...wrongOptions], card.id)
}
