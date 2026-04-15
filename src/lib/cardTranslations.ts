import type { Card } from '@/types/database.types'

const TRANSLATION_SEPARATOR_REGEX = /[;\n]+/

function sanitizeTranslation(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeForUniqueness(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function parseAcceptedTranslationsInput(value: string | null | undefined) {
  if (!value) return []

  const seen = new Set<string>()

  return value
    .split(TRANSLATION_SEPARATOR_REGEX)
    .map(sanitizeTranslation)
    .filter(Boolean)
    .filter((item) => {
      const normalized = normalizeForUniqueness(item)
      if (!normalized || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
}

export function splitPrimaryAndAcceptedTranslations(value: string | null | undefined) {
  const allTranslations = parseAcceptedTranslationsInput(value)

  if (allTranslations.length === 0) {
    return {
      primary: '',
      accepted: [] as string[],
    }
  }

  const [primary, ...accepted] = allTranslations

  return {
    primary,
    accepted,
  }
}

export function mergeAcceptedTranslations(
  primary: string,
  ...acceptedGroups: Array<string[] | null | undefined>
) {
  const normalizedPrimary = normalizeForUniqueness(primary)
  const seen = new Set<string>(normalizedPrimary ? [normalizedPrimary] : [])
  const merged: string[] = []

  for (const group of acceptedGroups) {
    for (const item of group || []) {
      const sanitized = sanitizeTranslation(item)
      const normalized = normalizeForUniqueness(sanitized)

      if (!sanitized || !normalized || seen.has(normalized)) continue

      seen.add(normalized)
      merged.push(sanitized)
    }
  }

  return merged
}

export function getCardTypingTranslations(
  card: Pick<Card, 'portuguese_translation' | 'accepted_translations' | 'pt'>
) {
  const primary = sanitizeTranslation(card.portuguese_translation || card.pt || '')
  const accepted = mergeAcceptedTranslations(primary, card.accepted_translations || [])

  return [primary, ...accepted].filter(Boolean)
}

export function formatAcceptedTranslations(translations: string[] | null | undefined) {
  return (translations || []).map(sanitizeTranslation).filter(Boolean).join('; ')
}
