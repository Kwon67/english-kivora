'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, BookOpen, ChevronDown, Plus, Search, SlidersHorizontal } from 'lucide-react'
import type { UserPackSummary } from '@/features/profile/components/UserPacksManager'
import ProductMotion from '@/features/words/ProductMotion'
import SpotIllustration from '@/components/illustrations/SpotIllustration'

const Tools = dynamic(() => import('@/features/profile/components/UserPacksManager'), {
  loading: () => <p role="status">Abrindo ferramentas…</p>,
})

export type CollectionWord = { id: string; packId: string; en: string; pt: string }

type Props = {
  packs: UserPackSummary[]
  totalCards: number
  words?: CollectionWord[]
  loadError?: boolean
  query?: string
  page?: number
  matchCount?: number
}

function wordCount(count: number) {
  return `${count} ${count === 1 ? 'palavra' : 'palavras'}`
}

export default function LibraryWorkspace({
  packs, totalCards, words = [], loadError = false, query = '', page = 1, matchCount = words.length,
}: Props) {
  const [tools, setTools] = useState(false)
  const [creationOpen, setCreationOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const filtered = packs.map(pack => ({ ...pack, words: words.filter(word => word.packId === pack.id) }))
    .filter(pack => pack.words.length > 0 || (!query && pack.cardCount === 0))
  const pageLink = (number: number) => `/library?${new URLSearchParams({ q: query, page: String(number) })}`
  const rangeStart = (page - 1) * 50 + 1

  return (
    <ProductMotion className="collection-workspace" subtle>
      <header className="collection-heading">
        <h1>Minha coleção <SpotIllustration motif="books" className="ml-1 inline-block w-12 align-middle sm:w-14" /></h1>
        {!loadError && <p>{wordCount(totalCards)} em {packs.length} {packs.length === 1 ? 'grupo' : 'grupos'}</p>}
      </header>

      <div className="collection-toolbar">
        <form className="collection-search" action="/library" role="search" aria-label="Buscar na coleção">
          <Search size={19} aria-hidden="true" />
          <label className="sr-only" htmlFor="collection-query">Buscar palavra</label>
          <input key={query} id="collection-query" name="q" type="search" defaultValue={query} placeholder="Buscar palavra" maxLength={100} />
          <button type="submit">Buscar</button>
        </form>
        <div className="collection-toolbar-actions">
          <Link className="product-primary" href="/add"><Plus size={18} aria-hidden="true" />Adicionar palavra</Link>
          <button
            type="button"
            ref={trigger}
            className="collection-tools-toggle"
            aria-expanded={tools}
            aria-controls="collection-tools"
            onClick={() => setTools(open => !open)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            {tools ? 'Fechar ferramentas' : 'Importar e organizar'}
          </button>
        </div>
      </div>

      <section className="collection-tools" id="collection-tools" aria-label="Importar e organizar" hidden={!tools}>
        {tools && <Tools packs={packs} creationOpen={creationOpen} onOpenCreate={() => setCreationOpen(true)} onCloseCreate={() => { setCreationOpen(false); trigger.current?.focus() }} />}
      </section>

      <section className="collection-results" aria-labelledby="collection-results-title">
        <div className="collection-results-heading">
          <h2 id="collection-results-title">{query ? 'Resultados da busca' : 'Grupos de palavras'}</h2>
          {query && <Link className="product-text-link" href="/library">Limpar busca</Link>}
          {!loadError && rangeStart <= matchCount && <p className="collection-page-count">
            {rangeStart === 1 && matchCount <= 50 ? wordCount(matchCount) : `${rangeStart}–${Math.min(page * 50, matchCount)} de ${wordCount(matchCount)}`}
          </p>}
        </div>
        {loadError ? (
          <div role="alert" className="product-error">Não foi possível carregar sua coleção. <button type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div>
        ) : filtered.length ? (
          <div className="collection-list">
            {filtered.map(pack => (
              <details key={pack.id} open={query ? true : undefined} className="collection-group">
                <summary>
                  <span className="collection-group-icon"><BookOpen size={20} aria-hidden="true" /></span>
                  <span className="collection-group-title">
                    <strong>{pack.name}</strong>
                    <small>{query ? `${wordCount(pack.words.length)} nesta página` : wordCount(pack.cardCount)}</small>
                  </span>
                  <ChevronDown className="collection-chevron" size={18} aria-hidden="true" />
                </summary>
                <div className="collection-words">
                  {pack.words.length > 0 && <ul>
                    {pack.words.map(word => (
                      <li key={word.id} className="collection-word"><strong lang="en">{word.en}</strong><span>{word.pt}</span></li>
                    ))}
                  </ul>}
                  {!pack.words.length && <p>Nenhuma palavra neste grupo.</p>}
                  <div className="collection-group-actions">
                    {pack.assignmentId && <Link href={`/play/${pack.assignmentId}`}>Praticar esta coleção <ArrowRight size={16} aria-hidden="true" /></Link>}
                    <Link href="/add">Adicionar <Plus size={15} aria-hidden="true" /></Link>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="collection-empty">
            <p>{query ? 'Nenhuma palavra encontrada.' : 'Sua primeira palavra começa aqui.'}</p>
            {!query && <Link className="product-primary" href="/add">Adicionar palavra <Plus size={18} aria-hidden="true" /></Link>}
          </div>
        )}
        {(page > 1 || page * 50 < matchCount) && <nav className="workspace-pagination collection-pagination" aria-label="Páginas da coleção">
          {page > 1 && <Link href={pageLink(page - 1)}>Anterior</Link>}
          <span>Página {page}</span>
          {page * 50 < matchCount && <Link href={pageLink(page + 1)}>Próxima <ArrowRight size={16} aria-hidden="true" /></Link>}
        </nav>}
      </section>
    </ProductMotion>
  )
}
