'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Plus } from 'lucide-react'
import { addQuickWord } from '@/app/quick-word-actions'
import { QuickWordSchema, type QuickWordInput } from './quickWord'
import { wordId } from './wordId'
import ProductMotion from './ProductMotion'
const STORAGE = 'kivora-word-draft-v1'
export default function QuickAdd({ packs, loadError = false }: { packs: { id: string; name: string }[]; loadError?: boolean }) {
  const [en, setEn] = useState(''), [pt, setPt] = useState('')
  const [target, setTarget] = useState(packs.find(p => p.name === 'Minhas palavras')?.id || packs[0]?.id || 'new')
  const [pending, setPending] = useState(false), [ready, setReady] = useState(false)
  const [error, setError] = useState(''), [saved, setSaved] = useState('')
  const lock = useRef(false), english = useRef<HTMLInputElement>(null)
  const attempt = useRef<QuickWordInput | null>(null), newPack = useRef('')
  useEffect(() => {
    newPack.current = wordId()
    try { const draft = JSON.parse(sessionStorage.getItem(STORAGE) || 'null'); if (draft?.en) setEn(String(draft.en)); if (draft?.pt) setPt(String(draft.pt)); if (draft?.attempt && QuickWordSchema.safeParse(draft.attempt).success) { attempt.current = draft.attempt; newPack.current = draft.attempt.packId; setTarget(draft.attempt.createCollection ? 'new' : draft.attempt.packId); setError('Há um envio para confirmar. Tente novamente ou confira a coleção.') } } catch { /* Storage is optional. */ }
    setReady(true)
  }, [])
  useEffect(() => { if (ready) { try { sessionStorage.setItem(STORAGE, JSON.stringify({ en, pt, attempt: attempt.current })) } catch { /* Saving still works without storage. */ } } }, [en, pt, ready])
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current || !ready) return
    const input = attempt.current || { cardId: wordId(), packId: target === 'new' ? newPack.current : target, createCollection: target === 'new', en: en.trim(), pt: pt.trim() }
    const parsed = QuickWordSchema.safeParse(input)
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Confira os campos.'); return }
    attempt.current = parsed.data
    try { sessionStorage.setItem(STORAGE, JSON.stringify({ en, pt, attempt: parsed.data })) } catch {}
    lock.current = true; setPending(true); setError(''); setSaved('')
    try {
      const result = await addQuickWord(parsed.data)
      if (!result.success) { if (!('retryable' in result) || !result.retryable) { attempt.current = null; try { sessionStorage.setItem(STORAGE, JSON.stringify({ en, pt })) } catch {} } setError(result.error); return }
      attempt.current = null; setSaved(parsed.data.en); setEn(''); setPt(''); requestAnimationFrame(() => english.current?.focus())
      try { sessionStorage.removeItem(STORAGE) } catch {}
    } catch { setError('Envio não confirmado. Tente novamente; a palavra não será duplicada.') }
    finally { lock.current = false; setPending(false) }
  }
  return <ProductMotion className="word-workspace"><header className="product-heading"><span className="product-kicker">SEU VOCABULÁRIO</span><h1>Adicionar <em>palavra.</em></h1></header>
    <div className="word-composition"><div>
    <form className="word-form" onSubmit={submit} method="post" aria-busy={pending}>
      <fieldset disabled={!ready || pending || Boolean(attempt.current && error)}><label htmlFor="word-en">Em inglês</label><input ref={english} id="word-en" value={en} onChange={e => setEn(e.target.value)} maxLength={200} placeholder="e.g. take a break" autoComplete="off" required lang="en" />
      <label htmlFor="word-pt">Significado</label><input id="word-pt" value={pt} onChange={e => setPt(e.target.value)} maxLength={240} placeholder="fazer uma pausa" autoComplete="off" required />
      <label htmlFor="word-collection">Coleção</label><select id="word-collection" value={target} onChange={e => setTarget(e.target.value)}>{packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="new">Minhas palavras · nova coleção</option></select></fieldset>
      {loadError && <p role="status">Não foi possível listar suas coleções. Você pode criar uma nova.</p>}
      {error && <div className="product-error" role="alert"><p>{error}</p>{attempt.current && <Link className="product-text-link" href="/library">Conferir coleção</Link>}</div>}
      <button className="product-primary" type="submit" disabled={!ready || pending}>{pending ? 'Salvando…' : error && attempt.current ? 'Tentar novamente' : 'Adicionar palavra'}<Plus size={19} /></button>
      <noscript>Ative o JavaScript para adicionar palavras.</noscript>
    </form>
    <div className="word-confirmation" role="status" aria-live="polite">{saved && <><Check size={18} /><span><strong>{saved}</strong> adicionada</span><Link href="/review">Revisar <ArrowRight size={16} /></Link></>}</div>
    <Link className="product-text-link" href="/library">Abrir coleção <ArrowRight size={16} /></Link>
    </div><aside className="word-discovery" aria-label="Palavras que crescem com você"><Image src="/images/mindmarket/memory.png" alt="Uma estudante cuida de uma planta de palavras" width={1536} height={1024} unoptimized /><p>Uma palavra hoje.<br />Um mundo amanhã.</p></aside></div>
  </ProductMotion>
}
