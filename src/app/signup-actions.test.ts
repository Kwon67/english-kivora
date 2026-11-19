import { beforeEach, describe, expect, it, vi } from 'vitest'

const { signUp, resend, isRateLimited } = vi.hoisted(() => ({
  signUp: vi.fn(),
  resend: vi.fn(),
  isRateLimited: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { signUp, resend } }),
}))

vi.mock('@/features/security/lib/security', () => ({
  getClientIp: async () => 'unknown',
  hashSecurityValue: () => 'email-hash',
  isRateLimited,
  recordSecurityEvent: async () => {},
}))

import { requestSignupVerification, resendSignupConfirmation } from './signup-actions'

const credentials = {
  username: ' New_Member ',
  email: ' New.Member@example.org ',
  password: 'passphrase for tests',
  confirmPassword: 'passphrase for tests',
}

beforeEach(() => {
  resend.mockReset().mockResolvedValue({ error: null })
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

describe('reenvio da confirmação', () => {
  it('pede apenas a confirmação de cadastro e usa o mesmo destino do primeiro link', async () => {
    expect(await resendSignupConfirmation(credentials.email)).toEqual({ ok: true })
    expect(resend).toHaveBeenCalledExactlyOnceWith({ type: 'signup', email: 'new.member@example.org', options: { emailRedirectTo: expect.stringMatching(/\/auth\/confirm$/) } })
    expect(signUp).not.toHaveBeenCalled()
  })
  it('preserva a privacidade e distingue falha do serviço de uma solicitação recebida', async () => {
    resend.mockResolvedValueOnce({ error: { code: 'user_not_found' } }).mockResolvedValueOnce({ error: { status: 503 } })
    expect(await resendSignupConfirmation(credentials.email)).toEqual({ ok: true })
    expect(await resendSignupConfirmation(credentials.email)).toMatchObject({ ok: false })
  })
  it('valida o e-mail e aplica a mesma cota do cadastro antes de solicitar outro envio', async () => {
    expect(await resendSignupConfirmation('invalid')).toMatchObject({ ok: false })
    isRateLimited.mockResolvedValue(true)
    expect(await resendSignupConfirmation(credentials.email)).toMatchObject({ ok: false })
    expect(isRateLimited).toHaveBeenCalledWith('signup_request_email', 'email-hash', 4, 900)
    expect(resend).not.toHaveBeenCalled()
  })
  it('informa indisponibilidade quando o provedor restringe destinatários de teste', async () => {
    const failure = { error: { code: 'email_address_not_authorized', status: 403 } }
    signUp.mockResolvedValueOnce(failure)
    resend.mockResolvedValueOnce(failure)
    expect(await requestSignupVerification(credentials)).toMatchObject({ ok: false, error: expect.stringContaining('indisponível') })
    expect(await resendSignupConfirmation(credentials.email)).toMatchObject({ ok: false, error: expect.stringContaining('Tente novamente') })
  })
})
