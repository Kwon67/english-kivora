import {
  DEFAULT_ACCEPTANCE_THRESHOLD,
  normalizeSpeechPhrase,
  scoreSpeechTranscript,
} from '@/features/arena/lib/speech-scoring'
import {
  isReliablePronunciationAssessment,
  type LocalPronunciationAssessment,
} from '@/features/game/lib/pronunciation-assessment'

export type SpeakingListeningVariant = 'practice' | 'arena'

export const PRACTICE_SPEECH_ACCEPTANCE_THRESHOLD = 85

const PRACTICE_BASE_SETTLE_MS = 1100
const PRACTICE_PER_WORD_SETTLE_MS = 420
const PRACTICE_MAX_SETTLE_MS = 5500

const ARENA_BASE_SETTLE_MS = 500
const ARENA_PER_WORD_SETTLE_MS = 220
const ARENA_MAX_SETTLE_MS = 2200

const WORD_COVERAGE_THRESHOLD = 0.72
const PRACTICE_SILENCE_SCORE_THRESHOLD = 75

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

export function shouldFinishListeningImmediately(expectedPhrase: string, transcript: string): boolean {
  return isPerfectSpeakingPhrase(transcript, expectedPhrase)
}

export function shouldAutoFinishListening(expectedPhrase: string, transcript: string): boolean {
  return shouldEvaluateListeningAfterSilence(expectedPhrase, transcript, 'practice')
}

export function shouldEvaluateListeningAfterSilence(
  expectedPhrase: string,
  transcript: string,
  variant: SpeakingListeningVariant = 'practice'
): boolean {
  const normalizedTranscript = normalizeSpeechPhrase(transcript)
  if (!normalizedTranscript) return false

  if (isPerfectSpeakingPhrase(transcript, expectedPhrase)) return true

  const threshold = variant === 'arena' ? DEFAULT_ACCEPTANCE_THRESHOLD : PRACTICE_SILENCE_SCORE_THRESHOLD
  const scoreResult = scoreSpeechTranscript(expectedPhrase, transcript, threshold)
  if (scoreResult.accepted) return true

  return getListeningWordCoverage(expectedPhrase, transcript) >= WORD_COVERAGE_THRESHOLD
}

export function shouldRestartListeningAfterEnd(
  expectedPhrase: string,
  transcript: string,
  variant: SpeakingListeningVariant = 'practice'
): boolean {
  const normalizedTranscript = normalizeSpeechPhrase(transcript)
  if (!normalizedTranscript) return true

  return !shouldEvaluateListeningAfterSilence(expectedPhrase, transcript, variant)
}

export function hasRecognizedSpeech(transcript: string): boolean {
  return Boolean(normalizeSpeechPhrase(transcript))
}

export function getSpeakingAcceptanceThreshold(variant: SpeakingListeningVariant = 'practice') {
  return variant === 'arena' ? DEFAULT_ACCEPTANCE_THRESHOLD : PRACTICE_SPEECH_ACCEPTANCE_THRESHOLD
}

export function evaluateSpeakingAnswer({
  expectedPhrase,
  transcript,
  variant = 'practice',
  assessment = null,
}: {
  expectedPhrase: string
  transcript: string
  variant?: SpeakingListeningVariant
  assessment?: LocalPronunciationAssessment | null
}): boolean {
  if (isPerfectSpeakingPhrase(transcript, expectedPhrase)) return true

  const threshold = getSpeakingAcceptanceThreshold(variant)
  const scoreResult = scoreSpeechTranscript(expectedPhrase, transcript, threshold)
  if (!scoreResult.accepted) return false

  if (variant === 'practice') return true

  const reliableAssessment = isReliablePronunciationAssessment(assessment)
  return !reliableAssessment || Boolean(assessment?.accepted)
}