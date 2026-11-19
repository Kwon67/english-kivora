import { beforeEach, it, expect, vi } from 'vitest'
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/tts', () => ({
  parseTtsVoice: () => 'lauren',
  synthesizeSpeechToBuffer: vi.fn(async () => Buffer.from('fixture')),
}))
import { createClient } from '@/lib/supabase/server'
import { synthesizeSpeechToBuffer } from '@/lib/tts'
import { GET } from './route'
const id = 'd7bee050-ccff-406c-ac2f-09fd76d17cfb'
const get = () => GET(new Request('http://localhost/api/card-audio/' + id), { params: Promise.resolve({ id }) })
function auth(user: string | null) {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: user ? { id: user } : null } }) },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data:
              table === 'cards'
                ? { english_phrase: 'A private phrase.', pack_id: 'p' }
                : { owner_id: 'alice', is_public: false },
          }),
        }),
      }),
    }),
  } as unknown as Awaited<ReturnType<typeof createClient>>)
}
beforeEach(() => vi.clearAllMocks())
it('requires authentication and ownership before accessing audio', async () => {
  auth(null)
  expect((await get()).status).toBe(401)
  auth('bob')
  expect((await get()).status).toBe(404)
  expect(synthesizeSpeechToBuffer).not.toHaveBeenCalled()
  auth('alice')
  const r = await get()
  expect(r.status).toBe(200)
  expect(r.headers.get('cache-control')).toContain('no-store')
})
