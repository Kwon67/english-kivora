import { createHash } from 'node:crypto'
import { afterEach, expect, it, vi } from 'vitest'
import { requestRecovery } from './actions'

const jar = vi.hoisted(() => new Map<string, { value: string }>())
vi.mock('next/headers', () => ({ cookies: async () => ({
  get: (name: string) => jar.get(name), set: (name: string, value: string) => jar.set(name, { value }),
}) }))
vi.mock('@/lib/supabase/config', () => ({ supabaseUrl: 'https://qa.invalid', supabaseAnonKey: 'test-key' }))
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); jar.clear() })

it('sends a PKCE S256 challenge matching the isolated verifier and the fixed callback', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://app-qa.invalid')
  const fetcher = vi.fn<(url: string, init: RequestInit) => Promise<Response>>().mockResolvedValue(Response.json({}))
  vi.stubGlobal('fetch', fetcher)
  expect(await requestRecovery('person@example.invalid')).toBe(true)
  const [url, init] = fetcher.mock.calls[0]
  expect(new URL(url).searchParams.get('redirect_to')).toBe('https://app-qa.invalid/auth/recovery')
  const stored: string = JSON.parse(jar.get('kv-recovery-code-verifier')!.value)
  const [verifier, intent] = stored.split('/')
  expect(intent).toBe('recovery')
  expect(JSON.parse(String(init.body))).toMatchObject({
    code_challenge_method: 's256', code_challenge: createHash('sha256').update(verifier).digest('base64url'),
  })
})
