import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(), createAdminClient: vi.fn() }))
vi.mock('@/lib/cardAudio', () => ({ generateAndStoreCardAudio: vi.fn() }))
vi.mock('@/lib/rateLimit', () => ({ protectJsonPost: () => null, rateLimitRequest: () => null }))

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { generateAndStoreCardAudio } from '@/lib/cardAudio'
import { POST } from './route'

const cardId = '5eededa0-fdaa-4d49-ad77-6ac72d1e64ed'
const userId = '5eededa0-fdaa-4d49-ad77-6ac72d1e6400'

function setDatabase({ role = 'user', ownerId = userId, isPublic = false, authenticated = true } = {}) {
  const rows = {
    cards: { id: cardId, pack_id: 'pack', english_phrase: 'I speak English.', audio_url: null },
    packs: { owner_id: ownerId, is_public: isPublic },
    profiles: { role },
  }
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: authenticated ? { id: userId } : null } }) },
    storage: { from: vi.fn() },
    from: vi.fn((table: keyof typeof rows) => ({
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: rows[table], error: null }),
    })),
  }
  vi.mocked(createClient).mockResolvedValue(client as unknown as Awaited<ReturnType<typeof createClient>>)
  vi.mocked(createAdminClient).mockReturnValue(null)
  return client
}

function request(text?: string) {
  return new Request('http://localhost/api/tts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cardId, text }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(generateAndStoreCardAudio).mockResolvedValue({ audioUrl: 'https://storage.example/audio.mp3', storagePath: 'audio.mp3', reused: false })
})

describe('card audio authorization', () => {
  it('requires a verified signed-in user', async () => {
    setDatabase({ authenticated: false })
    expect((await POST(request())).status).toBe(401)
    expect(generateAndStoreCardAudio).not.toHaveBeenCalled()
  })

  it('denies modifying another member’s pack or a public catalog pack', async () => {
    setDatabase({ ownerId: 'someone-else' })
    expect((await POST(request())).status).toBe(403)
    setDatabase({ isPublic: true })
    expect((await POST(request())).status).toBe(403)
    expect(generateAndStoreCardAudio).not.toHaveBeenCalled()
  })

  it('permits the owner of a private pack and uses the database phrase', async () => {
    setDatabase()
    expect((await POST(request())).status).toBe(200)
    expect(generateAndStoreCardAudio).toHaveBeenCalledWith(expect.objectContaining({
      card: expect.objectContaining({ id: cardId, english_phrase: 'I speak English.' }),
    }))
  })

  it('permits an administrator to generate catalog audio', async () => {
    setDatabase({ role: 'admin', ownerId: 'someone-else', isPublic: true })
    expect((await POST(request('I speak English.'))).status).toBe(200)
  })

  it('rejects client text that does not match the canonical card before synthesis', async () => {
    setDatabase({ role: 'admin' })
    expect((await POST(request('Different text.'))).status).toBe(409)
    expect(generateAndStoreCardAudio).not.toHaveBeenCalled()
  })
})
