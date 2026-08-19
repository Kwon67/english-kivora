export type GeneratedCard = {
  en: string
  pt: string
}

/**
 * Devolve a pontuação "tipográfica" do modelo para o teclado de quem estuda.
 *
 * Os modelos gostam de hífen não separável (U+2011), aspas curvas e travessão. A correção de
 * resposta hoje derruba tudo que não é letra ou número, então nada disso quebra o exercício —
 * mas a frase aparece na tela com um caractere que ninguém consegue digitar, e basta uma
 * comparação futura mais estrita para virar erro silencioso. Mais barato normalizar na entrada.
 */
export function sanitizeGeneratedText(value: string): string {
  return value
    // Travessão e meia-risca separam orações; viram hífen COM espaços, senão "thought—maybe"
    // colapsa em "thought-maybe" e passa a parecer uma palavra composta.
    .replace(/[\u2013\u2014]/g, ' - ')
    // Estes são hífens de verdade, só que tipográficos: viram hífen simples, sem espaço.
    .replace(/[\u2010\u2011\u2012]/g, '-')
    .replace(/[\u2018\u2019\u201b]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extrai o objeto JSON de uma resposta que pode vir embrulhada em texto.
 *
 * Sem o modo JSON da Groq o modelo costuma responder com cerca ```json, ou com uma frase antes
 * do objeto. Pegar do primeiro `{` ao último `}` resolve os dois casos sem depender de o modelo
 * se comportar.
 */
function extractJsonObject(content: string): string {
  const semCerca = content.replace(/```(?:json)?/gi, '').trim()
  const inicio = semCerca.indexOf('{')
  const fim = semCerca.lastIndexOf('}')
  if (inicio === -1 || fim <= inicio) return semCerca
  return semCerca.slice(inicio, fim + 1)
}

export function parseGeneratedCards(content: string): GeneratedCard[] {
  let parsed: { cards?: unknown }
  try {
    parsed = JSON.parse(content) as { cards?: unknown }
  } catch {
    try {
      parsed = JSON.parse(extractJsonObject(content)) as { cards?: unknown }
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed.cards)) {
    return []
  }

  return parsed.cards.flatMap((card) => {
    if (!card || typeof card !== 'object') return []

    const { en, pt } = card as { en?: unknown; pt?: unknown }
    if (typeof en !== 'string' || typeof pt !== 'string') return []

    const trimmedEn = sanitizeGeneratedText(en)
    const trimmedPt = sanitizeGeneratedText(pt)
    if (!trimmedEn || !trimmedPt) return []

    return [{ en: trimmedEn, pt: trimmedPt }]
  })
}

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/**
 * Os níveis oferecidos na interface, com o rótulo que o admin lê.
 *
 * Fica aqui, junto da calibragem que alimenta o prompt, para os dois não se separarem: o que
 * a tela promete e o que a IA recebe têm de ser o mesmo nível. Também é a lista de valores que
 * a coluna `packs.level` aceita desde a migração CEFR.
 */
export const CEFR_LEVELS: ReadonlyArray<{ value: CefrLevel; label: string; hint: string }> = [
  { value: 'A1', label: 'A1 — Iniciante', hint: 'Frases curtas, presente simples, cotidiano imediato.' },
  { value: 'A2', label: 'A2 — Básico', hint: 'Passado e futuro simples, situações do dia a dia.' },
  { value: 'B1', label: 'B1 — Intermediário', hint: 'Opinião, justificativa, present perfect e condicionais simples.' },
  { value: 'B2', label: 'B2 — Avançado', hint: 'Nuance, hipótese e vocabulário abstrato.' },
  { value: 'C1', label: 'C1 — Proficiente', hint: 'Ironia, atenuação e registro sofisticado.' },
  { value: 'C2', label: 'C2 — Domínio', hint: 'Humor, ambiguidade e referência cultural.' },
]

