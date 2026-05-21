import { describe, expect, it } from 'vitest'
import { resolveAuthenticatorAssuranceLevel } from './auth-assurance'

describe('resolveAuthenticatorAssuranceLevel', () => {
  it('trusts the aal2 claim from Supabase JWTs', () => {
    expect(resolveAuthenticatorAssuranceLevel({ aal: 'aal2' })).toBe('aal2')
  })

  it('detects MFA string methods from the amr claim', () => {
    expect(resolveAuthenticatorAssuranceLevel({ amr: ['password', 'mfa/totp'] })).toBe('aal2')
  })

  it('detects MFA object methods from custom amr claims', () => {
    expect(
      resolveAuthenticatorAssuranceLevel({
        amr: [
          { method: 'password', timestamp: 1 },
          { method: 'mfa/totp', timestamp: 2 },
        ],
      })
    ).toBe('aal2')
  })

  it('keeps first-factor-only sessions at aal1', () => {
    expect(resolveAuthenticatorAssuranceLevel({ aal: 'aal1', amr: ['password'] })).toBe('aal1')
  })
})
