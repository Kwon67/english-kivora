import type { Card } from '@/types/database.types'

/**
 * Cards carry the prompt under two different names: rows from the `cards` table use
 * `english_phrase`, while the temp cards Blitz IA builds in memory also mirror it as `en`.
 */
type AudioResolvableCard = Pick<Card, 'audio_url'> & {
  english_phrase?: string | null
  en?: string | null
}

export function getCardEnglishPhrase(card: AudioResolvableCard): string {
  return card.english_phrase || card.en || ''
}

/**
 * Resolves what a card's AudioButton should play.
 *
 * Pack cards ship with a stored `audio_url`, but AI-generated cards (Blitz IA) and pack cards
 * whose audio has not been generated yet have none — those fall back to synthesizing the phrase
 * on demand. Returns null when there is nothing to say, so AudioButton renders nothing instead
 * of asking the preview endpoint for an empty string (which would answer with its own demo blurb).
 */
export function resolveCardAudioUrl(card: AudioResolvableCard): string | null {
  if (card.audio_url) return card.audio_url

  const englishPhrase = getCardEnglishPhrase(card).trim()
  if (!englishPhrase) return null

  return `/api/tts/preview?text=${encodeURIComponent(englishPhrase)}`
}
