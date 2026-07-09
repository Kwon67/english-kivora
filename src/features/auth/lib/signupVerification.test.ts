import { afterEach, describe, expect, it } from 'vitest'
import {
  decryptSignupPassword,
  encryptSignupPassword,
  generateSignupCode,
  hashSignupCode,
  hashSignupEmail,
  maskEmail,
} from '@/features/auth/lib/signupVerification'

describe('signupVerification', () => {
  afterEach(() => {
    delete process.env.ADMIN_SECRET
    delete process.env.SIGNUP_PASSWORD_ENCRYPTION_KEY
  })

  it('generates a 6-digit code', () => {
    const code = generateSignupCode()
    expect(code).toMatch(/^\d{6}$/)
  })

  it('hashes email consistently', () => {
    expect(hashSignupEmail('User@Example.com')).toBe(hashSignupEmail('user@example.com'))
  })

  it('masks email for UI feedback', () => {
    expect(maskEmail('clark@example.com')).toBe('cl***@example.com')
  })

  it('encrypts and decrypts signup passwords with dedicated key', () => {
    process.env.SIGNUP_PASSWORD_ENCRYPTION_KEY = 'test-dedicated-signup-key'
    const encrypted = encryptSignupPassword('Senha123')
    expect(decryptSignupPassword(encrypted)).toBe('Senha123')
  })

  it('falls back to ADMIN_SECRET for encryption when dedicated key is absent', () => {
    process.env.ADMIN_SECRET = 'test-signup-secret'
    const encrypted = encryptSignupPassword('Senha123')
    expect(decryptSignupPassword(encrypted)).toBe('Senha123')
  })

  it('validates signup codes with a stable hash', () => {
    process.env.SIGNUP_PASSWORD_ENCRYPTION_KEY = 'test-dedicated-signup-key'
    const hashA = hashSignupCode('user@example.com', '123456')
    const hashB = hashSignupCode('user@example.com', '123456')
    const hashC = hashSignupCode('user@example.com', '654321')

    expect(hashA).toBe(hashB)
    expect(hashA).not.toBe(hashC)
  })
})