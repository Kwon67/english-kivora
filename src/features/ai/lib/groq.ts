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

export type GroqChatOptions = {
  messages: GroqMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
  /** Total wall-clock budget, including rate-limit waits and response parsing. */
  timeoutMs?: number
  maxRetries?: number
  /** Supported by GPT-OSS models; local semantic checks remain necessary. */
  jsonSchema?: { name: string; schema: Record<string, unknown> }
}

/** Quantas vezes reesperar um 429 antes de desistir. */
const MAX_RATE_LIMIT_RETRIES = 4

export class GroqApiError extends Error {
  constructor(message: string, readonly status: number, readonly retryAfterMs: number | null = null) {
    super(message)
    this.name = 'GroqApiError'
  }
}

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
    finish_reason?: string
    message?: {
      content?: string
      refusal?: string
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
  timeoutMs = 60_000,
  maxRetries = MAX_RATE_LIMIT_RETRIES,
  jsonSchema,
}: GroqChatOptions) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada')

  const budget = Number.isFinite(timeoutMs) ? Math.min(180_000, Math.max(1, Math.floor(timeoutMs))) : 60_000
  const deadline = Date.now() + budget
  const retries = Number.isFinite(maxRetries) ? Math.min(MAX_RATE_LIMIT_RETRIES, Math.max(0, Math.floor(maxRetries))) : 0
  for (let tentativa = 0; ; tentativa += 1) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw new GroqApiError('Groq: tempo limite excedido. Tente novamente em instantes.', 408)
    const signal = AbortSignal.timeout(remaining)
    let response: Response
    let data: GroqChatResponse
    try {
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_completion_tokens: maxTokens,
        ...(jsonSchema ? { response_format: { type: 'json_schema', json_schema: { ...jsonSchema, strict: true } } }
          : jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal,
    })
    try {
      data = (await response.json()) as GroqChatResponse
    } catch {
      if (signal.aborted) throw new GroqApiError('Groq: tempo limite excedido. Tente novamente em instantes.', 408)
      throw new GroqApiError(`Groq API retornou resposta inválida (${response.status}).`, response.status)
    }
    if (!data || typeof data !== 'object') throw new GroqApiError('Groq API retornou resposta inválida.', response.status)
    } catch (error) {
      if (signal.aborted) throw new GroqApiError('Groq: tempo limite excedido. Tente novamente em instantes.', 408)
      throw error
    }

    if (response.status === 429 && tentativa < retries) {
      const sugerido = parseRetryDelayMs(data.error?.message, response.headers.get('retry-after'))
      // Margem sobre o tempo sugerido: a janela é da organização toda e pode ter outra
      // requisição consumindo tokens no mesmo instante.
      const delay = (sugerido ?? 2000) + 500
      // Never retry earlier than Retry-After, or keep a server request open beyond its budget.
      if (delay >= deadline - Date.now()) {
        throw new GroqApiError('Groq: limite temporário de uso. Tente novamente mais tarde.', 429, sugerido)
      }
      await esperar(delay)
      continue
    }

    if (!response.ok) {
      throw new GroqApiError(`Groq API error: ${data.error?.message || response.statusText}`, response.status,
        parseRetryDelayMs(data.error?.message, response.headers.get('retry-after')))
    }

    const content = data.choices?.[0]?.message?.content
    if (data.choices?.[0]?.finish_reason === 'length') throw new GroqApiError('Groq API retornou conteúdo incompleto.', 422)
    if (data.choices?.[0]?.message?.refusal) throw new GroqApiError('Groq API não aprovou este conteúdo.', 422)
    if (!content) throw new Error('Groq API não retornou conteúdo.')

    return content
  }
}
