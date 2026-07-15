import { buildMultipleChoiceOptions } from '@/features/game/lib/multipleChoiceOptions'
import {
  CAT_LEVELS,
  catLevelIndex,
  type CatLevel,
} from '@/features/onboarding/lib/catLevels'
import { normalizePackLevel } from '@/features/cefr/lib/cefrLevels'
import type { Card } from '@/types/database.types'

export type CatPoolCard = {
  id: string
  packId: string
  packLevel: CatLevel
  englishPhrase: string
  portugueseTranslation: string
  acceptedTranslations: string[]
}

export type CatQuestionDirection = 'english-to-portuguese' | 'portuguese-to-english'

export type CatQuestion = {
  cardId: string
  packId: string
  packLevel: CatLevel
  prompt: string
  options: string[]
  correctOption: string
  questionIndex: number
  direction: CatQuestionDirection
  instruction: string
}

type PackRow = {
  id: string
  name: string
  category: string | null
  level: string | null
  is_public?: boolean | null
}

type CardRow = {
  id: string
  pack_id: string | null
  english_phrase: string
  portuguese_translation: string
  accepted_translations: string[]
}

export function isManualCatPack(pack: PackRow): boolean {
  if (pack.name.startsWith('IA:')) return false
  if (pack.category === 'Blitz IA') return false
  if (pack.is_public === false) return false

  const normalized = normalizePackLevel(pack.level)
  return CAT_LEVELS.includes(normalized as CatLevel)
}

export function toCatPoolCard(card: CardRow, packLevel: CatLevel): CatPoolCard | null {
  if (!card.pack_id) return null

  return {
    id: card.id,
    packId: card.pack_id,
    packLevel,
    englishPhrase: card.english_phrase,
    portugueseTranslation: card.portuguese_translation,
    acceptedTranslations: card.accepted_translations ?? [],
  }
}

export function buildCatPool(
  packs: PackRow[],
  cards: CardRow[]
): CatPoolCard[] {
  const packLevelById = new Map<string, CatLevel>()

  for (const pack of packs) {
    if (!isManualCatPack(pack)) continue
    const level = normalizePackLevel(pack.level) as CatLevel
    if (!CAT_LEVELS.includes(level)) continue
    packLevelById.set(pack.id, level)
  }

  const pool: CatPoolCard[] = []
  const seenPhrases = new Set<string>()

  for (const card of cards) {
    if (!card.pack_id) continue
    const packLevel = packLevelById.get(card.pack_id)
    if (!packLevel) continue

    const phraseKey = card.english_phrase.trim().toLowerCase()
    if (seenPhrases.has(phraseKey)) continue
    seenPhrases.add(phraseKey)

    const poolCard = toCatPoolCard(card, packLevel)
    if (poolCard) pool.push(poolCard)
  }

  return pool
}

function pickCardForLevel(
  pool: CatPoolCard[],
  focusLevel: CatLevel,
  shownCardIds: Set<string>
): CatPoolCard | null {
  const focusIndex = catLevelIndex(focusLevel)

  for (let offset = 0; offset < CAT_LEVELS.length; offset += 1) {
    for (const direction of [0, -1, 1]) {
      if (direction === 0 && offset > 0) continue

      const index =
        direction === 0
          ? focusIndex
          : Math.max(0, Math.min(CAT_LEVELS.length - 1, focusIndex + direction * offset))

      const targetLevel = CAT_LEVELS[index]
      const candidates = pool.filter(
        (card) => card.packLevel === targetLevel && !shownCardIds.has(card.id)
      )

      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)]
      }
    }
  }

  return pool.find((card) => !shownCardIds.has(card.id)) ?? null
}

export function buildCatQuestion(
  pool: CatPoolCard[],
  focusLevel: CatLevel,
  shownCardIds: string[],
  questionIndex: number
): CatQuestion | null {
  const card = pickCardForLevel(pool, focusLevel, new Set(shownCardIds))
  if (!card) return null

  const asCards: Card[] = pool.map((item) => ({
    id: item.id,
    pack_id: item.packId,
    english_phrase: item.englishPhrase,
    portuguese_translation: item.portugueseTranslation,
    accepted_translations: item.acceptedTranslations,
    audio_url: null,
    created_at: '',
  }))

  const targetCard = asCards.find((item) => item.id === card.id)
  if (!targetCard) return null

  const direction = getCatQuestionDirection(questionIndex)
  const reverseDirection = direction === 'portuguese-to-english'
  const options = reverseDirection
    ? buildEnglishOptions(card, pool)
    : buildMultipleChoiceOptions(targetCard, asCards)
  const correctOption = reverseDirection ? card.englishPhrase : card.portugueseTranslation

  return {
    cardId: card.id,
    packId: card.packId,
    packLevel: card.packLevel,
    prompt: reverseDirection ? card.portugueseTranslation : card.englishPhrase,
    options,
    correctOption,
    questionIndex,
    direction,
    instruction: reverseDirection
      ? 'Escolha a frase equivalente em inglês.'
      : 'Escolha o significado mais natural em português.',
  }
}

export function getCatQuestionDirection(questionIndex: number): CatQuestionDirection {
  return questionIndex % 3 === 0 ? 'portuguese-to-english' : 'english-to-portuguese'
}

function shuffleOptions<T>(options: T[]): T[] {
  const shuffled = [...options]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function buildEnglishOptions(card: CatPoolCard, pool: CatPoolCard[]): string[] {
  const candidates = [
    ...pool.filter((item) => item.packLevel === card.packLevel),
    ...pool.filter((item) => item.packLevel !== card.packLevel),
  ]
  const unique = new Map<string, string>()
  unique.set(card.englishPhrase.trim().toLowerCase(), card.englishPhrase)

  for (const candidate of shuffleOptions(candidates)) {
    const phrase = candidate.englishPhrase.trim()
    if (!phrase) continue
    unique.set(phrase.toLowerCase(), phrase)
    if (unique.size >= 4) break
  }

  return shuffleOptions([...unique.values()])
}

export function isCatAnswerCorrect(
  card: CatPoolCard,
  selectedOption: string,
  direction: CatQuestionDirection = 'english-to-portuguese'
): boolean {
  const normalized = selectedOption.trim().toLowerCase()
  if (direction === 'portuguese-to-english') {
    return normalized === card.englishPhrase.trim().toLowerCase()
  }

  const accepted = new Set(
    [card.portugueseTranslation, ...card.acceptedTranslations]
      .filter(Boolean)
      .map((value) => value.trim().toLowerCase())
  )

  return accepted.has(normalized)
}
