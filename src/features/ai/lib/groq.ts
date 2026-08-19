/**
 * A Groq aposenta modelo sem aviso, e o erro só aparece na hora da chamada — em agosto de 2026
 * três destes já apontavam para modelos removidos (qwen3-32b e llama-3.3-70b-versatile), o que
 * deixou a geração de packs, o Blitz com IA e o teste de nivelamento quebrados em silêncio.
 * Se algum voltar a falhar com "does not exist", confira a lista viva em
 * https://api.groq.com/openai/v1/models antes de mexer em qualquer outra coisa.
 */
export const AI_MODELS = {
  deckGeneration: 'openai/gpt-oss-120b',
  tutor: 'openai/gpt-oss-120b',
  fallback: 'openai/gpt-oss-20b',
  blitz: 'openai/gpt-oss-20b',
  placement: 'openai/gpt-oss-120b',
} as const

type GroqMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type GroqChatOptions = {
  messages: GroqMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

/** Quantas vezes reesperar um 429 antes de desistir. */
const MAX_RATE_LIMIT_RETRIES = 4

/**
 * O tier gratuito da Groq dá 8000 tokens por minuto para a organização inteira — não por
 * usuário. Duas pessoas gerando ao mesmo tempo, ou uma partida de Blitz durante uma geração,
 * estouram o teto e a resposta vira 429. Sem tratamento isso chega na tela como "Falha ao
 * gerar", sem explicação e sem nada para o usuário fazer além de tentar de novo no escuro.
 *
 * A própria API diz quanto esperar ("Please try again in 1.15s"), então o certo é obedecer:
 * uma pausa curta resolve o caso comum, e o teto de tentativas evita segurar a requisição
 * para sempre quando o limite é de verdade.
 */
export function parseRetryDelayMs(message: string | undefined, header: string | null): number | null {
  const doHeader = header ? Number(header) : NaN
  if (Number.isFinite(doHeader) && doHeader > 0) return Math.ceil(doHeader * 1000)

  const match = message?.match(/try again in ([\d.]+)(ms|s)\b/i)
  if (!match) return null

  const valor = Number(match[1])
  if (!Number.isFinite(valor)) return null

  return match[2].toLowerCase() === 'ms' ? Math.ceil(valor) : Math.ceil(valor * 1000)
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

export async function createGroqChatCompletion({
  messages,
  model,
  temperature,
  maxTokens,
  jsonMode = false,
}: GroqChatOptions) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada')

  for (let tentativa = 0; ; tentativa += 1) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    })

    const data = (await response.json()) as GroqChatResponse

    if (response.status === 429 && tentativa < MAX_RATE_LIMIT_RETRIES) {
      const sugerido = parseRetryDelayMs(data.error?.message, response.headers.get('retry-after'))
      // Margem sobre o tempo sugerido: a janela é da organização toda e pode ter outra
      // requisição consumindo tokens no mesmo instante.
      await esperar(Math.min((sugerido ?? 2000) + 500, 30_000))
      continue
    }

    if (!response.ok) {
      throw new Error(`Groq API error: ${data.error?.message || response.statusText}`)
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Groq API não retornou conteúdo.')

    return content
  }
}
