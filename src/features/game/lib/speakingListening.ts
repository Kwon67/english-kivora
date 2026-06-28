import { isAcceptedTranslationAnswer } from '@/features/cards/lib/translationMatching'
import {
  normalizeSpeechPhrase,
  scoreSpeechTranscript,
} from '@/features/game/lib/speech-scoring'
import {
  type LocalPronunciationAssessment,
} from '@/features/game/lib/pronunciation-assessment'

export const PRACTICE_SPEECH_ACCEPTANCE_THRESHOLD = 85

const PRACTICE_BASE_SETTLE_MS = 700
const PRACTICE_PER_WORD_SETTLE_MS = 240
const PRACTICE_MAX_SETTLE_MS = 3200

const QUICK_BASE_SETTLE_MS = 550
const QUICK_PER_WORD_SETTLE_MS = 65
const QUICK_MAX_SETTLE_MS = 1100

const WORD_COVERAGE_THRESHOLD = 0.72
export const QUICK_SILENCE_COVERAGE_THRESHOLD = 0.92
const PRACTICE_SILENCE_SCORE_THRESHOLD = 75

export function getExpectedWordCount(expectedPhrase: string): number {
  const normalized = normalizeSpeechPhrase(expectedPhrase)
  if (!normalized) return 0
  return normalized.split(' ').filter(Boolean).length
}

export function getPhraseSettleDelayMs(
  expectedPhrase: string,
  options?: { fast?: boolean }
): number {
  const wordCount = getExpectedWordCount(expectedPhrase)
  if (options?.fast) {
    return Math.min(2200, 480 + wordCount * 150)
  }

  return Math.min(
    PRACTICE_MAX_SETTLE_MS,
    PRACTICE_BASE_SETTLE_MS + wordCount * PRACTICE_PER_WORD_SETTLE_MS
  )
}

export function getPhraseQuickSettleDelayMs(expectedPhrase: string): number {
  const wordCount = getExpectedWordCount(expectedPhrase)
  return Math.min(
    QUICK_MAX_SETTLE_MS,
    QUICK_BASE_SETTLE_MS + wordCount * QUICK_PER_WORD_SETTLE_MS
  )
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

export function shouldFinishListeningImmediately(
  expectedPhrase: string,
  transcript: string,
  acceptedTranslations: string[] = []
): boolean {
  if (isPerfectSpeakingPhrase(transcript, expectedPhrase)) return true

  return (
    acceptedTranslations.length > 0 &&
    isAcceptedTranslationAnswer(transcript, acceptedTranslations)
  )
}

export function shouldUseQuickSilenceSettle(
  expectedPhrase: string,
  transcript: string,
  acceptedTranslations: string[] = []
): boolean {
  if (isPerfectSpeakingPhrase(transcript, expectedPhrase)) return true

  if (
    acceptedTranslations.length > 0 &&
    isAcceptedTranslationAnswer(transcript, acceptedTranslations)
  ) {
    return true
  }

  return getListeningWordCoverage(expectedPhrase, transcript) >= QUICK_SILENCE_COVERAGE_THRESHOLD
}

export function shouldAutoFinishListening(expectedPhrase: string, transcript: string): boolean {
  return shouldEvaluateListeningAfterSilence(expectedPhrase, transcript)
}

export function shouldEvaluateListeningAfterSilence(
  expectedPhrase: string,
  transcript: string,
  acceptedTranslations: string[] = []
): boolean {
  const normalizedTranscript = normalizeSpeechPhrase(transcript)
  if (!normalizedTranscript) return false

  if (isPerfectSpeakingPhrase(transcript, expectedPhrase)) return true

  const scoreResult = scoreSpeechTranscript(expectedPhrase, transcript, PRACTICE_SILENCE_SCORE_THRESHOLD)
  if (scoreResult.accepted) return true

  if (
    acceptedTranslations.length > 0 &&
    isAcceptedTranslationAnswer(transcript, acceptedTranslations)
  ) {
    return true
  }

  return getListeningWordCoverage(expectedPhrase, transcript) >= WORD_COVERAGE_THRESHOLD
}

export function shouldRestartListeningAfterEnd(
  expectedPhrase: string,
  transcript: string,
  acceptedTranslations: string[] = []
): boolean {
  const normalizedTranscript = normalizeSpeechPhrase(transcript)
  if (!normalizedTranscript) return true

  return !shouldEvaluateListeningAfterSilence(expectedPhrase, transcript, acceptedTranslations)
}

export function hasRecognizedSpeech(transcript: string): boolean {
  return Boolean(normalizeSpeechPhrase(transcript))
}

export function getSpeakingAcceptanceThreshold() {
  return PRACTICE_SPEECH_ACCEPTANCE_THRESHOLD
}

export function evaluateSpeakingAnswer({
  expectedPhrase,
  transcript,
  acceptedTranslations = [],
  assessment = null,
}: {
  expectedPhrase: string
  transcript: string
  acceptedTranslations?: string[]
  assessment?: LocalPronunciationAssessment | null
}): boolean {
  void assessment

  if (isPerfectSpeakingPhrase(transcript, expectedPhrase)) return true

  const threshold = getSpeakingAcceptanceThreshold()
  const scoreResult = scoreSpeechTranscript(expectedPhrase, transcript, threshold)
  if (scoreResult.accepted) return true

  if (
    acceptedTranslations.length > 0 &&
    isAcceptedTranslationAnswer(transcript, acceptedTranslations)
  ) {
    return true
  }

  return false
}
