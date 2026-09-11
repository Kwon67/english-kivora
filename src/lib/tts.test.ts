import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const edgeMocks = vi.hoisted(() => ({
  synthesize: vi.fn(),
  terminate: vi.fn(),
  constructor: vi.fn(),
}))
vi.mock('node-edge-tts', () => ({
  EdgeTTS: class {
    constructor(options: unknown) { edgeMocks.constructor(options) }
    async _connectWebSocket() { return { terminate: edgeMocks.terminate } }
    async ttsPromise(text: string, audioPath: string) {
      await this._connectWebSocket()
      return edgeMocks.synthesize(text, audioPath)
    }
  },
}))

const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(200)])

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv('TTS_PROVIDER', 'auto')
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
    expect(url).toBe('https://brazilsouth.tts.speech.microsoft.com/cognitiveservices/v1')
    expect(request.headers['Ocp-Apim-Subscription-Key']).toBe('test-only-speech-key')
    expect(request.headers['X-Microsoft-OutputFormat']).toBe('audio-24khz-48kbitrate-mono-mp3')
    expect(request.body).toContain('Tom &amp; I &lt;read&gt; &quot;books&quot;.')
    expect(request.signal).toBeInstanceOf(AbortSignal)
    expect(edgeMocks.constructor).not.toHaveBeenCalled()
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
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockImplementation(async () => new Response(mp3))
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')

    await expect(synthesizeSpeechToBuffer('Try again.')).rejects.toMatchObject({ retryable: true })
    await synthesizeSpeechToBuffer('Try again.')
    await vi.advanceTimersByTimeAsync(3_600_001)
    await synthesizeSpeechToBuffer('Try again.')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('reports Azure configuration/auth failures without silently using another provider', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('secret upstream text', { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')
    await expect(synthesizeSpeechToBuffer('Hello.')).rejects.toMatchObject({
      code: 'provider', retryable: false, message: 'Microsoft Azure Speech indisponível (HTTP 401).',
    })
    expect(edgeMocks.constructor).not.toHaveBeenCalled()

    vi.stubEnv('AZURE_SPEECH_REGION', '')
    await expect(synthesizeSpeechToBuffer('Hello.')).rejects.toMatchObject({ code: 'configuration' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects non-audio responses and surfaces request deadlines', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('<html>upstream error</html>'.repeat(20)))
      .mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'))
    vi.stubGlobal('fetch', fetchMock)
    const { synthesizeSpeechToBuffer } = await import('./tts')
    await expect(synthesizeSpeechToBuffer('Hello.')).rejects.toMatchObject({ code: 'provider' })
    await expect(synthesizeSpeechToBuffer('Hello.')).rejects.toMatchObject({ code: 'timeout', retryable: true })
  })

  it('bounds Edge synthesis and closes its socket after a timeout', async () => {
    vi.useFakeTimers()
    vi.stubEnv('TTS_PROVIDER', 'edge')
    edgeMocks.synthesize.mockImplementation(() => new Promise(() => undefined))
    const { synthesizeSpeechToBuffer } = await import('./tts')
    const pending = synthesizeSpeechToBuffer('Hello.')
    const rejected = expect(pending).rejects.toMatchObject({ code: 'timeout', retryable: true })
    await vi.advanceTimersByTimeAsync(20_001)
    await rejected
    expect(edgeMocks.terminate).toHaveBeenCalledOnce()
    expect(edgeMocks.constructor).toHaveBeenCalledWith(expect.objectContaining({ lang: 'en-US', timeout: 20_000 }))
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
