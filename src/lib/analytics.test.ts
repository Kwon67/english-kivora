import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveAnalyticsEndpoint } from './analyticsEndpoint'

const calls: unknown[][] = []
const sdk = {
  init: vi.fn(),
  capture: (event: string) => calls.push(['capture', event]),
  identify: (id: string) => calls.push(['identify', id]),
  reset: () => calls.push(['reset']),
}

afterEach(() => {
  vi.doUnmock('posthog-js')
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  sdk.init.mockClear()
  calls.length = 0
})

describe('analytics loading', () => {
  it('never loads the SDK when no public key is configured', async () => {
    vi.stubGlobal('window', {})
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')
    const load = vi.fn(() => ({ default: sdk }))
    vi.doMock('posthog-js', load)
    const analytics = await import('./analytics')

    analytics.initAnalytics()
    analytics.trackEvent(analytics.ANALYTICS_EVENT.SESSION_STARTED)
    analytics.resetAnalytics()

    expect(analytics.isAnalyticsEnabled()).toBe(false)
    expect(load).not.toHaveBeenCalled()
  })

  it('preserves capture, identity and logout order while a single SDK loads', async () => {
    vi.stubGlobal('window', {})
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'fixture-key')
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://analytics.example.test')
    let release = () => {}
    const blocked = new Promise<void>(resolve => { release = resolve })
    const load = vi.fn(async () => {
      await blocked
      return { default: sdk }
    })
    vi.doMock('posthog-js', load)
    const analytics = await import('./analytics')

    analytics.trackEvent(analytics.ANALYTICS_EVENT.SESSION_STARTED)
    analytics.identifyUser('fixture-user')
    analytics.initAnalytics()
    analytics.trackEvent(analytics.ANALYTICS_EVENT.REVIEW_COMPLETED)
    analytics.resetAnalytics()
    analytics.trackEvent(analytics.ANALYTICS_EVENT.SIGNUP)

    expect(calls).toEqual([])
    release()
    await vi.waitFor(() => expect(calls).toEqual([
      ['capture', 'session_started'],
      ['identify', 'fixture-user'],
      ['capture', 'review_completed'],
      ['reset'],
      ['capture', 'signup'],
    ]))
    expect(load).toHaveBeenCalledOnce()
    expect(sdk.init).toHaveBeenCalledOnce()
    expect(sdk.init).toHaveBeenCalledWith('fixture-key', expect.objectContaining({
      api_host: 'https://analytics.example.test',
      autocapture: false,
      disable_session_recording: true,
    }))
  })
})

describe('analytics endpoint', () => {
  it('restricts CSP to the exact HTTPS origin and permits a same-origin path', () => {
    expect(resolveAnalyticsEndpoint('https://analytics.example.test:444/ingest/')).toEqual({
      apiHost: 'https://analytics.example.test:444/ingest',
      origin: 'https://analytics.example.test:444',
    })
    expect(resolveAnalyticsEndpoint('/ingest')).toEqual({ apiHost: '/ingest', origin: null })
    for (const invalid of ['http://example.test', '//example.test', 'https://example.test;evil', 'https://id@example.test']) {
      expect(resolveAnalyticsEndpoint(invalid)).toBeNull()
    }
  })
})
