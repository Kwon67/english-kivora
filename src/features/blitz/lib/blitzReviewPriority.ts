import { editDistance, matchEnglishAnswer } from '@/features/game/lib/englishAnswerMatching'
import { evaluateSpeakingAnswer } from '@/features/game/lib/speakingListening'
import { scoreSpeechTranscript } from '@/features/game/lib/speech-scoring'

export const BLITZ_PRIORITY_REVIEW_LIMIT = 3

export type BlitzReviewAttempt = {
  cardId: string
  mode: 'typing' | 'listening'
  answer: string
}

const ARTICLES = new Set(['a', 'an', 'the'])
const NEGATIONS = new Set(['not', 'cannot', 'no', 'never', 'nothing', 'nobody', 'none', 'neither', 'nor'])
const CONTRAST_GROUPS = [
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  ['train', 'bus', 'plane', 'ferry'],
  ['left', 'right'], ['before', 'after'], ['buy', 'sell'], ['open', 'close'],
  ['arrive', 'leave'], ['hot', 'cold'], ['morning', 'afternoon', 'evening', 'night'],
]
const affectsMeaning = (word: string) => NEGATIONS.has(word) || /\d/.test(word)

/** A wrong answer alone is not enough evidence to schedule an automatic review. */
export function isBlitzPriorityMiss(expected: string, attempt: BlitzReviewAttempt) {
  const expectedPhrase = expected.replace(/\bcan not\b/gi, 'cannot')
  const answer = attempt.answer.replace(/\bcan not\b/gi, 'cannot')
  if (matchEnglishAnswer(answer, expectedPhrase) !== 'wrong') return false
  if (attempt.mode === 'listening' && evaluateSpeakingAnswer({ expectedPhrase, transcript: answer })) return false

  const { normalizedTranscript, normalizedExpected, similarity, deletedWords, insertedWords, substitutedWords } =
    scoreSpeechTranscript(expectedPhrase, answer)

  // Ignore blank/punctuation-only attempts and differences limited to articles.
  if (!normalizedTranscript || !normalizedExpected) return false
  const missing = deletedWords.filter(word => !ARTICLES.has(word))
  const extra = insertedWords.filter(word => !ARTICLES.has(word))
  const substitutions = substitutedWords.filter(({ expected, transcript }) => !ARTICLES.has(expected) || !ARTICLES.has(transcript))
  if (
    [...missing, ...extra].some(affectsMeaning) ||
    substitutions.some(({ expected, transcript }) => affectsMeaning(expected) || affectsMeaning(transcript))
  ) return true

  // Single-letter slips and transposed letters are ambiguous, especially in short words.
  const clearSubstitutions = substitutions.filter(({ expected, transcript }) => editDistance(expected, transcript) > 1)
  if (missing.length + extra.length + clearSubstitutions.length >= 2 && similarity <= .6) return true
  return clearSubstitutions.some(({ expected, transcript }) =>
    CONTRAST_GROUPS.some(group => group.includes(expected) && group.includes(transcript)) ||
    (attempt.mode === 'listening' && expected.length >= 3 && transcript.length >= 3)
  )
}
