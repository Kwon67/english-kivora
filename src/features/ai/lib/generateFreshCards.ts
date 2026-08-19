import { AI_MODELS, createGroqChatCompletion } from './groq'
import {
  buildDeckGenerationPrompt,
  parseGeneratedCards,
  type CefrLevel,
  type GeneratedCard,
} from './deckGeneration'
import { splitByCoverage } from './phraseCoverage'

const SYSTEM_PROMPT =
  'Você é um professor de inglês especialista em criar materiais de estudo para brasileiros. Sempre gere traduções 100% naturais em português brasileiro (pt-BR), nunca literais. Retorne apenas JSON válido.'

/** Quantas rodadas tentar antes de entregar menos frases do que o pedido. */
export const MAX_GENERATION_ROUNDS = 3

export type FreshGenerationResult = {
  cards: GeneratedCard[]
  /** Quantas frases a IA devolveu e foram descartadas por já existirem. */
  discarded: number
  rounds: number
}

/**
 * Gera frases garantidamente novas para um tema.
 *
 * A diferença para uma chamada solta à IA está no laço. Pedir 10 frases e receber 3 repetidas
 * antes deixava 3 duplicatas entrarem no banco; agora elas são descartadas e o que falta é
 * pedido de novo, com as repetidas somadas à lista de proibição para o modelo não insistir nelas.
 *
 * O laço tem teto porque um tema pequeno realmente se esgota — depois de algumas rodadas sem
 * material novo, entregar 6 frases inéditas é melhor do que 10 com 4 repetidas.
 */
export async function generateFreshCards({
  topic,
  count,
  customPrompt = '',
  avoidPhrases,
  level,
  model = AI_MODELS.deckGeneration,
  maxRounds = MAX_GENERATION_ROUNDS,
}: {
  topic: string
  count: number
  customPrompt?: string
  avoidPhrases: string[]
  level?: CefrLevel
  /**
   * A cota da Groq é por modelo, não por conta. Quando um modelo estoura o limite por minuto,
   * outro ainda responde na hora — é o que torna a semeadura em lote viável no tier gratuito.
   */
  model?: string
  maxRounds?: number
}): Promise<FreshGenerationResult> {
  const aprovadas: GeneratedCard[] = []
  const proibidas = [...avoidPhrases]
  let discarded = 0
  let rounds = 0

  while (aprovadas.length < count && rounds < maxRounds) {
    rounds += 1
    const faltam = count - aprovadas.length

    const mensagens = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: buildDeckGenerationPrompt(topic, faltam, {
          customPrompt,
          avoidPhrases: proibidas,
          level,
        }),
      },
    ]

    let content: string
    try {
      content = await createGroqChatCompletion({ model, temperature: 0.7, jsonMode: true, messages: mensagens })
    } catch (erro) {
      // O modo JSON da Groq rejeita a resposta inteira quando o modelo escapa mal uma aspa —
      // e isso acontece justamente nos temas cheios de citação e trocadilho, que são conteúdo
      // legítimo. Sem o modo estrito o modelo responde, e `parseGeneratedCards` extrai o objeto
      // do meio do texto. Só vale para essa falha específica: qualquer outro erro sobe.
      const ehFalhaDeJson = erro instanceof Error && /validate JSON/i.test(erro.message)
      if (!ehFalhaDeJson) throw erro

      content = await createGroqChatCompletion({ model, temperature: 0.7, jsonMode: false, messages: mensagens })
    }

    const geradas = parseGeneratedCards(content)
    if (geradas.length === 0) break

    const { fresh, rejected } = splitByCoverage(geradas, [
      ...proibidas,
      ...aprovadas.map((card) => card.en),
    ])

    discarded += rejected.length
    aprovadas.push(...fresh.slice(0, faltam))
    proibidas.push(...rejected.map((entry) => entry.card.en))

    // Rodada inteira repetida: o tema se esgotou, insistir só queima chamada de API.
    if (fresh.length === 0) break
  }

  return { cards: aprovadas, discarded, rounds }
}
