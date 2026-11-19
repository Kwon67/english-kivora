import { afterEach, beforeEach, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/features/security/lib/security', () => ({ consumeRateLimit: vi.fn() }))
import { consumeRateLimit } from '@/features/security/lib/security'
import { freeSpeechConfig, reserveFreeSpeech } from './azureFreeSpeech'
const subscriptionId = '01234567-89ab-cdef-0123-456789abcdef'
const id =
  '/subscriptions/' +
  subscriptionId +
  '/resourceGroups/test/providers/Microsoft.CognitiveServices/accounts/kivora'
const config = { id, region: 'eastus', token: 'mock-arm', key: 'mock-speech' }
const voice = 'en-US-AvaMultilingualNeural'
const endpoint = 'https://kivora.cognitiveservices.azure.com'
function evidence() {
  return {
    resource: {
      id,
      location: 'eastus',
      kind: 'SpeechServices',
      sku: { name: 'F0' },
      properties: { provisioningState: 'Succeeded', customSubDomainName: 'kivora', endpoint },
    },
    subscription: { subscriptionId, state: 'Enabled', subscriptionPolicies: { spendingLimit: 'On' } },
    quota: {
      name: { value: 'SynthesizedCharacters' },
      quotaPeriod: '30.00:00:00',
      nextResetTime: new Date(Date.now() + 86400000).toISOString(),
      status: 'Included',
      unit: 'Count',
      currentValue: 500,
      limit: 500000,
    },
    voices: [{ ShortName: voice, Locale: 'en-US', VoiceType: 'Neural', Status: 'GA' }],
  }
}
function install(data: ReturnType<typeof evidence>) {
  const get = vi.fn(async (url: string, opts: RequestInit) => {
    expect(opts.method ?? 'GET').toBe('GET')
    expect(opts.redirect).toBe('error')
    if (url.startsWith(endpoint + '/tts/')) return Response.json(data.voices)
    if (!url.startsWith('https://management.azure.com/')) throw Error('Destino inesperado')
    return Response.json(
      url.includes('/usages?')
        ? { value: [data.quota] }
        : url.includes('/accounts/')
          ? data.resource
          : data.subscription,
    )
  })
  vi.stubGlobal('fetch', get)
  return get
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(consumeRateLimit).mockResolvedValue({
    allowed: true,
    source: 'persistent',
    requestCount: 1,
    retryAfterSeconds: 0,
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
it('credentials and an asserted F0 tier alone cannot enable fallback', () => {
  vi.stubEnv('AZURE_SPEECH_F0_ENABLED', 'false')
  vi.stubEnv('AZURE_SPEECH_KEY', 'example')
  vi.stubEnv('AZURE_SPEECH_REGION', 'eastus')
  expect(freeSpeechConfig()).toBeNull()
})
it('binds the POST destination to the verified F0 resource and reserves conservative character slots', async () => {
  const data = evidence()
  const get = install(data)
  expect(await reserveFreeSpeech(config, voice, 'Hello')).toBe(endpoint + '/tts/cognitiveservices/v1')
  expect(get).toHaveBeenCalledTimes(4)
  expect(consumeRateLimit).toHaveBeenCalledWith(
    'speech_f0_chars',
    expect.stringMatching(/^[a-f0-9]{64}:[0-9]+$/),
    Math.floor((450000 - 500) / 1600),
    expect.any(Number),
  )
})
it.each([
  [
    'paid tier',
    (d: ReturnType<typeof evidence>) => {
      d.resource.sku.name = 'S0'
    },
  ],
  [
    'different region',
    (d: ReturnType<typeof evidence>) => {
      d.resource.location = 'westus'
    },
  ],
  [
    'billing unprotected',
    (d: ReturnType<typeof evidence>) => {
      d.subscription.subscriptionPolicies.spendingLimit = 'Off'
    },
  ],
  [
    'unbound endpoint',
    (d: ReturnType<typeof evidence>) => {
      d.resource.properties.endpoint = 'https://elsewhere.example'
    },
  ],
  [
    'unknown quota',
    (d: ReturnType<typeof evidence>) => {
      d.quota.name.value = 'Speech.Transactions'
    },
  ],
  [
    'overage status',
    (d: ReturnType<typeof evidence>) => {
      d.quota.status = 'InOverage'
    },
  ],
  [
    'missing headroom',
    (d: ReturnType<typeof evidence>) => {
      d.quota.currentValue = 449000
    },
  ],
  [
    'expired period',
    (d: ReturnType<typeof evidence>) => {
      d.quota.nextResetTime = '2020-01-01T00:00:00Z'
    },
  ],
  [
    'unavailable neural voice',
    (d: ReturnType<typeof evidence>) => {
      d.voices = []
    },
  ],
] as const)('blocks %s before reserving any characters', async (_name, change) => {
  const data = evidence()
  change(data)
  install(data)
  await expect(reserveFreeSpeech(config, voice, 'Hello')).rejects.toThrow()
  expect(consumeRateLimit).not.toHaveBeenCalled()
})
it('rejects HD and oversized requests without contacting Microsoft', async () => {
  const get = install(evidence())
  for (const [name, text] of [
    ['en-US-Ava:DragonHDLatestNeural', 'Hello'],
    [voice, 'a'.repeat(801)],
  ])
    await expect(reserveFreeSpeech(config, name, text)).rejects.toThrow()
  expect(get).not.toHaveBeenCalled()
})
it('rejects a missing shared counter and an exhausted reservation', async () => {
  install(evidence())
  for (const state of [
    { allowed: true, source: 'memory' },
    { allowed: false, source: 'persistent' },
  ] as const) {
    vi.mocked(consumeRateLimit).mockResolvedValue({ ...state, requestCount: 1, retryAfterSeconds: 20 })
    await expect(reserveFreeSpeech(config, voice, 'Hello')).rejects.toThrow('Reserva')
  }
})

it('blocks a fresh clip if the global monthly reservation is refused', async () => {
  install(evidence())
  vi.mocked(consumeRateLimit)
    .mockResolvedValueOnce({ source: 'persistent', allowed: true, requestCount: 1, retryAfterSeconds: 0 })
    .mockResolvedValueOnce({
      source: 'persistent',
      allowed: false,
      requestCount: 282,
      retryAfterSeconds: 100,
    })
  await expect(reserveFreeSpeech(config, voice, 'Hello')).rejects.toThrow('Reserva')
  expect(consumeRateLimit).toHaveBeenCalledTimes(2)
})
