import { createClient } from '@/lib/supabase/server'

type DictionaryEntry = { partOfSpeech?: string; pronunciations?: { type?: string; text?: string }[]; senses?: { definition?: string; examples?: string[]; translations?: { language?: { code?: string }; word?: string }[] }[] }

export async function GET(request: Request) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return Response.json({ error: 'Faça login para pesquisar.' }, { status: 401 })
  const term = new URL(request.url).searchParams.get('q')?.trim().replace(/\s+/g, ' ') ?? ''
  if (!term || term.length > 100 || !/^[\p{L}\p{M}\s'’\-.,!?;:]+$/u.test(term)) {
    return Response.json({ error: 'Digite uma palavra ou expressão em inglês (até 100 caracteres).' }, { status: 400 })
  }
  const lookup = term.toLocaleLowerCase('en-US')
  const translationParams = new URLSearchParams({ q: term, langpair: 'en|pt-BR' })
  const [dictionaryResult, translationResult] = await Promise.allSettled([
    fetch(`https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(lookup)}?translations=true`, { signal: AbortSignal.timeout(7000), next: { revalidate: 3600 } }).then(async response => {
      if (response.status === 404) return []
      if (!response.ok) throw new Error('dictionary unavailable')
      const data = await response.json()
      return Array.isArray(data.entries) ? data.entries.slice(0, 6).map((entry: DictionaryEntry) => ({
        partOfSpeech: entry.partOfSpeech, pronunciation: entry.pronunciations?.find(p => p.type === 'ipa')?.text,
        senses: entry.senses?.slice(0, 4).map(sense => ({ definition: sense.definition, example: sense.examples?.[0], translations: sense.translations?.filter(t => t.language?.code === 'pt').slice(0, 4).map(t => t.word) }))
      })) : []
    }),
    fetch(`https://api.mymemory.translated.net/get?${translationParams}`, { signal: AbortSignal.timeout(7000), next: { revalidate: 3600 } }).then(async response => {
      if (!response.ok) throw new Error('translation unavailable')
      const data = await response.json()
      if (data.responseStatus !== 200 || data.quotaFinished || typeof data.responseData?.translatedText !== 'string' || !data.responseData.translatedText.trim()) throw new Error('translation unavailable')
      return data.responseData.translatedText.trim()
    }),
  ])
  if (dictionaryResult.status === 'rejected' && translationResult.status === 'rejected') return Response.json({ error: 'Não foi possível consultar os serviços. Tente novamente.' }, { status: 502 })
  return Response.json({ word: term, lookup, entries: dictionaryResult.status === 'fulfilled' ? dictionaryResult.value : [], dictionaryAvailable: dictionaryResult.status === 'fulfilled', translation: translationResult.status === 'fulfilled' ? translationResult.value : null })
}