export function isCefrLevel(value: unknown): value is CefrLevel {
  return CEFR_LEVELS.some((nivel) => nivel.value === value)
}

/**
 * O teto de complexidade de cada nível — o que o aluno CONSEGUE entender, não o que ele precisa
 * ver em toda frase.
 *
 * A distinção não é preciosismo. A primeira versão descrevia B2 como "voz passiva, condicionais
 * complexas, linguagem hipotética" e o modelo leu como checklist a cumprir por frase: a coleção
 * de expressões idiomáticas saiu com 52% de condicional e 43% de passiva, produzindo coisas como
 * "If the software were to crash again, we would have to let the cat out of the bag" — a
 * expressão soterrada pela estrutura. Ninguém fala assim, e quem estuda decora o andaime em vez
 * da expressão. C1 escapou porque sua descrição falava de registro, não de estruturas.
 *
 * Daí a palavra "teto" em cada linha, reforçada pela regra de naturalidade logo abaixo.
 */
const CEFR_GUIDANCE: Record<CefrLevel, string> = {
  A1: 'A1 — teto: 3 a 7 palavras, presente simples, vocabulário do cotidiano imediato, uma ideia por frase.',
  A2: 'A2 — teto: 5 a 10 palavras, presente e passado simples, futuro com going to, no máximo uma subordinada curta.',
  B1: 'B1 — teto: 8 a 14 palavras. O aluno já entende present perfect, condicionais simples e conectivos comuns.',
  B2: 'B2 — teto: 10 a 18 palavras. O aluno já entende voz passiva, condicionais complexas e linguagem hipotética, e o vocabulário pode ser abstrato.',
  C1: 'C1 — teto: registro sofisticado, ironia, atenuação, colocações idiomáticas e marcadores de discurso. O sentido pode depender do contexto.',
  C2: 'C2 — teto: registro nativo pleno, humor, ambiguidade proposital, referência cultural e variação estilística deliberada.',
}

export type DeckPromptOptions = {
  customPrompt?: string
  /** Frases que o acervo já tem no assunto. A IA é proibida de reproduzi-las ou parafraseá-las. */
  avoidPhrases?: string[]
  /** Calibra a complexidade das frases. Sem isso a IA escreve tudo no mesmo registro. */
  level?: CefrLevel
}

export function buildDeckGenerationPrompt(
  topic: string,
  count: number,
  options: DeckPromptOptions = {}
) {
  const { customPrompt = '', avoidPhrases = [], level } = options
  const levelBlock = level
    ? `\n\nCALIBRAGEM DE NÍVEL: ${CEFR_GUIDANCE[level]}\nIsso é um LIMITE de complexidade, não uma lista de estruturas a cumprir. Escreva o que um falante nativo diria naquela situação — a maior parte das frases reais, em qualquer nível, é afirmativa e direta. NUNCA force condicional, voz passiva ou inversão só para provar o nível: se a estrutura não nasce da situação, ela não entra. O que sobe com o nível é a precisão do vocabulário e a sutileza da intenção, não o peso gramatical.`
    : ''
  const avoidBlock = avoidPhrases.length
    ? `

FRASES QUE O ACERVO JÁ TEM — NÃO REPITA NENHUMA DELAS, nem com outra pontuação, nem trocando uma palavra:
${avoidPhrases.map((phrase) => `- ${phrase}`).join('\n')}

Se o tema já estiver bem coberto pela lista acima, mude o ângulo: outra situação, outro registro (mais formal ou mais informal), outro tempo verbal, outra intenção de fala. Nunca devolva variação cosmética de uma frase da lista.`
    : ''

  const userInstructions = customPrompt
    ? `\nInstruções adicionais do usuário para a geração: "${customPrompt}". Siga essas instruções ao criar as frases.`
    : ''

  return `Gere um conjunto de ${count} frases em inglês e suas traduções em português focadas no tema: "${topic}".${userInstructions}${levelBlock}${avoidBlock}
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
