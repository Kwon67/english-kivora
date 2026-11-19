'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/shadcn/button'
import styles from './DictionarySearch.module.css'

type Entry = { partOfSpeech?: string; pronunciation?: string; senses?: { definition?: string; example?: string; exampleTranslation?: string | null; translations?: string[] }[] }
type Result = { word: string; lookup: string; entries: Entry[]; dictionaryAvailable: boolean; translation: string | null }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalText(value: unknown) { return value === undefined || typeof value === 'string' }

function isSense(value: unknown) {
  if (!isRecord(value) || !optionalText(value.definition) || !optionalText(value.example)) return false
  if (value.exampleTranslation !== null && !optionalText(value.exampleTranslation)) return false
  return value.translations === undefined ||
    (Array.isArray(value.translations) && value.translations.every(word => typeof word === 'string'))
}

function isEntry(value: unknown) {
  return isRecord(value) && optionalText(value.partOfSpeech) && optionalText(value.pronunciation) &&
    (value.senses === undefined || (Array.isArray(value.senses) && value.senses.every(isSense)))
}

function isDictionaryResult(value: unknown): value is Result {
  return isRecord(value) && typeof value.word === 'string' && typeof value.lookup === 'string' &&
    typeof value.dictionaryAvailable === 'boolean' && (value.translation === null || typeof value.translation === 'string') &&
    Array.isArray(value.entries) && value.entries.every(isEntry)
}

export default function DictionarySearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const request = useRef<AbortController | null>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function search(value: string) {
    const term = value.trim()
    if (!term) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setQuery(term); setLoading(true); setError(''); setResult(null)
    const timeout = window.setTimeout(() => {
      if (request.current !== controller || controller.signal.aborted) return
      controller.abort()
      setError('A pesquisa demorou mais que o esperado. Tente novamente.')
      setLoading(false)
    }, 15000)
    try {
      const response = await fetch(`/api/dictionary?q=${encodeURIComponent(term)}`, { signal: controller.signal })
      const data: unknown = await response.json().catch(() => null)
      if (controller.signal.aborted) return
      if (!response.ok || !isDictionaryResult(data)) {
        setError(!response.ok && isRecord(data) && typeof data.error === 'string'
          ? data.error : 'Não foi possível ler o resultado da pesquisa. Tente novamente.')
        return
      }
      setResult(data)
    } catch {
      if (!controller.signal.aborted) setError('Não foi possível pesquisar. Verifique sua conexão e tente novamente.')
    } finally {
      window.clearTimeout(timeout)
      if (request.current === controller) {
        request.current = null
        if (!controller.signal.aborted) setLoading(false)
      }
    }
  }
  function submit(event: FormEvent) { event.preventDefault(); void search(query) }
  const words = result?.word.match(/[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*/gu) ?? []
  return <div className={styles.page}>
    <header>
      <h1>Dicionário</h1>
      <p>Consulte traduções, definições e exemplos de uso.</p>
    </header>
    <form className={styles.search} onSubmit={submit} role="search" aria-label="Dicionário"><label htmlFor="dictionary-query">Palavra ou expressão em inglês</label><div><input ref={input} id="dictionary-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex.: take a break" maxLength={100} required autoComplete="off" /><Button type="submit" disabled={loading}><Search size={19} aria-hidden="true" /> Pesquisar</Button></div></form>
    <p className={loading ? styles.note : 'sr-only'} role="status">
      {loading ? 'Pesquisando…' : result ? `Resultados para ${result.word}.` : ''}
    </p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {result && <section className={styles.results} aria-labelledby="dictionary-result"><h2 id="dictionary-result" lang="en">{result.word}</h2>{result.translation ? <div className={styles.translation}><p>EM PORTUGUÊS · SUGESTÃO AUTOMÁTICA</p><strong lang="pt-BR">{result.translation}</strong><small>O significado pode mudar conforme o contexto.</small></div> : <p className={styles.note}>Tradução automática temporariamente indisponível.</p>}{!result.dictionaryAvailable ? <p className={styles.note}>Dicionário temporariamente indisponível.</p> : !result.entries.length && <p className={styles.note}>Não encontramos um verbete para esta pesquisa. Se for uma frase, explore as palavras abaixo.</p>}
      {result.entries.map((entry, index) => <article key={`${entry.partOfSpeech}-${index}`}><p className={styles.meta}>{entry.partOfSpeech}{entry.pronunciation && <> · <span lang="en">{entry.pronunciation}</span></>}</p>{entry.senses?.map((sense, i) => <div className={styles.sense} key={i}>{sense.definition && <p lang="en">{sense.definition}</p>}{Boolean(sense.translations?.length) && <p><strong>Em português:</strong> {sense.translations?.join(', ')}</p>}{sense.example && (
        <div className={styles.example}>
          <p className={styles.exampleLabel}>Exemplo de uso</p>
          <p className={styles.exampleEnglish} lang="en">“{sense.example}”</p>
          {sense.exampleTranslation
            ? <p className={styles.examplePortuguese} lang="pt-BR">{sense.exampleTranslation}</p>
            : <p className={styles.exampleUnavailable}>Tradução do exemplo indisponível.</p>}
        </div>
      )}</div>)}</article>)}
      {words.length > 1 && <div className={styles.words}><p>Explorar palavras da frase</p>{[...new Set(words)].slice(0, 15).map(word => <button key={word} type="button" lang="en" onClick={() => { input.current?.focus(); void search(word) }}>{word}</button>)}</div>}
      <p className={styles.credit}>Tradução automática por <a href="https://mymemory.translated.net/" target="_blank" rel="noreferrer">MyMemory</a> · Dados do <a href={`https://en.wiktionary.org/wiki/${encodeURIComponent(result.lookup.replace(/ /g, '_'))}`} target="_blank" rel="noreferrer">Wiktionary</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a> · via <a href="https://freedictionaryapi.com/" target="_blank" rel="noreferrer">FreeDictionaryAPI.com</a></p>
    </section>}
    <p className={styles.note}>Traduções automáticas são sugestões e podem variar conforme o contexto.</p>
  </div>
}
