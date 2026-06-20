import { scoreSpeechTranscript } from '@/features/game/lib/speech-scoring'
import type { BlitzGameMode } from '@/features/blitz/lib/blitzModes'
import type { Card } from '@/types/database.types'

export type BlitzSpeechMissDetails = {
  transcript: string
  missingWords: string[]
  extraWords: string[]
}

export type BlitzMiss = {
  id: string
  cardId: string
  englishPhrase: string
  portugueseHint: string
  mode: BlitzGameMode
  detail?: string
}

const MAX_VISIBLE_MISSES = 5

export function buildSpeechMissDetails(
  expectedPhrase: string,
  transcript: string
): BlitzSpeechMissDetails {
  const result = scoreSpeechTranscript(expectedPhrase, transcript)

  return {
    transcript: transcript.trim(),
    missingWords: result.missingWords,
    extraWords: result.extraWords,
  }
}

export function formatSpeechMissDetail(details: BlitzSpeechMissDetails): string | undefined {
  const parts: string[] = []

  if (details.missingWords.length > 0) {
    const words = details.missingWords.slice(0, 4).join(', ')
    const suffix = details.missingWords.length > 4 ? '…' : ''
    parts.push(`faltou: ${words}${suffix}`)
  }

  if (details.extraWords.length > 0) {
    const words = details.extraWords.slice(0, 3).join(', ')
    const suffix = details.extraWords.length > 3 ? '…' : ''
    parts.push(`disse: ${words}${suffix}`)
  }

  if (parts.length === 0 && details.transcript) {
    return `ouviu: “${truncatePhrase(details.transcript, 48)}”`
  }

  if (parts.length === 0) {
    return 'não detectou sua fala'
  }

  return parts.join(' · ')
}

export function createBlitzMiss(
  card: Card,
  mode: BlitzGameMode,
  options?: {
    detail?: string
    speechDetails?: BlitzSpeechMissDetails
    idSuffix?: string
  }
): BlitzMiss {
  const detail =
    options?.detail ??
    (options?.speechDetails ? formatSpeechMissDetail(options.speechDetails) : undefined)

  return {
    id: `${card.id}-${options?.idSuffix ?? Date.now()}`,
    cardId: card.id,
    englishPhrase: card.english_phrase || card.en || 'Frase em inglês',
    portugueseHint: card.portuguese_translation || card.pt || '',
    mode,
    detail,
  }
}

export function createMatchingBlitzMiss(
  cards: Card[],
  detail?: string
): BlitzMiss | null {
  if (cards.length === 0) return null

  const anchor = cards[0]
  const phrases = cards
    .map((card) => card.english_phrase || card.en || '')
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ')

  return {
    id: `matching-${anchor.id}-${Date.now()}`,
    cardId: anchor.id,
    englishPhrase: phrases || 'Combinação',
    portugueseHint: cards[0].portuguese_translation || cards[0].pt || '',
    mode: 'matching',
    detail: detail ?? 'par incorreto',
  }
}

export function getVisibleBlitzMisses(misses: BlitzMiss[]) {
  return {
    visible: misses.slice(0, MAX_VISIBLE_MISSES),
    hiddenCount: Math.max(0, misses.length - MAX_VISIBLE_MISSES),
  }
}

export function getUniqueBlitzMissCardIds(misses: BlitzMiss[]) {
  return [...new Set(misses.map((miss) => miss.cardId).filter(Boolean))]
}

function truncatePhrase(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1)}…`
}