import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase/server', () => ({
  createAdminClient: () => null,
}))

const {
  getLoginBotSignalScore,
  hasTrustedOrigin,
  isSuspiciousScannerPath,
} = await import('./security')

describe('security helpers', () => {
  it('accepts same-origin mutations', () => {
    const request = new Request('https://kivora.test/api/login', {
      method: 'POST',
      headers: {
        host: 'kivora.test',
        origin: 'https://kivora.test',
      },
    })

    expect(hasTrustedOrigin(request)).toBe(true)
  })

  it('rejects cross-origin mutations', () => {
    const request = new Request('https://kivora.test/api/login', {
      method: 'POST',
      headers: {
        host: 'kivora.test',
        origin: 'https://evil.test',
      },
    })

    expect(hasTrustedOrigin(request)).toBe(false)
  })

  it('flags common scanner paths', () => {
    expect(isSuspiciousScannerPath('/.env')).toBe(true)
    expect(isSuspiciousScannerPath('/wp-admin/install.php')).toBe(true)
    expect(isSuspiciousScannerPath('/home')).toBe(false)
  })

  it('scores clear bot login signals', () => {
    const request = new Request('https://kivora.test/api/login', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        'user-agent': 'curl/8.0',
      },
    })

    const result = getLoginBotSignalScore(request, {
      website: 'filled',
      startedAt: Date.now(),
    })

    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.reasons).toContain('honeypot_filled')
  })
})
