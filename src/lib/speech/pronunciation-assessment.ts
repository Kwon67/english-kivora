import { normalizeSpeechPhrase } from '@/lib/arena/speech-scoring'

export type LocalPronunciationAssessment = {
  accepted: boolean
  score: number
  clarityScore: number
  durationScore: number
  paceScore: number
  rhythmScore: number | null
  durationMs: number
  voicedDurationMs: number
  referenceDurationMs: number | null
  reasons: string[]
}

type AudioFeatures = {
  durationMs: number
  voicedDurationMs: number
  voicedRatio: number
  rmsMean: number
  rmsPeak: number
  clippingRatio: number
  envelope: number[]
}

export type LocalPronunciationReference = {
  audioUrl: string
  features: AudioFeatures
}

type AssessLocalPronunciationOptions = {
  userAudioBlob: Blob | null
  reference?: LocalPronunciationReference | null
  expectedPhrase: string
  maxProcessingMs?: number
}

const FRAME_MS = 25
const HOP_MS = 10
const ENVELOPE_BINS = 48
const MIN_ACCEPTED_SCORE = 78
const MIN_CLARITY_SCORE = 62
const MIN_DURATION_SCORE = 55
const MIN_PACE_SCORE = 58
const DEFAULT_MAX_PROCESSING_MS = 900

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function scoreByRange(value: number, idealMin: number, idealMax: number, hardMin: number, hardMax: number) {
  if (value >= idealMin && value <= idealMax) return 100
  if (value < hardMin || value > hardMax) return 0
  if (value < idealMin) return Math.round(((value - hardMin) / (idealMin - hardMin)) * 100)
  return Math.round(((hardMax - value) / (hardMax - idealMax)) * 100)
}

function resampleEnvelope(values: number[], bins = ENVELOPE_BINS) {
  if (values.length === 0) return Array(bins).fill(0)
  if (values.length === 1) return Array(bins).fill(values[0])

  return Array.from({ length: bins }, (_, index) => {
    const position = (index / Math.max(1, bins - 1)) * (values.length - 1)
    const left = Math.floor(position)
    const right = Math.min(values.length - 1, left + 1)
    const fraction = position - left

    return values[left] * (1 - fraction) + values[right] * fraction
  })
}

function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length)
  if (length === 0) return 0

  const meanA = a.reduce((sum, value) => sum + value, 0) / a.length
  const meanB = b.reduce((sum, value) => sum + value, 0) / b.length
  let dot = 0
  let normA = 0
  let normB = 0

  for (let index = 0; index < length; index += 1) {
    const av = a[index] - meanA
    const bv = b[index] - meanB
    dot += av * bv
    normA += av * av
    normB += bv * bv
  }

  if (normA === 0 || normB === 0) return 0
  return dot / Math.sqrt(normA * normB)
}

function getMonoSamples(buffer: AudioBuffer) {
  const samples = new Float32Array(buffer.length)

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const channelData = buffer.getChannelData(channel)
    for (let index = 0; index < channelData.length; index += 1) {
      samples[index] += channelData[index] / buffer.numberOfChannels
    }
  }

  return samples
}

function extractAudioFeatures(buffer: AudioBuffer): AudioFeatures {
  const samples = getMonoSamples(buffer)
  const sampleRate = buffer.sampleRate
  const frameSize = Math.max(1, Math.round(sampleRate * FRAME_MS / 1000))
  const hopSize = Math.max(1, Math.round(sampleRate * HOP_MS / 1000))
  const frameRms: number[] = []
  let rmsTotal = 0
  let rmsPeak = 0
  let clippedSamples = 0

  for (let index = 0; index < samples.length; index += 1) {
    const abs = Math.abs(samples[index])
    rmsTotal += abs * abs
    if (abs > rmsPeak) rmsPeak = abs
    if (abs >= 0.98) clippedSamples += 1
  }

  for (let start = 0; start + frameSize <= samples.length; start += hopSize) {
    let total = 0
    for (let index = start; index < start + frameSize; index += 1) {
      total += samples[index] * samples[index]
    }
    frameRms.push(Math.sqrt(total / frameSize))
  }

  const sortedRms = [...frameRms].sort((a, b) => a - b)
  const noiseFloor = sortedRms[Math.floor(sortedRms.length * 0.15)] ?? 0
  const threshold = Math.max(0.012, noiseFloor * 2.8, rmsPeak * 0.12)
  const voicedFrames = frameRms.filter((value) => value >= threshold)
  const normalizedEnvelope = voicedFrames.length > 0
    ? frameRms.map((value) => clamp(value / Math.max(...voicedFrames), 0, 1))
    : frameRms.map(() => 0)

  return {
    durationMs: samples.length / sampleRate * 1000,
    voicedDurationMs: voicedFrames.length * HOP_MS,
    voicedRatio: frameRms.length > 0 ? voicedFrames.length / frameRms.length : 0,
    rmsMean: samples.length > 0 ? Math.sqrt(rmsTotal / samples.length) : 0,
    rmsPeak,
    clippingRatio: samples.length > 0 ? clippedSamples / samples.length : 0,
    envelope: resampleEnvelope(normalizedEnvelope),
  }
}

