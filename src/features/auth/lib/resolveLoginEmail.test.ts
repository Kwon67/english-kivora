import { describe, expect, it } from 'vitest'
import { resolveLoginEmailFromIdentifier } from './resolveLoginEmail'

describe('resolveLoginEmailFromIdentifier', () => {
  it('keeps full email identifiers unchanged', () => {
    expect(resolveLoginEmailFromIdentifier('learner@example.com')).toBe('learner@example.com')
  })

  it('maps legacy usernames to their historical emails', () => {
    expect(resolveLoginEmailFromIdentifier('armando')).toBe('armando@kivora.com')
  })

  it('prefers the profile email for username logins', () => {
    expect(resolveLoginEmailFromIdentifier('clark', 'clark@gmail.com')).toBe('clark@gmail.com')
  })

  it('falls back to the legacy domain when no profile email exists', () => {
    expect(resolveLoginEmailFromIdentifier('member')).toBe('member@kivora.com')
  })
})