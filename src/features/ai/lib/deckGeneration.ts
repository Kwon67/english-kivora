export type GeneratedCard = {
  en: string
  pt: string
}

export function parseGeneratedCards(content: string): GeneratedCard[] {
  const parsed = JSON.parse(content) as { cards?: unknown }

  if (!Array.isArray(parsed.cards)) {
    return []
  }

  return parsed.cards.flatMap((card) => {
    if (!card || typeof card !== 'object') return []

    const { en, pt } = card as { en?: unknown; pt?: unknown }
    if (typeof en !== 'string' || typeof pt !== 'string') return []

    const trimmedEn = en.replace(/\s+/g, ' ').trim()
    const trimmedPt = pt.replace(/\s+/g, ' ').trim()
    if (!trimmedEn || !trimmedPt) return []

    return [{ en: trimmedEn, pt: trimmedPt }]
  })
}

export function buildDeckGenerationPrompt(topic: string, count: number, customPrompt = '') {
  const userInstructions = customPrompt
    ? `\nInstruções adicionais do usuário para a geração: "${customPrompt}". Siga essas instruções ao criar as frases.`
    : ''

  return `Gere um conjunto de ${count} frases em inglês e suas traduções em português focadas no tema: "${topic}".${userInstructions}
    Retorne somente um objeto JSON com a chave "cards", contendo um array de objetos com "en" e "pt".
    As frases devem ser naturais, úteis para treino diário e adequadas para estudantes brasileiros.
    Exemplo: {"cards": [{"en": "Hello", "pt": "Olá"}]}`
}
