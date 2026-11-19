import { afterEach, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
import { synthesizeElevenLabs } from './elevenlabs'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

it('uses the selected voice and v4 without exposing the secret in the URL', async () => {
  vi.stubEnv('ELEVENLABS_API_KEY', 'test-secret')
  const fetchMock = vi.fn().mockResolvedValue(new Response(Buffer.concat([Buffer.from('ID3'), Buffer.alloc(200)])))
  vi.stubGlobal('fetch', fetchMock)
  await synthesizeElevenLabs({ text: 'Hello.', voice: 'lauren' })
  const [url, options] = fetchMock.mock.calls[0]
  expect(url).toContain('DODLEQrClDo8wCz460ld')
  expect(url).not.toContain('test-secret')
  expect(JSON.parse(options.body)).toEqual({ text: 'Hello.', model_id: 'eleven_v4' })
})

it('reports rate limits without automatically repeating a paid request', async () => {
  vi.stubEnv('ELEVENLABS_API_KEY', 'test-secret')
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 429 }))
  vi.stubGlobal('fetch', fetchMock)
  await expect(synthesizeElevenLabs({ text: 'Hello.', voice: 'siren' })).rejects.toMatchObject({ status: 429, retryable: true })
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('delivers valid MP3 frames before the mocked provider finishes and propagates cancellation',async()=>{
  vi.stubEnv('ELEVENLABS_API_KEY','fixture')
  const source=Promise.withResolvers<ReadableStreamDefaultController<Uint8Array>>()
  const received=Promise.withResolvers<void>()
  const abort=new AbortController()
  const upstream=vi.fn(async (_url:string,options:RequestInit)=>new Response(new ReadableStream({
    start(c){source.resolve(c);options.signal?.addEventListener('abort',()=>c.error(Error('aborted')))},
  })))
  vi.stubGlobal('fetch',upstream)
  const pending=synthesizeElevenLabs({text:'A short reply.',voice:'jarnathan'},{signal:abort.signal,onChunk:()=>received.resolve()})
  ;(await source.promise).enqueue(Buffer.concat([Buffer.from('ID3'),Buffer.alloc(128)]))
  await received.promise
  expect(upstream.mock.calls[0][0]).toContain('/stream?')
  abort.abort()
  await expect(pending).rejects.toThrow()
  expect(upstream).toHaveBeenCalledTimes(1)
})
