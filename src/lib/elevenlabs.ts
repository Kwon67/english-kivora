import 'server-only'

import { z } from 'zod'

import { ELEVENLABS_MODEL, ELEVENLABS_VOICES } from './audioRoles'

const requestSchema = z.object({
  text: z.string().trim().min(1).max(800),
  voice: z.enum(['siren', 'lauren', 'jarnathan']),
})

export class ElevenLabsError extends Error {
  constructor(
    public readonly status: number | null,
    public readonly retryable: boolean,
  ) {
    super('Não foi possível gerar o áudio ElevenLabs.')
    this.name = 'ElevenLabsError'
  }
}

/** One request per invocation. The caller must enforce a durable budget before calling. */
export async function synthesizeElevenLabs(
  input: z.input<typeof requestSchema>,
  options: {
    signal?: AbortSignal
    onChunk?: (chunk: Uint8Array) => void
    offlineBatch?: boolean
  } = {},
) {
  const { text, voice } = requestSchema.parse(input)
  const key = process.env.ELEVENLABS_API_KEY?.trim()
  if (!key) throw new ElevenLabsError(null, false)

  let response: Response
  const timeout = AbortSignal.timeout(options.offlineBatch ? 120_000 : 20_000)
  try {
    response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICES[voice]}${options.onChunk ? '/stream' : ''}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'xi-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({ text, model_id: ELEVENLABS_MODEL }),
        signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
        redirect: 'error',
        cache: 'no-store',
      },
    )
  } catch {
    // A timeout may occur after billing. Never retry automatically without reconciliation.
    throw new ElevenLabsError(null, true)
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined)
    throw new ElevenLabsError(response.status, response.status === 429 || response.status >= 500)
  }
  const length = Number(response.headers.get('content-length') || 0)
  if (length > 2 * 1024 * 1024) {
    await response.body?.cancel().catch(() => undefined)
    throw new ElevenLabsError(response.status, false)
  }
  const reader = response.body?.getReader()
  if (!reader) throw new ElevenLabsError(response.status, false)
  const chunks: Buffer[] = []
  let bytes = 0
  let verified = false
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.length
      if (bytes > 2 * 1024 * 1024) throw new ElevenLabsError(response.status, false)
      chunks.push(Buffer.from(value))
      if (!verified && bytes >= 100) {
        const initial = Buffer.concat(chunks)
        if (initial.subarray(0, 3).toString() !== 'ID3' && !(initial[0] === 0xff && (initial[1] & 0xe0) === 0xe0))
          throw new ElevenLabsError(response.status, false)
        verified = true
        options.onChunk?.(initial)
      } else if (verified) options.onChunk?.(value)
    }
    if (!verified || (length > 0 && length !== bytes)) throw new ElevenLabsError(response.status, false)
  } catch (error) {
    await reader.cancel().catch(() => undefined)
    throw error
  } finally {
    reader.releaseLock()
  }
  const audio = Buffer.concat(chunks, bytes)
  const cost = response.headers.get('character-cost')
  const credits = cost && /^\d+$/.test(cost) ? Number(cost) : null
  return { audio, credits, requestId: response.headers.get('request-id') }
}
