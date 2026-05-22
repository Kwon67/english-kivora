type ImportCardInput = {
  en: string
  pt: string
}

export type ImportAnalysis = {
  totalInput: number
  validCount: number
  emptyCount: number
  duplicateWithinImportCount: number
  duplicateAgainstExistingCount: number
  longCardCount: number
  validCards: ImportCardInput[]
}

function sanitizeImportValue(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeImportValue(value: string) {
  return sanitizeImportValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getCardSignature(card: ImportCardInput) {
  return `${normalizeImportValue(card.en)}::${normalizeImportValue(card.pt)}`
}

function isLongCard(card: ImportCardInput) {
  return card.en.length > 80 || card.pt.length > 120
}

export function analyzeImportCards(
  cards: ImportCardInput[],
  existingCards: ImportCardInput[] = []
): ImportAnalysis {
  const existingSignatures = new Set(existingCards.map(getCardSignature))
  const seenImportSignatures = new Set<string>()
  const validCards: ImportCardInput[] = []
  let emptyCount = 0
  let duplicateWithinImportCount = 0
  let duplicateAgainstExistingCount = 0
  let longCardCount = 0

  for (const rawCard of cards) {
    const card = {
      en: sanitizeImportValue(rawCard.en),
      pt: sanitizeImportValue(rawCard.pt),
    }

    if (!card.en || !card.pt) {
      emptyCount += 1
      continue
    }

    const signature = getCardSignature(card)

    if (seenImportSignatures.has(signature)) {
      duplicateWithinImportCount += 1
      continue
    }

    seenImportSignatures.add(signature)

    if (existingSignatures.has(signature)) {
      duplicateAgainstExistingCount += 1
      continue
    }

    if (isLongCard(card)) {
      longCardCount += 1
    }

    validCards.push(card)
  }

  return {
    totalInput: cards.length,
    validCount: validCards.length,
    emptyCount,
    duplicateWithinImportCount,
    duplicateAgainstExistingCount,
    longCardCount,
    validCards,
  }
}
