import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../lib/supabase/server', () => ({
  createAdminClient: () => null,
}))

const {
  getLoginBotSignalScore,
  getRequestIp,
  hasTrustedOrigin,
  isSuspiciousProEscalationPath,
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

  it('prefers the platform-sanitized forwarded IP over spoofable fallback headers', () => {
    const request = new Request('https://kivora.test/api/login', {
      headers: {
        'x-forwarded-for': '203.0.113.10',
        'cf-connecting-ip': '198.51.100.99',
        'x-real-ip': '192.0.2.44',
      },
    })

    expect(getRequestIp(request)).toBe('203.0.113.10')
  })

  it('flags common scanner paths', () => {
    expect(isSuspiciousScannerPath('/.env')).toBe(true)
    expect(isSuspiciousScannerPath('/wp-admin/install.php')).toBe(true)
    expect(isSuspiciousScannerPath('/home')).toBe(false)
  })

  it('handles path traversal and special file names correctly', () => {
    expect(isSuspiciousScannerPath('/_next/static/chunks/10gw9~f1v02j..js')).toBe(false)
    expect(isSuspiciousScannerPath('/some..file.js')).toBe(false)
    expect(isSuspiciousScannerPath('/../etc/passwd')).toBe(true)
    expect(isSuspiciousScannerPath('/foo/bar/../../etc')).toBe(true)
    expect(isSuspiciousScannerPath('..\\etc\\passwd')).toBe(true)
  })

  it('detects forged Pro entitlement endpoints without blocking normal pricing pages', () => {
    expect(isSuspiciousProEscalationPath('/api/pro/grant')).toBe(true)
    expect(isSuspiciousProEscalationPath('/api/entitlements/activate')).toBe(true)
    expect(isSuspiciousProEscalationPath('/api/admin/grant-pro')).toBe(true)
    expect(isSuspiciousProEscalationPath('/api/pro/status')).toBe(false)
    expect(isSuspiciousProEscalationPath('/precos')).toBe(false)
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
