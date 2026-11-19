import { NextRequest } from 'next/server'
import { AuthApiError } from '@supabase/auth-js'
import { beforeEach, expect, it, vi } from 'vitest'
import { updateSession } from './session'

const { client, claims, factors, single } = vi.hoisted(() => ({
  client: vi.fn(), claims: vi.fn(), factors: vi.fn(), single: vi.fn(),
}))
vi.mock('@supabase/ssr', () => ({ createServerClient: client }))
vi.mock('./config', () => ({ supabaseUrl: 'https://local-test.supabase.co', supabaseAnonKey: 'fixture' }))
const origin = 'https://school.example.test'
const sessionName = 'sb-local-test-auth-token'
type Cookies = { setAll(values: { name: string; value: string; options: { path: string; httpOnly: boolean } }[]): void }
beforeEach(() => {
  vi.resetAllMocks()
  client.mockImplementation((_url: string, _key: string, { cookies }: { cookies: Cookies }) => ({
    auth: { getClaims: () => {
      cookies.setAll([{ name: sessionName, value: 'rotated', options: { path: '/', httpOnly: true } }])
      return claims()
    }, mfa: { listFactors: factors } },
    from: (table: string) => {
      if (table !== 'profiles') throw new Error('Unexpected table')
      return { select: () => ({ eq: () => ({ single }) }) }
    },
  }))
  claims.mockResolvedValue({ data: { claims: { sub: 'member', aal: 'aal1' } }, error: null })
  factors.mockResolvedValue({ data: { all: [] }, error: null })
  single.mockResolvedValue({ data: { role: 'member' }, error: null })
})
it('preserva o cookie renovado no redirecionamento de um aluno para a área permitida', async () => {
  const res = await updateSession(new NextRequest(origin + '/admin/packs'))
  expect(res.headers.get('location')).toBe(origin + '/home')
  expect(res.cookies.get(sessionName)).toMatchObject({ value: 'rotated', path: '/', httpOnly: true })
  expect(res.headers.get('cache-control')).toContain('no-store')
})
it('permite acesso administrativo apenas com o papel confirmado pelo servidor', async () => {
  single.mockResolvedValue({ data: { role: 'admin' }, error: null })
  const res = await updateSession(new NextRequest(origin + '/admin/packs'))
  expect(res.headers.get('x-middleware-next')).toBe('1')
  expect(single).toHaveBeenCalledOnce()
})
it('encaminha a verificação pendente para uma página que permite tentar novamente', async () => {
  factors.mockResolvedValue({ data: null, error: { status: 503 } })
  const res = await updateSession(new NextRequest(origin + '/tutor/coffee-shop'))
  expect(new URL(res.headers.get('location')!).pathname).toBe('/login/mfa')
  expect(new URL(res.headers.get('location')!).searchParams.get('next')).toBe('/tutor/coffee-shop')
  expect(single).not.toHaveBeenCalled()
  const api = await updateSession(new NextRequest(origin + '/api/presence'))
  expect(api.status).toBe(503)
})
it('encerra o cookie de sessão expirado e conserva o destino da atividade', async () => {
  claims.mockResolvedValue({ data: null, error: new AuthApiError('Expired', 400, 'refresh_token_not_found') })
  const res = await updateSession(new NextRequest(origin + '/today?unit=travel', { headers: { cookie: sessionName + '=old; unrelated=test' } }))
  expect(res.cookies.get(sessionName)?.maxAge).toBe(0)
  expect(res.cookies.get('unrelated')).toBeUndefined()
  expect(new URL(res.headers.get('location')!).searchParams.get('next')).toBe('/today?unit=travel')
})
