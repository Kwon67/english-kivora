import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { reserve } = vi.hoisted(() => ({ reserve: vi.fn() }))
vi.mock('./azureFreeSpeech', async (orig) => ({
  ...(await orig<typeof import('./azureFreeSpeech')>()),
  reserveFreeSpeech: reserve,
}))

const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(200)])

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  reserve.mockResolvedValue('https://kivora.cognitiveservices.azure.com/tts/cognitiveservices/v1')
  vi.stubEnv('AZURE_SPEECH_F0_ENABLED', 'true')
  vi.stubEnv('AZURE_SPEECH_ARM_TOKEN', 'mock')
  vi.stubEnv(
    'AZURE_SPEECH_RESOURCE_ID',
    '/subscriptions/01234567-89ab-cdef-0123-456789abcdef/resourceGroups/test/providers/Microsoft.CognitiveServices/accounts/test',
  )
  vi.stubEnv('AZURE_SPEECH_KEY', 'test-only-speech-key')
  vi.stubEnv('AZURE_SPEECH_REGION', 'brazilsouth')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Microsoft speech synthesis', () => {
  it('uses the official Azure endpoint, escapes SSML and returns an MP3', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(mp3))
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')

    await expect(synthesizeSpeechToBuffer('Tom & I <read> "books".')).resolves.toEqual(mp3)

    const [url, request] = fetchMock.mock.calls[0]
    expect(url).toBe('https://kivora.cognitiveservices.azure.com/tts/cognitiveservices/v1')
    expect(request.headers['Ocp-Apim-Subscription-Key']).toBe('test-only-speech-key')
    expect(request.headers['X-Microsoft-OutputFormat']).toBe('audio-24khz-48kbitrate-mono-mp3')
    expect(request.body).toContain('Tom &amp; I &lt;read&gt; &quot;books&quot;.')
    expect(request.signal).toBeInstanceOf(AbortSignal)
    expect(reserve).toHaveBeenCalledOnce()
  })

  it('coalesces concurrent requests and caches the same phrase and voice', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(mp3))
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')

    await Promise.all([synthesizeSpeechToBuffer('Hello.'), synthesizeSpeechToBuffer(' Hello. ')])
    await synthesizeSpeechToBuffer('Hello.')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await synthesizeSpeechToBuffer('Hello.', 'en-US-AriaNeural')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('expires cached audio and does not cache provider failures', async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockImplementation(async () => new Response(mp3))
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')

    const retryPhrase = () => synthesizeSpeechToBuffer('Try again.', 'en-US-RogerNeural')
    await expect(retryPhrase()).rejects.toMatchObject({ retryable: true })
    await retryPhrase()
    await vi.advanceTimersByTimeAsync(3_600_001)
    await retryPhrase()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('reports Azure configuration/auth failures without silently using another provider', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('secret upstream text', { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')
    await expect(synthesizeSpeechToBuffer('Hello.')).rejects.toMatchObject({
      code: 'provider',
      retryable: false,
      message: 'Microsoft Azure Speech indisponível (HTTP 401).',
    })
    expect(reserve).toHaveBeenCalledOnce()

    vi.stubEnv('AZURE_SPEECH_REGION', '')
    await expect(synthesizeSpeechToBuffer('Hello.')).rejects.toMatchObject({ code: 'configuration' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects non-audio responses and surfaces request deadlines', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('<html>upstream error</html>'.repeat(20)))
      .mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'))
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')
    await expect(synthesizeSpeechToBuffer('Hello.')).rejects.toMatchObject({ code: 'provider' })
    await expect(synthesizeSpeechToBuffer('Hello.')).rejects.toMatchObject({
      code: 'timeout',
      retryable: true,
    })
  })

  it('blocks legacy Edge settings and refuses synthesis without a verified reservation', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')
    reserve.mockRejectedValue(Error('unknown quota'))
    await expect(synthesizeSpeechToBuffer('An unpublished example.')).rejects.toMatchObject({
      code: 'configuration',
    })
    vi.stubEnv('AZURE_SPEECH_F0_ENABLED', 'false')
    vi.stubEnv('TTS_PROVIDER', 'edge')
    await expect(synthesizeSpeechToBuffer('An unpublished example.')).rejects.toMatchObject({
      code: 'configuration',
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(reserve).toHaveBeenCalledOnce()
  })

  it('validates all caller-supplied text and voice before calling the provider', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')
    await expect(synthesizeSpeechToBuffer(' ')).rejects.toThrow()
    await expect(synthesizeSpeechToBuffer('a'.repeat(801))).rejects.toThrow()
    await expect(synthesizeSpeechToBuffer('Hello.', '<voice>')).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

it('uses the exact published premium recording through the regular server TTS entry point', async () => {
  const { synthesizeSpeechToBuffer } = await import('./tts')
  const { WELCOME_TEXT } = await import('./audioRoles')
  const { staticAudioUrl } = await import('./staticAudio')
  const { readFile } = await import('node:fs/promises')
  const provider = vi.fn()
  vi.stubGlobal('fetch', provider)
  vi.stubEnv('VERCEL', '')
  for (const voice of ['siren', 'lauren', 'jarnathan'] as const) {
    expect(await synthesizeSpeechToBuffer(WELCOME_TEXT, voice)).toEqual(
      await readFile('public' + staticAudioUrl(WELCOME_TEXT, voice)),
    )
  }
  expect(provider).not.toHaveBeenCalled()
})

it('cancelling one listener preserves the shared recording for another', async () => {
  const ready = Promise.withResolvers<void>()
  const upstream = Promise.withResolvers<Response>()
  const send = vi.fn((_url: string, init: RequestInit) => {
    ready.resolve()
    expect(init.signal?.aborted).toBe(false)
    return upstream.promise
  })
  vi.stubGlobal('fetch', send)
  const { synthesizeSpeechToBuffer } = await import('./tts')
  const first = new AbortController()
  const one = synthesizeSpeechToBuffer('An unpublished shared example.', 'lauren', first.signal)
  const two = synthesizeSpeechToBuffer('An unpublished shared example.', 'lauren')
  await ready.promise
  first.abort()
  await expect(one).rejects.toMatchObject({ name: 'AbortError' })
  expect(send.mock.calls[0][1].signal?.aborted).toBe(false)
  upstream.resolve(new Response(mp3))
  expect(await two).toEqual(mp3)
  expect(send).toHaveBeenCalledOnce()
})

it('cancelling the last listener during quota checks prevents synthesis', async () => {
  const allowed = Promise.withResolvers<string>()
  reserve.mockReturnValue(allowed.promise)
  const send = vi.fn()
  vi.stubGlobal('fetch', send)
  const { synthesizeSpeechToBuffer } = await import('./tts')
  const controller = new AbortController()
  const audio = synthesizeSpeechToBuffer('An unpublished cancelled example.', 'siren', controller.signal)
  controller.abort()
  await expect(audio).rejects.toMatchObject({ name: 'AbortError' })
  allowed.resolve('https://kivora.cognitiveservices.azure.com/tts/cognitiveservices/v1')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(send).not.toHaveBeenCalled()
})
