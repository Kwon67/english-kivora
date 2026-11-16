import { beforeEach, describe, expect, it, vi } from 'vitest'

const { signUp, isRateLimited } = vi.hoisted(() => ({
  signUp: vi.fn(),
  isRateLimited: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { signUp } }),
}))

vi.mock('@/features/security/lib/security', () => ({
  getClientIp: async () => 'unknown',
  hashSecurityValue: () => 'email-hash',
  isRateLimited,
  recordSecurityEvent: async () => {},
}))

import { requestSignupVerification } from './signup-actions'

const credentials = {
  username: ' New_Member ',
  email: ' New.Member@example.org ',
  password: 'passphrase for tests',
  confirmPassword: 'passphrase for tests',
}

beforeEach(() => {
  signUp.mockReset().mockResolvedValue({ error: null })
  isRateLimited.mockReset().mockResolvedValue(false)
})

describe('public registration', () => {
  it('sends only normalized identity fields and the password to Supabase Auth', async () => {
    const result = await requestSignupVerification({
      ...credentials,
      plan: 'pro',
      role: 'admin',
    })

    expect(result).toEqual({ ok: true })
    expect(signUp).toHaveBeenCalledExactlyOnceWith({
      email: 'new.member@example.org',
      password: credentials.password,
      options: {
        data: { username: 'new_member' },
        emailRedirectTo: expect.stringMatching(/\/auth\/confirm$/),
      },
    })
  })

  it('validates password length and confirmation independently of the browser', async () => {
    for (const input of [
      { ...credentials, password: 'short', confirmPassword: 'short' },
      { ...credentials, confirmPassword: 'different password' },
      { ...credentials, password: '🔒'.repeat(20), confirmPassword: '🔒'.repeat(20) },
    ]) {
      expect(await requestSignupVerification(input)).toMatchObject({ ok: false })
    }
    expect(signUp).not.toHaveBeenCalled()
  })

  it('accepts a signup with only email and password and assigns a public handle', async () => {
    expect(await requestSignupVerification({ ...credentials, username: undefined })).toEqual({ ok: true })
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({
        data: { username: expect.stringMatching(/^membro_[0-9a-f]{16}$/) },
      }),
    }))
  })

  it('returns the same public result for an existing email', async () => {
    signUp.mockResolvedValueOnce({ error: { code: 'user_already_exists' } })
    expect(await requestSignupVerification(credentials)).toEqual({ ok: true })
  })

  it('respects server-side rate limits before contacting Auth', async () => {
    isRateLimited.mockResolvedValue(true)
    expect(await requestSignupVerification(credentials)).toMatchObject({ ok: false })
    expect(signUp).not.toHaveBeenCalled()
  })

  it('returns a generic message when email delivery fails', async () => {
    signUp.mockResolvedValueOnce({ error: { code: 'unexpected_failure', status: 500 } })
    expect(await requestSignupVerification(credentials)).toEqual({
      ok: false,
      error: 'O cadastro está temporariamente indisponível. Tente novamente mais tarde.',
    })
  })
})
