import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { GET } from './route'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

const lookup = () => GET(new Request('http://localhost/api/dictionary?q=you'))
const example = 'Both of you should get ready now.'

beforeEach(() => {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: { id: 'test-member' } } }) },
  } as unknown as Awaited<ReturnType<typeof createClient>>)
})
afterEach(() => vi.unstubAllGlobals())

function providers(examples: string[], exampleTranslation: string | null) {
  const fetch = vi.fn(async (input: string) => {
    const url = new URL(input)
    if (url.hostname === 'freedictionaryapi.com') {
      return Response.json({ entries: [
        { senses: examples.slice(0, 4).map(text => ({ examples: [text] })) },
        { senses: examples.slice(4).map(text => ({ examples: [text] })) },
      ] })
    }
    const text = url.searchParams.get('q')
    if (text === 'you') return Response.json({ responseStatus: 200, responseData: { translatedText: 'você' } })
    if (exampleTranslation === null) return new Response(null, { status: 503 })
    return Response.json({ responseStatus: 200, responseData: { translatedText: exampleTranslation } })
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

it('translates the full example for its sense and only requests each example once', async () => {
  const fetch = providers([example, example, 'Are you ready?', 'You can come in.', 'I know you.', 'It is up to you.'], 'Vocês dois devem se preparar agora.')
  const response = await lookup()
  expect(response.status).toBe(200)
  const result = await response.json()
  expect(result.translation).toBe('você')
  expect(result.entries[0].senses[0]).toMatchObject({
    example, exampleTranslation: 'Vocês dois devem se preparar agora.',
  })
  expect(fetch.mock.calls.filter(([url]) => new URL(url).searchParams.get('q') === example)).toHaveLength(1)
  expect(fetch.mock.calls.filter(([url]) => url.includes('mymemory'))).toHaveLength(5)
})

it('keeps the example and the word translation if example translation fails', async () => {
  providers([example], null)
  const response = await lookup()
  expect(response.status).toBe(200)
  const result = await response.json()
  expect(result.translation).toBe('você')
  expect(result.entries[0].senses[0]).toMatchObject({ example, exampleTranslation: null })
})
