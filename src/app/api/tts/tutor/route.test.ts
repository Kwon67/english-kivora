import { beforeEach, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/features/security/lib/security', () => ({
  consumeRateLimit: vi.fn().mockResolvedValue({allowed:true,source:'persistent'}),
  getSecurityBlock: vi.fn().mockResolvedValue({ blocked: false }),
}))
vi.mock('@/lib/tutorSpeech', () => ({ tutorPremiumAudio: vi.fn() }))
vi.mock('@/lib/tts', async (orig) => ({
  ...(await orig<typeof import('@/lib/tts')>()),
  getTtsProviderConfig: () => ({ provider:'azure-f0' }),
  synthesizeSpeechToBuffer: vi.fn(),
}))
import { createClient } from '@/lib/supabase/server'
import { tutorPremiumAudio } from '@/lib/tutorSpeech'
import { synthesizeSpeechToBuffer } from '@/lib/tts'
import { POST } from './route'

const req = (text = 'A reply.', scenario = 'coffee-shop') =>
  new Request('http://localhost/api/tts/tutor', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, scenario }),
  })
const account = (id: string | null) =>
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: id ? { id } : null } }) },
  } as unknown as Awaited<ReturnType<typeof createClient>>)
beforeEach(() => {
  vi.clearAllMocks()
  account('alice')
})
it('rejects anonymous requests and unknown scenarios before synthesis', async () => {
  account(null)
  expect((await POST(req())).status).toBe(401)
  account('alice')
  expect((await POST(req('Hello', 'invalid'))).status).toBe(400)
  expect(tutorPremiumAudio).not.toHaveBeenCalled()
  expect(synthesizeSpeechToBuffer).not.toHaveBeenCalled()
})
it('uses the legacy voice when the premium provider declines the request', async () => {
  vi.mocked(tutorPremiumAudio).mockResolvedValue(null)
  vi.mocked(synthesizeSpeechToBuffer).mockResolvedValue(Buffer.from('fallback'))
  const r = await POST(req())
  expect(await r.text()).toBe('fallback')
  expect(tutorPremiumAudio).toHaveBeenCalledWith(
    'alice',
    'A reply.',
    'lauren',
    expect.any(AbortSignal),
    'coffee-shop',
    expect.any(Function),
  )
  expect(synthesizeSpeechToBuffer).toHaveBeenCalledWith('A reply.', 'lauren', expect.any(AbortSignal))
})

it('starts sending bytes before synthesis completes', async () => {
  const done = Promise.withResolvers<void>()
  vi.mocked(tutorPremiumAudio).mockImplementation(async (_user, _text, _voice, _signal, _session, onChunk) => {
    onChunk?.(Uint8Array.from([1, 2, 3]))
    await done.promise
    onChunk?.(Uint8Array.from([4]))
    return Buffer.from([1, 2, 3, 4])
  })
  const response = await POST(req())
  const reader = response.body!.getReader()
  expect(Array.from((await reader.read()).value!)).toEqual([1, 2, 3])
  done.resolve()
  expect(Array.from((await reader.read()).value!)).toEqual([4])
  expect((await reader.read()).done).toBe(true)
  expect(synthesizeSpeechToBuffer).not.toHaveBeenCalled()
})

it('only spends on authenticated Tutor replies or known openings', async () => {
  vi.stubEnv('ELEVENLABS_TUTOR_ENABLED', 'true')
  vi.stubEnv('ELEVENLABS_API_KEY', 'local-mock')
  try {
    vi.mocked(synthesizeSpeechToBuffer).mockResolvedValue(Buffer.from('legacy'))
    expect(await (await POST(req('Arbitrary client text.'))).text()).toBe('legacy')
    expect(tutorPremiumAudio).not.toHaveBeenCalled()
    const { issueTutorAudioPermit, validTutorAudioPermit } = await import('@/lib/tutorAudioPermit')
    const token = issueTutorAudioPermit('alice', 'coffee-shop', 'A reply.')
    expect(validTutorAudioPermit(token, 'alice', 'coffee-shop', 'A reply.')).toBe(true)
    expect(validTutorAudioPermit(token, 'bob', 'coffee-shop', 'A reply.')).toBe(false)
    expect(validTutorAudioPermit(token, 'alice', 'coffee-shop', 'Another reply.')).toBe(false)
  } finally {
    vi.unstubAllEnvs()
  }
})

it('blocks a dynamic free reply when the learner has used the daily allowance', async () => {
  const {consumeRateLimit}=await import('@/features/security/lib/security')
  vi.mocked(consumeRateLimit).mockResolvedValueOnce({allowed:false,source:'persistent',requestCount:21,retryAfterSeconds:90})
  vi.mocked(tutorPremiumAudio).mockResolvedValue(null)
  expect((await POST(req())).status).toBe(503)
  expect(consumeRateLimit).toHaveBeenCalledWith('tutor_free_voice','alice',20,86400)
  expect(synthesizeSpeechToBuffer).not.toHaveBeenCalled()
})
