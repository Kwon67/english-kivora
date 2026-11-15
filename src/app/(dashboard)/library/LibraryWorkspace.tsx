'use client'
import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, ChevronDown, Plus, Search, SlidersHorizontal } from 'lucide-react'
import type { UserPackSummary } from '@/features/profile/components/UserPacksManager'
import ProductMotion from '@/features/words/ProductMotion'
const Tools = dynamic(() => import('@/features/profile/components/UserPacksManager'), { loading: () => <p role="status">Abrindo ferramentas…</p> })
export type CollectionWord = { id: string; packId: string; en: string; pt: string }
export default function LibraryWorkspace({ packs, totalCards, words = [], loadError = false, query = '', page = 1, matchCount = words.length }: { packs: UserPackSummary[]; totalCards: number; folderCount: number; words?: CollectionWord[]; loadError?: boolean; query?: string; page?: number; matchCount?: number }) {
  const [tools, setTools] = useState(false), [creationOpen, setCreationOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const filtered = packs.map(pack => ({ ...pack, words: words.filter(word => word.packId === pack.id) })).filter(pack => pack.words.length > 0 || (!query && pack.cardCount === 0))
  const pageLink = (number: number) => `/library?${new URLSearchParams({ q: query, page: String(number) })}`
  return <ProductMotion className="collection-workspace"><header className="collection-heading"><div><span className="product-kicker">SEU VOCABULÁRIO</span><h1>Minha coleção<span className="collection-count">{totalCards}</span></h1></div><Link className="product-primary" href="/add"><Plus size={18} />Adicionar palavra</Link></header>
    <form className="collection-search" action="/library"><Search size={19} /><label className="sr-only" htmlFor="collection-query">Buscar palavra</label><input key={query} id="collection-query" name="q" type="search" defaultValue={query} placeholder="Buscar palavra" maxLength={100} /><button type="submit">Buscar</button></form>
    {matchCount > 0 && <p className="collection-page-count">{(page - 1) * 50 + 1}–{Math.min(page * 50, matchCount)} de {matchCount} palavras{query ? ' encontradas' : ''}</p>}
    {loadError ? <div role="alert" className="product-error">Não foi possível carregar sua coleção. <button onClick={() => window.location.reload()}>Tentar novamente</button></div> : filtered.length ? <div className="collection-list">{filtered.map(pack => <details key={pack.id} open={query ? true : undefined} className="collection-group"><summary><span><strong>{pack.name}</strong><small>{pack.cardCount} palavras</small></span><ChevronDown size={18} /></summary><div className="collection-words">{pack.words.map(word => <div key={word.id} className="collection-word"><strong lang="en">{word.en}</strong><span>{word.pt}</span></div>)}{!pack.words.length && <p>Nenhuma palavra nesta coleção.</p>}<div className="collection-group-actions">{pack.assignmentId && <Link href={`/play/${pack.assignmentId}`}>Praticar esta coleção <ArrowRight size={16} /></Link>}<Link href="/add">Adicionar <Plus size={15} /></Link></div></div></details>)}</div> : <div className="collection-empty"><h2>{query ? 'Nenhuma palavra encontrada.' : 'Sua primeira palavra começa aqui.'}</h2>{query ? <Link className="product-text-link" href="/library">Limpar busca</Link> : <Link className="product-primary" href="/add">Adicionar palavra <Plus size={18} /></Link>}</div>}
    {(page > 1 || page * 50 < matchCount) && <nav className="collection-pagination" aria-label="Páginas da coleção">{page > 1 && <Link href={pageLink(page - 1)}>Anterior</Link>}<span>Página {page}</span>{page * 50 < matchCount && <Link href={pageLink(page + 1)}>Próxima <ArrowRight size={16} /></Link>}</nav>}
    <div className="collection-tools"><button ref={trigger} className="product-text-link" aria-expanded={tools} aria-controls="collection-tools" onClick={() => setTools(!tools)}><SlidersHorizontal size={16} />{tools ? 'Fechar ferramentas' : 'Importar e organizar'}</button>{tools && <section id="collection-tools"><Tools packs={packs} creationOpen={creationOpen} onOpenCreate={() => setCreationOpen(true)} onCloseCreate={() => { setCreationOpen(false); trigger.current?.focus() }} /></section>}</div>
  </ProductMotion>
}
