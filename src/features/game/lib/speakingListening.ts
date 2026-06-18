import {
  normalizeSpeechPhrase,
  scoreSpeechTranscript,
} from '@/features/arena/lib/speech-scoring'

export type SpeakingListeningVariant = 'practice' | 'arena'

const PRACTICE_BASE_SETTLE_MS = 700
const PRACTICE_PER_WORD_SETTLE_MS = 350
const PRACTICE_MAX_SETTLE_MS = 4000

const ARENA_BASE_SETTLE_MS = 500
const ARENA_PER_WORD_SETTLE_MS = 220
const ARENA_MAX_SETTLE_MS = 2200

const WORD_COVERAGE_THRESHOLD = 0.85

export function getExpectedWordCount(expectedPhrase: string): number {
  const normalized = normalizeSpeechPhrase(expectedPhrase)
  if (!normalized) return 0
  return normalized.split(' ').filter(Boolean).length
}

export function getPhraseSettleDelayMs(
  expectedPhrase: string,
  variant: SpeakingListeningVariant = 'practice'
): number {
  const wordCount = getExpectedWordCount(expectedPhrase)
  const base = variant === 'arena' ? ARENA_BASE_SETTLE_MS : PRACTICE_BASE_SETTLE_MS
  const perWord = variant === 'arena' ? ARENA_PER_WORD_SETTLE_MS : PRACTICE_PER_WORD_SETTLE_MS
  const max = variant === 'arena' ? ARENA_MAX_SETTLE_MS : PRACTICE_MAX_SETTLE_MS

  return Math.min(max, base + wordCount * perWord)
}

export function getListeningWordCoverage(expectedPhrase: string, transcript: string): number {
  const expectedWords = getExpectedWordCount(expectedPhrase)
  if (expectedWords === 0) return 0

  const result = scoreSpeechTranscript(expectedPhrase, transcript)
  const matchedWords = result.alignment.expected.filter((word) => word.isCorrect).length

  return Math.min(1, matchedWords / expectedWords)
}

export function isPerfectSpeakingPhrase(input: string, expected: string): boolean {
  const normalizedInput = normalizeSpeechPhrase(input)
  const normalizedExpected = normalizeSpeechPhrase(expected)
  return Boolean(normalizedInput) && normalizedInput === normalizedExpected
}

export function shouldAutoFinishListening(expectedPhrase: string, transcript: string): boolean {
  const normalizedTranscript = normalizeSpeechPhrase(transcript)
  if (!normalizedTranscript) return false

  if (isPerfectSpeakingPhrase(transcript, expectedPhrase)) return true

  const scoreResult = scoreSpeechTranscript(expectedPhrase, transcript)
  if (scoreResult.accepted) return true

  return getListeningWordCoverage(expectedPhrase, transcript) >= WORD_COVERAGE_THRESHOLD
}

export function shouldRestartListeningAfterEnd(expectedPhrase: string, transcript: string): boolean {
  const normalizedTranscript = normalizeSpeechPhrase(transcript)
  if (!normalizedTranscript) return false

  return !shouldAutoFinishListening(expectedPhrase, transcript)
}