async function decodeBlob(audioContext: AudioContext, blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer()
  return audioContext.decodeAudioData(arrayBuffer.slice(0))
}

async function decodeRemoteAudio(audioContext: AudioContext, url: string) {
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) throw new Error('Reference audio unavailable')

  const arrayBuffer = await response.arrayBuffer()
  return audioContext.decodeAudioData(arrayBuffer.slice(0))
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T) {
  let timeoutId: number | null = null

  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = window.setTimeout(() => resolve(fallback), timeoutMs)
  })

  const result = await Promise.race([promise, timeoutPromise])
  if (timeoutId !== null) window.clearTimeout(timeoutId)
  return result
}

function scoreClarity(features: AudioFeatures) {
  const rmsScore = scoreByRange(features.rmsMean, 0.018, 0.18, 0.006, 0.34)
  const voicedScore = scoreByRange(features.voicedRatio, 0.28, 0.88, 0.12, 0.98)
  const clippingPenalty = clamp(features.clippingRatio * 1600, 0, 45)

  return Math.round(clamp(rmsScore * 0.45 + voicedScore * 0.55 - clippingPenalty, 0, 100))
}

function scoreDuration(features: AudioFeatures, reference: AudioFeatures | null, wordCount: number) {
  if (reference && reference.voicedDurationMs > 0) {
    const ratio = features.voicedDurationMs / reference.voicedDurationMs
    return Math.round(clamp(100 - Math.abs(Math.log(ratio)) * 110, 0, 100))
  }

  const minDuration = Math.max(600, wordCount * 230)
  const idealMin = Math.max(750, wordCount * 300)
  const idealMax = Math.max(1500, wordCount * 760)
  const maxDuration = Math.max(2200, wordCount * 1100)

  return scoreByRange(features.voicedDurationMs, idealMin, idealMax, minDuration, maxDuration)
}

function scorePace(features: AudioFeatures, wordCount: number) {
  const voicedSeconds = features.voicedDurationMs / 1000
  if (voicedSeconds <= 0) return 0

  const wordsPerSecond = wordCount / voicedSeconds
  return scoreByRange(wordsPerSecond, 1.15, 3.25, 0.65, 4.35)
}

function scoreRhythm(features: AudioFeatures, reference: AudioFeatures | null) {
  if (!reference) return null

  const similarity = cosineSimilarity(features.envelope, reference.envelope)
  return Math.round(clamp((similarity - 0.2) / 0.65 * 100, 0, 100))
}

function buildReasons(
  clarityScore: number,
  durationScore: number,
  paceScore: number,
  rhythmScore: number | null,
  features: AudioFeatures
) {
  const reasons: string[] = []

  if (features.voicedDurationMs < 450) {
    reasons.push('O áudio ficou curto demais para avaliar a pronúncia.')
  }
  if (clarityScore < MIN_CLARITY_SCORE) {
    reasons.push('A voz ficou baixa, cortada ou com pouco sinal claro.')
  }
  if (durationScore < MIN_DURATION_SCORE) {
    reasons.push('A duração da fala ficou distante da frase esperada.')
  }
  if (paceScore < MIN_PACE_SCORE) {
    reasons.push('O ritmo ficou muito rápido ou muito lento para a frase.')
  }
  if (rhythmScore !== null && rhythmScore < 35) {
    reasons.push('O contorno da fala ficou muito diferente da referência.')
  }

  return reasons
}

