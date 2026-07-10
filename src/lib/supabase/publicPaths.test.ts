import { describe, expect, it } from 'vitest'
import { isPublicRequestPath } from './publicPaths'

describe('isPublicRequestPath', () => {
  it('keeps only the landing root public instead of matching every route', () => {
    expect(isPublicRequestPath('/')).toBe(true)
    expect(isPublicRequestPath('/home')).toBe(false)
    expect(isPublicRequestPath('/tutor/coffee-shop')).toBe(false)
    expect(isPublicRequestPath('/admin/dashboard')).toBe(false)
  })

  it('allows intended auth, legal, static, and secret-protected cron routes', () => {
    expect(isPublicRequestPath('/register')).toBe(true)
    expect(isPublicRequestPath('/login/mfa')).toBe(true)
    expect(isPublicRequestPath('/privacy')).toBe(true)
    expect(isPublicRequestPath('/terms')).toBe(true)
    expect(isPublicRequestPath('/api/cron/weekly-report')).toBe(true)
    expect(isPublicRequestPath('/api/webhooks/abacatepay')).toBe(true)
    expect(isPublicRequestPath('/_next/static/chunk.js')).toBe(true)
  })

  it('does not allow lookalike prefixes', () => {
    expect(isPublicRequestPath('/register-attack')).toBe(false)
    expect(isPublicRequestPath('/api/login-bypass')).toBe(false)
    expect(isPublicRequestPath('/api/webhooks/abacatepay-fake')).toBe(false)
    expect(isPublicRequestPath('/privacy-export')).toBe(false)
  })
})
