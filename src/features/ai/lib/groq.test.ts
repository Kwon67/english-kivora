import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGroqChatCompletion, parseRetryDelayMs } from './groq'

describe('parseRetryDelayMs', () => {
  it('lê os segundos que a própria mensagem da Groq sugere', () => {
    expect(parseRetryDelayMs('Rate limit reached. Please try again in 1.155s.', null)).toBe(1155)
  })

  it('entende a sugestão em milissegundos', () => {
    expect(parseRetryDelayMs('Please try again in 480ms.', null)).toBe(480)
  })

  it('prefere o cabeçalho retry-after quando ele vem', () => {
    expect(parseRetryDelayMs('Please try again in 1s.', '7')).toBe(7000)
  })

  it('devolve null quando não há dica nenhuma', () => {
    expect(parseRetryDelayMs('Something went wrong', null)).toBeNull()
  })

  it('ignora cabeçalho inválido e cai na mensagem', () => {
    expect(parseRetryDelayMs('Please try again in 2s.', 'abc')).toBe(2000)
  })
})

describe('createGroqChatCompletion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  const options = { model: 'openai/gpt-oss-120b', messages: [{ role: 'user' as const, content: 'Return a JSON object.' }] }

  it('keeps the key on the server and supports strict structured responses', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] })))
    vi.stubGlobal('fetch', fetchMock)
    const schema = { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false }
    expect(await createGroqChatCompletion({ ...options, maxTokens: 500, jsonSchema: { name: 'result', schema } })).toBe('{"ok":true}')
    const request = fetchMock.mock.calls[0][1]
    expect(request.signal).toBeInstanceOf(AbortSignal)
    expect(JSON.parse(request.body)).toMatchObject({ max_completion_tokens: 500, response_format: { type: 'json_schema', json_schema: { name: 'result', strict: true, schema } } })
    expect(request.body).not.toContain('test-key')
  })

  it('does not retry a rate limit sooner than retry-after or beyond the total deadline', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Rate limit.' } }), { status: 429, headers: { 'retry-after': '90' } }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(createGroqChatCompletion({ ...options, timeoutMs: 2000 })).rejects.toMatchObject({ status: 429, retryAfterMs: 90_000 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('honors zero retries', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Rate limit.' } }), { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(createGroqChatCompletion({ ...options, maxRetries: 0 })).rejects.toMatchObject({ status: 429 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('aborts a hung provider request', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason))
    })))
    await expect(createGroqChatCompletion({ ...options, timeoutMs: 10 })).rejects.toMatchObject({ status: 408 })
  })

  it('rejects truncated completions and malformed provider bodies', async () => {
    vi.stubEnv('GROQ_API_KEY', 'test-key')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: '{"cards":' } }] })))
      .mockResolvedValueOnce(new Response('<html>Unavailable</html>', { status: 502 }))
      .mockResolvedValueOnce(new Response('null')))
    await expect(createGroqChatCompletion(options)).rejects.toMatchObject({ status: 422 })
    await expect(createGroqChatCompletion(options)).rejects.toMatchObject({ status: 502 })
    await expect(createGroqChatCompletion(options)).rejects.toThrow('resposta inválida')
  })
})
