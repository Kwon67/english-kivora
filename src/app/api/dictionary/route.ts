import { createClient } from '@/lib/supabase/server'

type DictionaryEntry = {
  partOfSpeech?: string
  pronunciations?: { type?: string; text?: string }[]
  senses?: {
    definition?: string
    examples?: string[]
    translations?: { language?: { code?: string }; word?: string }[]
  }[]
}

const MAX_EXAMPLES_PER_SEARCH = 4

async function lookupEntries(term: string, signal: AbortSignal) {
  const response = await fetch(`https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(term)}?translations=true`, {
    signal, next: { revalidate: 3600 },
  })
  if (response.status === 404) return []
  if (!response.ok) throw new Error('dictionary unavailable')
  const data = await response.json()
  const entries: DictionaryEntry[] = Array.isArray(data.entries) ? data.entries : []
  return entries.slice(0, 6).map(entry => ({
    partOfSpeech: entry.partOfSpeech,
    pronunciation: entry.pronunciations?.find(p => p.type === 'ipa')?.text,
    senses: entry.senses?.slice(0, 4).map(sense => ({
      definition: sense.definition,
      example: sense.examples?.find(example => typeof example === 'string' && example.trim())?.trim(),
      translations: sense.translations?.filter(t => t.language?.code === 'pt').slice(0, 4).map(t => t.word),
    })),
  }))
}

async function translate(text: string, signal: AbortSignal) {
  const params = new URLSearchParams({ q: text, langpair: 'en|pt-BR' })
  const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, { signal, next: { revalidate: 3600 } })
  if (!response.ok) throw new Error('translation unavailable')
  const data = await response.json()
  const translation = data.responseData?.translatedText
  if (data.responseStatus !== 200 || data.quotaFinished || typeof translation !== 'string' || !translation.trim()) {
    throw new Error('translation unavailable')
  }
  return translation.trim()
}

async function translateExamples(entries: Awaited<ReturnType<typeof lookupEntries>>, signal: AbortSignal) {
  const candidates = entries.flatMap(entry => entry.senses?.flatMap(sense => sense.example ? [sense.example] : []) ?? [])
  const examples = [...new Set(candidates)].slice(0, MAX_EXAMPLES_PER_SEARCH)
  const selected = new Set(examples)
  const encoder = new TextEncoder()
  const translations = new Map(await Promise.all(examples.map(async example => {
    if (signal.aborted || encoder.encode(example).length > 500) return [example, null] as const
    const translated = await translate(example, signal).catch(() => null)
    return [example, translated === example ? null : translated] as const
  })))

  return entries.map(entry => ({
    ...entry,
    senses: entry.senses?.map(({ example, ...sense }) => ({
      ...sense,
      ...(example && selected.has(example) ? { example, exampleTranslation: translations.get(example) ?? null } : {}),
    })),
  }))
}

export async function GET(request: Request) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return Response.json({ error: 'Faça login para pesquisar.' }, { status: 401 })
  const term = new URL(request.url).searchParams.get('q')?.trim().replace(/\s+/g, ' ') ?? ''
  if (!term || term.length > 100 || !/^[\p{L}\p{M}\s'’\-.,!?;:]+$/u.test(term)) {
    return Response.json({ error: 'Digite uma palavra ou expressão em inglês (até 100 caracteres).' }, { status: 400 })
  }
  const lookup = term.toLocaleLowerCase('en-US')
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(7000)])
  const dictionary = lookupEntries(lookup, signal).then(entries => translateExamples(entries, signal))
  const [dictionaryResult, translationResult] = await Promise.allSettled([dictionary, translate(term, signal)])
  if (dictionaryResult.status === 'rejected' && translationResult.status === 'rejected') {
    return Response.json({ error: 'Não foi possível consultar os serviços. Tente novamente.' }, { status: 502 })
  }

  return Response.json({
    word: term,
    lookup,
    entries: dictionaryResult.status === 'fulfilled' ? dictionaryResult.value : [],
    dictionaryAvailable: dictionaryResult.status === 'fulfilled',
    translation: translationResult.status === 'fulfilled' ? translationResult.value : null,
  })
}
