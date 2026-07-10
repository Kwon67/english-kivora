import { createHmac } from 'crypto'
import { describe, expect, it } from 'vitest'
import { verifyAbacateHmac } from './abacateSignature'

describe('verifyAbacateHmac', () => {
  const rawBody = '{"id":"log_123","event":"subscription.renewed"}'
  const publicKey = 'test-public-hmac-key'
  const secret = 'test-webhook-secret'
  const signature = createHmac('sha256', publicKey).update(rawBody).digest('base64')

  it('accepts the exact raw body, URL secret, and HMAC signature', () => {
    expect(verifyAbacateHmac({ rawBody, signature, secretFromUrl: secret, expectedSecret: secret, publicKey })).toBe(true)
  })

  it('rejects tampering and missing credentials', () => {
    expect(verifyAbacateHmac({ rawBody: `${rawBody} `, signature, secretFromUrl: secret, expectedSecret: secret, publicKey })).toBe(false)
    expect(verifyAbacateHmac({ rawBody, signature: null, secretFromUrl: secret, expectedSecret: secret, publicKey })).toBe(false)
    expect(verifyAbacateHmac({ rawBody, signature, secretFromUrl: 'wrong', expectedSecret: secret, publicKey })).toBe(false)
  })
})

