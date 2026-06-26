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
Retorne SOMENTE JSON válido no formato {"cards": [{"en": "...", "pt": "..."}, ...]}.

REGRAS OBRIGATÓRIAS DE TRADUÇÃO (pt-BR natural):
- Use português brasileiro natural e coloquial do dia a dia. NUNCA tradução literal.
- Para expressões fixas/phrasal verbs use o equivalente idiomático brasileiro:
  Exemplos corretos:
  - "I take a shower every day" → "Eu tomo banho todos os dias" (NUNCA "dou um banho")
  - "I get up early" → "Eu acordo cedo"
  - "Have breakfast" → "Tomar café da manhã"
  - "Make a decision" → "Tomar uma decisão"
- Traduções devem soar como o que um brasileiro realmente diria.
- Frases naturais, úteis para treino diário e adequadas para estudantes brasileiros.

Exemplo de saída: {"cards": [{"en": "Hello", "pt": "Olá"}]}`
}
