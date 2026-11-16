import { normalizePackLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { stageGuidance } from '@/features/curriculum/lib/curriculumDifficulty'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import { normalizeSpeechPhrase } from '@/features/game/lib/speech-scoring'
import type { CardSignal } from '@/features/learning/lib/cardIntelligence'
import { BLITZ_DIALOGUE_PHRASES, blitzVerbPackPriority } from './blitzDialogue'
import { blitzLevelCeiling, isPackLevelInScope } from './blitzLevelScope'

export function blitzPhraseWordCount(phrase: string) {
  return phrase.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu)?.length ?? 0
}

export function isSuitableNewBlitzPhrase(phrase: string, level: LearnerCefrLevel) {
  const words = blitzPhraseWordCount(phrase)
  if (words === 0 || words > stageGuidance(level, 'development').maxWords) return false
  if (level !== 'A1' && level !== 'A2') return true

  const normalized = normalizeSpeechPhrase(phrase)
  if (/\b(?:had been|(?:would|could|should|might) have|(?:have|has) been [a-z]+ing)\b/.test(normalized)) return false
  return level === 'A2' || !/\b(?:have|has) (?:been|gone|done|seen|had|known|already|just|ever|never)\b/.test(normalized)
}

/** Keep the existing relevance order, except for the warm-up and the pacing of new phrases. */
export function buildBalancedBlitzDeck<T extends { id: string; english_phrase: string }>(
  cards: T[],
  signals: ReadonlyMap<string, CardSignal>,
  level: LearnerCefrLevel | null,
  limit: number,
) {
  const introductory = ['A1', 'A2', 'B1'].includes(blitzLevelCeiling(level))
  const dialogue = new Set<string>(BLITZ_DIALOGUE_PHRASES)
  const phrases = new Set<string>()
  const familiar: T[] = []
  const novel: T[] = []
  for (const card of cards) {
    const signal = signals.get(card.id)
    if (!isPackLevelInScope(signal?.packLevel, level)) continue
    const phrase = card.english_phrase.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    if (!phrase || phrases.has(phrase)) continue

    if (signal && !signal.isNew) {
      familiar.push(card)
    } else if ((!introductory || dialogue.has(card.english_phrase)) &&
      isSuitableNewBlitzPhrase(card.english_phrase, normalizePackLevel(signal?.packLevel))) {
      novel.push(card)
    } else {
      continue
    }
    phrases.add(phrase)
  }

  const words = (card: T) => blitzPhraseWordCount(card.english_phrase)
  novel.sort((a, b) => words(a) - words(b))
  const recentlyMissed = (card: T) => {
    const signal = signals.get(card.id)
    return Boolean(signal && (signal.recentErrors > 0 || (signal.lastGrade === REVIEW_GRADE.AGAIN && signal.daysSinceSeen < 1)))
  }
  const steady = familiar.filter(card => !recentlyMissed(card))
  const warmupRank = steady.map(card => {
    const signal = signals.get(card.id)
    const packPriority = introductory ? blitzVerbPackPriority(signal?.packName) : 0
    const toBe = packPriority > 0 && /\b(?:am|is|are|was|were)\b/.test(normalizeSpeechPhrase(card.english_phrase))
    return { card, lapses: signal?.lapses ?? 0, priority: packPriority + (toBe ? 2 : 0), wordCount: words(card) }
  })
  const opening = warmupRank.sort((a, b) => a.lapses - b.lapses || b.priority - a.priority || a.wordCount - b.wordCount)
    .slice(0, 4).map(item => item.card)
  const openingIds = new Set(opening.map(card => card.id))
  const remainder = [
    ...steady.filter(card => !openingIds.has(card.id)),
    ...familiar.filter(recentlyMissed),
  ]
  const deck = opening.slice(0, limit)
  const newCardIds: string[] = []

  let familiarIndex = 0
  let novelIndex = 0
  while (deck.length < limit && (familiarIndex < remainder.length || novelIndex < novel.length)) {
    const regularCardsLeft = familiarIndex < steady.length - opening.length
    const canIntroduce = deck.length < 4 ? !regularCardsLeft : deck.length % 4 === 0
    if (novelIndex < novel.length && (canIntroduce || familiarIndex >= remainder.length)) {
      const card = novel[novelIndex++]
      deck.push(card)
      newCardIds.push(card.id)
    } else {
      deck.push(remainder[familiarIndex++])
    }
  }
  return { cards: deck, newCardIds }
}
