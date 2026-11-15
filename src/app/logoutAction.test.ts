import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/config', () => ({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'test' }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { signOut: mocks.signOut } }),
  createAdminClient: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))

import { logoutAction } from './actions'

describe('logoutAction', () => {
  beforeEach(() => vi.resetAllMocks())

  it('invalidates protected UI and redirects only after sign out succeeds', async () => {
    mocks.signOut.mockResolvedValue({ error: null })
    const redirect = new Error('NEXT_REDIRECT')
    mocks.redirect.mockImplementation(() => { throw redirect })
    await expect(logoutAction()).rejects.toBe(redirect)
    expect(mocks.signOut).toHaveBeenCalledOnce()
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(mocks.redirect).toHaveBeenCalledWith('/login')
  })

  it('keeps the user on the page with a retry message if sign out fails', async () => {
    mocks.signOut.mockResolvedValue({ error: new Error('Unavailable') })
    await expect(logoutAction()).resolves.toEqual({ error: 'Não foi possível sair. Tente novamente.' })
    expect(mocks.redirect).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('handles a rejected request without pretending the session ended', async () => {
    mocks.signOut.mockRejectedValue(new Error('Offline'))
    await expect(logoutAction()).resolves.toEqual({ error: 'Não foi possível sair. Verifique sua conexão e tente novamente.' })
    expect(mocks.redirect).not.toHaveBeenCalled()
  })
})
