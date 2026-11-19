import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { finishRecovery } from './actions'

const { jar, auth } = vi.hoisted(() => ({
  jar: new Map<string, { value: string }>(),
  auth: { exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn(), updateUser: vi.fn(), signOut: vi.fn() },
}))
vi.mock('next/headers', () => ({ cookies: async () => ({
  get: (name: string) => jar.get(name), set: (name: string, value: string) => jar.set(name, { value }),
}) }))
vi.mock('@/lib/supabase/config', () => ({ supabaseUrl: 'https://qa.invalid', supabaseAnonKey: 'test' }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth }) }))
const url = 'https://qa.invalid/auth/recovery'
function form() {
  const data = new FormData()
  data.set('password', 'new-password-for-test')
  data.set('confirmation', 'new-password-for-test')
  return data
}
beforeEach(() => {
  vi.resetAllMocks()
  jar.clear()
  auth.updateUser.mockResolvedValue({ error: null })
})
it('requires the original browser for PKCE and strips redirect parameters and codes', () => {
  const input = url + '?code=single-use&next=https://other.invalid'
  expect(GET(new NextRequest(input)).headers.get('location')).toContain('?invalid=1')
  const response = GET(new NextRequest(input, { headers: { cookie: 'kv-recovery-code-verifier=test' } }))
  expect(response.headers.get('location')).toBe('/auth/new-password')
  expect(response.cookies.get('kv-recovery-ticket')).toMatchObject({ value: 'single-use', httpOnly: true })
})
it('does not accept a signup token as a recovery ticket', () => {
  expect(GET(new NextRequest(url + '?token_hash=' + 'a'.repeat(64) + '&type=signup')).headers.get('location')).toContain('?invalid=1')
})
it.each([true,false])('binds password update to a verified recovery exchange (%s)', async valid => {
  jar.set('kv-recovery-ticket', { value: 'code' })
  jar.set('kv-recovery-code-verifier', { value: 'verifier' })
  auth.exchangeCodeForSession.mockResolvedValue({ data: { session: {}, redirectType: valid ? 'recovery' : null }, error: null })
  expect(await finishRecovery('', form())).toBe(valid ? 'ok' : 'Link inválido, expirado ou já utilizado. Peça outro link neste navegador.')
  expect(auth.updateUser).toHaveBeenCalledTimes(valid ? 1 : 0)
  await finishRecovery('', form())
  expect(auth.exchangeCodeForSession).toHaveBeenCalledTimes(1)
})
it('refuses an expired or spent token without changing the password', async () => {
  jar.set('kv-recovery-ticket', { value: 'hash:example' })
  auth.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired' }, data: {} })
  await finishRecovery('', form())
  expect(auth.verifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'example' })
  expect(auth.updateUser).not.toHaveBeenCalled()
})

it.each(['http://127.0.0.1:3248', 'https://qa.invalid'])('keeps the recovery ticket on the browser origin %s', origin => {
  const input = new URL('/auth/recovery', origin)
  input.searchParams.set('type', 'recovery')
  input.searchParams.set('token_hash', 'ab'.repeat(32))
  const response = GET(new NextRequest(input))
  const location = response.headers.get('location')!
  expect(new URL(location, input).href).toBe(origin + '/auth/new-password')
  expect(response.cookies.get('kv-recovery-ticket')).toMatchObject({ httpOnly: true, path: '/auth/new-password' })
})

it('preserva a confirmação de senha quando apenas a finalização da sessão falha', async () => {
  jar.set('kv-recovery-ticket', { value: 'hash:test' })
  auth.verifyOtp.mockResolvedValue({ data: { session: {} }, error: null })
  auth.signOut.mockRejectedValue(new Error('offline'))
  expect(await finishRecovery('', form())).toBe('ok')
  expect(auth.updateUser).toHaveBeenCalledOnce()
})

it('oferece um caminho de volta quando a confirmação da escrita se perde', async () => {
  jar.set('kv-recovery-ticket', { value: 'hash:test' })
  auth.verifyOtp.mockResolvedValue({ data: { session: {} }, error: null })
  auth.updateUser.mockRejectedValue(new Error('offline'))
  expect(await finishRecovery('', form())).toContain('Tente entrar com a nova senha')
  expect(auth.signOut).toHaveBeenCalledOnce()
})
