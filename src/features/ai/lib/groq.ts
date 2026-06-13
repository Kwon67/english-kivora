export const AI_MODELS = {
  deckGeneration: 'qwen/qwen3-32b',
  tutor: 'openai/gpt-oss-120b',
  fallback: 'llama-3.3-70b-versatile',
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

  if (!response.ok) {
    throw new Error(`Groq API error: ${data.error?.message || response.statusText}`)
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Groq API não retornou conteúdo.')

  return content
}