function createAssessmentTimeoutResult(): LocalPronunciationAssessment {
  return {
    accepted: false,
    score: 0,
    clarityScore: 0,
    durationScore: 0,
    paceScore: 0,
    rhythmScore: null,
    durationMs: 0,
    voicedDurationMs: 0,
    referenceDurationMs: null,
    reasons: ['A avaliação demorou demais. Tente falar de novo com áudio claro.'],
  }
}

async function runLocalPronunciationAssessment(
  userAudioBlob: Blob,
  reference: LocalPronunciationReference | null | undefined,
  expectedPhrase: string
): Promise<LocalPronunciationAssessment> {
  const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) {
    return {
      accepted: false,
      score: 0,
      clarityScore: 0,
      durationScore: 0,
      paceScore: 0,
      rhythmScore: null,
      durationMs: 0,
      voicedDurationMs: 0,
      referenceDurationMs: null,
      reasons: ['Este navegador não suporta avaliação local de áudio.'],
    }
  }

  const audioContext = new AudioCtx()

  try {
    const userBuffer = await decodeBlob(audioContext, userAudioBlob)
    const userFeatures = extractAudioFeatures(userBuffer)
    const referenceFeatures = reference?.features ?? null
    const wordCount = Math.max(1, normalizeSpeechPhrase(expectedPhrase).split(' ').filter(Boolean).length)
    const clarityScore = scoreClarity(userFeatures)
    const durationScore = scoreDuration(userFeatures, referenceFeatures, wordCount)
    const paceScore = scorePace(userFeatures, wordCount)
    const rhythmScore = scoreRhythm(userFeatures, referenceFeatures)
    const rhythmContribution = rhythmScore ?? 70
    const score = Math.round(clamp(
      clarityScore * 0.36 + durationScore * 0.30 + paceScore * 0.24 + rhythmContribution * 0.10,
      0,
      100
    ))
    const reasons = buildReasons(clarityScore, durationScore, paceScore, rhythmScore, userFeatures)
    const accepted = score >= MIN_ACCEPTED_SCORE
      && clarityScore >= MIN_CLARITY_SCORE
      && durationScore >= MIN_DURATION_SCORE
      && paceScore >= MIN_PACE_SCORE
      && userFeatures.voicedDurationMs >= 450

    return {
      accepted,
      score,
      clarityScore,
      durationScore,
      paceScore,
      rhythmScore,
      durationMs: Math.round(userFeatures.durationMs),
      voicedDurationMs: Math.round(userFeatures.voicedDurationMs),
      referenceDurationMs: referenceFeatures ? Math.round(referenceFeatures.durationMs) : null,
      reasons,
    }
  } catch {
    return {
      accepted: false,
      score: 0,
      clarityScore: 0,
      durationScore: 0,
      paceScore: 0,
      rhythmScore: null,
      durationMs: 0,
      voicedDurationMs: 0,
      referenceDurationMs: null,
      reasons: ['Não consegui analisar o áudio gravado neste navegador.'],
    }
  } finally {
    void audioContext.close()
  }
}

export async function preloadLocalPronunciationReference(audioUrl: string): Promise<LocalPronunciationReference | null> {
  const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null

  const audioContext = new AudioCtx()

  try {
    const referenceBuffer = await decodeRemoteAudio(audioContext, audioUrl)
    return {
      audioUrl,
      features: extractAudioFeatures(referenceBuffer),
    }
  } catch {
    return null
  } finally {
    void audioContext.close()
  }
}

export async function assessLocalPronunciation({
  userAudioBlob,
  reference,
  expectedPhrase,
  maxProcessingMs = DEFAULT_MAX_PROCESSING_MS,
}: AssessLocalPronunciationOptions): Promise<LocalPronunciationAssessment> {
  if (!userAudioBlob) {
    return {
      accepted: false,
      score: 0,
      clarityScore: 0,
      durationScore: 0,
      paceScore: 0,
      rhythmScore: null,
      durationMs: 0,
      voicedDurationMs: 0,
      referenceDurationMs: null,
      reasons: ['Não consegui capturar o áudio real da sua pronúncia.'],
    }
  }

  return withTimeout(
    runLocalPronunciationAssessment(userAudioBlob, reference, expectedPhrase),
    maxProcessingMs,
    createAssessmentTimeoutResult()
  )
}
