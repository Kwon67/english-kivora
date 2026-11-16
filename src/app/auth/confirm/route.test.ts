import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { exchangeCodeForSession } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession } }),
}))

import { GET } from './route'

beforeEach(() => {
  exchangeCodeForSession.mockReset().mockResolvedValue({ error: null })
})

describe('signup callback', () => {
  it('uses a server exchange before redirecting to onboarding', async () => {
    const response = await GET(new NextRequest('https://kivora.example/auth/confirm?code=example-code'))
    expect(exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith('example-code')
    expect(response.headers.get('location')).toBe('https://kivora.example/onboarding')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('redirects back to login if confirmation is incomplete', async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: { code: 'invalid_grant' } })
    const response = await GET(new NextRequest('https://kivora.example/auth/confirm?code=expired-code'))
    expect(response.headers.get('location')).toBe('https://kivora.example/login?confirmation=check')
  })

  it('does not exchange a missing code', async () => {
    const response = await GET(new NextRequest('https://kivora.example/auth/confirm'))
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('https://kivora.example/login?confirmation=check')
  })
})
