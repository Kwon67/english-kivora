export function isReadingComprehensionPack(
  category: string | null | undefined,
  description: string | null | undefined
) {
  const normalizedCategory = (category || '').toLowerCase()
  if (normalizedCategory.includes('leitura') || normalizedCategory.includes('reading')) {
    return true
  }

  return (description?.trim().length ?? 0) >= 160
}

export function isGuidedWritingPack(category: string | null | undefined) {
  const normalizedCategory = (category || '').toLowerCase()
  return (
    normalizedCategory.includes('escrita') ||
    normalizedCategory.includes('writing') ||
    normalizedCategory.includes('gramática') ||
    normalizedCategory.includes('grammar')
  )
}

export function isGrammarPack(category: string | null | undefined) {
  const normalizedCategory = (category || '').toLowerCase()
  return normalizedCategory.includes('gramática') || normalizedCategory.includes('grammar')
}

export function getPackPassageText(description: string | null | undefined) {
  return description?.trim() || ''
}