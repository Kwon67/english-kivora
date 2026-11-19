import { afterEach, beforeEach, it, vi, expect } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/features/security/lib/security', () => ({ consumeRateLimit: vi.fn() }))
vi.mock('./elevenlabs', () => ({ synthesizeElevenLabs: vi.fn() }))
import { consumeRateLimit } from '@/features/security/lib/security'
import { synthesizeElevenLabs } from './elevenlabs'
import { tutorPremiumAudio } from './tutorSpeech'
import { ELEVENLABS_VOICES } from './audioRoles'
const signal = new AbortController().signal
beforeEach(() => {
  vi.stubEnv('ELEVENLABS_TUTOR_ENABLED', 'true')
  vi.stubEnv('ELEVENLABS_TUTOR_CREDITS', '640')
  vi.stubEnv('ELEVENLABS_API_KEY', 'test-only')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      Response.json(
        url.endsWith('subscription')
          ? {
              next_character_count_reset_unix: Math.floor(Date.now() / 1000) + 8000,
              character_limit: 10000,
              character_count: 100,
            }
          : url.endsWith('models')
            ? [{ model_id: 'eleven_v4', token_cost_factor: 1 }]
            : { voice_id: ELEVENLABS_VOICES.lauren, sharing: { rate: 1 } },
      ),
    ),
  )
  vi.mocked(consumeRateLimit).mockResolvedValue({
    allowed: true,
    requestCount: 1,
    retryAfterSeconds: 0,
    source: 'persistent',
  })
  vi.mocked(synthesizeElevenLabs).mockResolvedValue({ audio: Buffer.from('test'), credits: 2, requestId: 'test' })
})
afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
it('makes no provider or database requests while disabled or without a budget', async () => {
  vi.stubEnv('ELEVENLABS_TUTOR_ENABLED', '')
  expect(await tutorPremiumAudio('alice', 'Hello', 'lauren', signal)).toBeNull()
  vi.stubEnv('ELEVENLABS_TUTOR_ENABLED', 'true')
  vi.stubEnv('ELEVENLABS_TUTOR_CREDITS', '')
  expect(await tutorPremiumAudio('alice', 'Hello', 'lauren', signal)).toBeNull()
  expect(consumeRateLimit).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})
it('requires durable reservations and fails closed when the global allocation runs out', async () => {
  vi.mocked(consumeRateLimit).mockResolvedValueOnce({
    allowed: true,
    source: 'memory',
    requestCount: 1,
    retryAfterSeconds: 0,
  })
  expect(await tutorPremiumAudio('alice', 'Try one', 'lauren', signal)).toBeNull()
  vi.mocked(consumeRateLimit).mockImplementation(async (action) => ({
    allowed: action !== 'tutor_voice_budget',
    source: 'persistent',
    requestCount: 3,
    retryAfterSeconds: 0,
  }))
  expect(await tutorPremiumAudio('alice', 'Try two', 'lauren', signal)).toBeNull()
  expect(synthesizeElevenLabs).not.toHaveBeenCalled()
})
it('coalesces concurrent playback and caches privately per user', async () => {
  await Promise.all([1, 2].map(() => tutorPremiumAudio('alice', 'Private reply', 'lauren', signal)))
  await tutorPremiumAudio('alice', 'Private reply', 'lauren', signal)
  expect(synthesizeElevenLabs).toHaveBeenCalledTimes(1)
  await tutorPremiumAudio('bob', 'Private reply', 'lauren', signal)
  expect(synthesizeElevenLabs).toHaveBeenCalledTimes(2)
})
