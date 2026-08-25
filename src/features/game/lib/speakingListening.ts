import {
  normalizeSpeechPhrase,
  scoreSpeechTranscript,
} from '@/features/game/lib/speech-scoring'
import {
  isReliablePronunciationAssessment,
  type LocalPronunciationAssessment,
} from '@/features/game/lib/pronunciation-assessment'

/**
 * Palavras cuja ausência não muda o que foi dito. O reconhecedor engole artigo com frequência,
 * e reprovar por isso seria punir quem falou a frase certa.
 *
 * A lista é curta de propósito: "to", "my", "your" e afins mudam o sentido e ficam de fora.
 */
const SPEECH_FUNCTION_WORDS = new Set(['a', 'an', 'the'])

/** Hesitação não é palavra: não conta como coisa dita a mais. */
const SPEECH_FILLER_WORDS = new Set(['uh', 'um', 'uhm', 'er', 'erm', 'ah', 'eh', 'hmm', 'mm', 'mmm'])

const MAX_FUNCTION_WORD_ERRORS = 1

/**
 * Clareza mínima do áudio para o acerto valer no treino de pronúncia.
 *
 * Bem abaixo do 62 que o próprio módulo usa como "boa pronúncia": aqui o objetivo é só barrar
 * áudio que claramente não é uma tentativa de falar a frase — sussurro, microfone abafado,
 * estouro. Apertar mais reprovaria gente falando certo em sala barulhenta.
 */
const MIN_PRONUNCIATION_CLARITY_SCORE = 45

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
  transcript: string
): boolean {
  return isPerfectSpeakingPhrase(transcript, expectedPhrase)
}

export function shouldUseQuickSilenceSettle(
  expectedPhrase: string,
  transcript: string
): boolean {
  if (isPerfectSpeakingPhrase(transcript, expectedPhrase)) return true

  return getListeningWordCoverage(expectedPhrase, transcript) >= QUICK_SILENCE_COVERAGE_THRESHOLD
}

export function shouldAutoFinishListening(expectedPhrase: string, transcript: string): boolean {
  return shouldEvaluateListeningAfterSilence(expectedPhrase, transcript)
}

export function shouldEvaluateListeningAfterSilence(
  expectedPhrase: string,
  transcript: string
): boolean {
  const normalizedTranscript = normalizeSpeechPhrase(transcript)
  if (!normalizedTranscript) return false

  if (isPerfectSpeakingPhrase(transcript, expectedPhrase)) return true

  const scoreResult = scoreSpeechTranscript(expectedPhrase, transcript, PRACTICE_SILENCE_SCORE_THRESHOLD)
  if (scoreResult.accepted) return true

  return getListeningWordCoverage(expectedPhrase, transcript) >= WORD_COVERAGE_THRESHOLD
}

export function shouldRestartListeningAfterEnd(
  expectedPhrase: string,
  transcript: string
): boolean {
  const normalizedTranscript = normalizeSpeechPhrase(transcript)
  if (!normalizedTranscript) return true

  return !shouldEvaluateListeningAfterSilence(expectedPhrase, transcript)
}

export function hasRecognizedSpeech(transcript: string): boolean {
  return Boolean(normalizeSpeechPhrase(transcript))
}

/** Quantas palavras a mais toleramos antes de considerar que a pessoa disse outra coisa. */
function getMaxExtraWords(expectedWordCount: number): number {
  return expectedWordCount > 6 ? 2 : 1
}

export type SpeakingAnswerReport = {
  accepted: boolean
  /** Palavras esperadas que mudam o sentido e não foram ditas (ou foram trocadas por outras). */
  contentWordErrors: string[]
  /** Artigos perdidos: tolerados até o limite, porque o reconhecedor come artigo sozinho. */
  functionWordErrors: string[]
  /** Palavras ditas a mais, já descontadas as hesitações. */
  extraWords: string[]
  /** Preenchido só quando a pronúncia derrubou um acerto que as palavras tinham garantido. */
  pronunciationRejection: string | null
}

/**
 * Decide o acerto olhando QUAIS palavras erraram, não a porcentagem de acerto.
 *
 * A régra antiga era `score >= 85`, com score = 1 − distância/palavras. Como o denominador cresce
 * com a frase, a tolerância crescia junto: numa frase de 7 palavras uma palavra inteira trocada
 * dava 86 e passava; em 11 palavras, 91. Trocar "Friday" por "Monday" era aprovado. Percentual é
 * a medida errada — o que importa é se a palavra que mudou carrega sentido.
 *
 * `requirePronunciation` liga a checagem de áudio. Fica desligada no Blitz de propósito: a análise
 * custa até 900 ms e ali a partida é cronometrada.
 */
export function evaluateSpeakingAnswerDetailed({
  expectedPhrase,
  transcript,
  assessment = null,
  requirePronunciation = false,
}: {
  expectedPhrase: string
  transcript: string
  assessment?: LocalPronunciationAssessment | null
  requirePronunciation?: boolean
}): SpeakingAnswerReport {
  const vazio: SpeakingAnswerReport = {
    accepted: false,
    contentWordErrors: [],
    functionWordErrors: [],
    extraWords: [],
    pronunciationRejection: null,
  }

  if (!normalizeSpeechPhrase(transcript)) return vazio

  const result = scoreSpeechTranscript(expectedPhrase, transcript)
  const naoDitas = [
    ...result.deletedWords,
    ...result.substitutedWords.map((item) => item.expected),
  ]

  const contentWordErrors = naoDitas.filter((word) => !SPEECH_FUNCTION_WORDS.has(word))
  const functionWordErrors = naoDitas.filter((word) => SPEECH_FUNCTION_WORDS.has(word))
  const extraWords = result.insertedWords.filter((word) => !SPEECH_FILLER_WORDS.has(word))

  const palavrasBatem =
    contentWordErrors.length === 0 &&
    functionWordErrors.length <= MAX_FUNCTION_WORD_ERRORS &&
    extraWords.length <= getMaxExtraWords(getExpectedWordCount(expectedPhrase))

  if (!palavrasBatem) {
    return { accepted: false, contentWordErrors, functionWordErrors, extraWords, pronunciationRejection: null }
  }

  // A análise local mede clareza e ritmo do áudio, não fonema. Por isso ela só DERRUBA um acerto
  // já ganho pelas palavras, e apenas quando a medição é confiável — nunca aprova nada sozinha,
  // e falha de decodificação ou estouro do tempo não reprovam ninguém.
  if (
    requirePronunciation &&
    isReliablePronunciationAssessment(assessment) &&
    assessment!.clarityScore < MIN_PRONUNCIATION_CLARITY_SCORE
  ) {
    return {
      accepted: false,
      contentWordErrors,
      functionWordErrors,
      extraWords,
      pronunciationRejection:
        assessment!.reasons[0] || 'O áudio saiu baixo demais para avaliar sua pronúncia.',
    }
  }

  return { accepted: true, contentWordErrors, functionWordErrors, extraWords, pronunciationRejection: null }
}

export function evaluateSpeakingAnswer(input: {
  expectedPhrase: string
  transcript: string
  assessment?: LocalPronunciationAssessment | null
  requirePronunciation?: boolean
}): boolean {
  return evaluateSpeakingAnswerDetailed(input).accepted
}
