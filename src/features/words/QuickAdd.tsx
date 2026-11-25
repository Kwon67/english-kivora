'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, FolderOpen, Plus } from 'lucide-react'
import { addQuickWord } from '@/app/quick-word-actions'
import { QuickWordSchema, type QuickWordInput } from './quickWord'
import { wordId } from './wordId'
import styles from './QuickAdd.module.css'
export default function QuickAdd({ userId, packs, loadError = false }: { userId: string; packs: { id: string; name: string }[]; loadError?: boolean }) {
  const STORAGE = `kivora-word-draft-v2:${userId}`
  const [storageFailed, setStorageFailed] = useState(false)
  const [en, setEn] = useState(''), [pt, setPt] = useState('')
  const [target, setTarget] = useState(packs.find(p => p.name === 'Minhas palavras')?.id || packs[0]?.id || 'new')
  const [pending, setPending] = useState(false), [ready, setReady] = useState(false)
  const [error, setError] = useState(''), [saved, setSaved] = useState('')
  const lock = useRef(false), english = useRef<HTMLInputElement>(null)
  const attempt = useRef<QuickWordInput | null>(null), newPack = useRef('')
  useEffect(() => {
    newPack.current = wordId()
    try {
      const draft = JSON.parse(sessionStorage.getItem(STORAGE) || 'null')
      if (typeof draft?.en === 'string' && draft.en.length <= 200) setEn(draft.en)
      if (typeof draft?.pt === 'string' && draft.pt.length <= 240) setPt(draft.pt)
      if (draft?.target === 'new' || packs.some(pack => pack.id === draft?.target)) setTarget(draft.target)
      else if (draft?.target) { setTarget('new'); setError('A coleção anterior não está disponível. Confira o destino antes de salvar.') }
      const pendingAttempt = QuickWordSchema.safeParse(draft?.attempt)
      if (pendingAttempt.success) {
        attempt.current = pendingAttempt.data; newPack.current = pendingAttempt.data.packId
        setEn(pendingAttempt.data.en); setPt(pendingAttempt.data.pt)
        setTarget(pendingAttempt.data.createCollection ? 'new' : pendingAttempt.data.packId)
        setError('Há um envio para confirmar. Tente novamente ou confira a coleção.')
      }
    } catch { setStorageFailed(true) }
    setReady(true)
  }, [STORAGE, packs])
  useEffect(() => { if (ready) { try { sessionStorage.setItem(STORAGE, JSON.stringify({ en, pt, target, attempt: attempt.current })) } catch { setStorageFailed(true) } } }, [en, pt, target, ready, STORAGE])
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current || !ready) return
    const input = attempt.current || { cardId: wordId(), packId: target === 'new' ? newPack.current : target, createCollection: target === 'new', en: en.trim(), pt: pt.trim() }
    const parsed = QuickWordSchema.safeParse(input)
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Confira os campos.'); return }
    attempt.current = parsed.data
    try { sessionStorage.setItem(STORAGE, JSON.stringify({ en, pt, target, attempt: parsed.data })) } catch {}
    lock.current = true; setPending(true); setError(''); setSaved('')
    try {
      const result = await addQuickWord(parsed.data)
      if (!result.success) { if (!('retryable' in result) || !result.retryable) { attempt.current = null; try { sessionStorage.setItem(STORAGE, JSON.stringify({ en, pt, target })) } catch {} } setError(result.error); return }
      attempt.current = null; setSaved(parsed.data.en); setEn(''); setPt(''); requestAnimationFrame(() => english.current?.focus())
      try { sessionStorage.removeItem(STORAGE) } catch {}
    } catch { setError('Envio não confirmado. Tente novamente; a palavra não será duplicada.') }
    finally { lock.current = false; setPending(false) }
  }
  return (
    <div className={styles.workspace}>
      <header className={styles.heading}>
        <div>
          <h1>Adicionar palavra</h1>
          <Link href="/library">Abrir coleção <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <Image src="/images/mindmarket/memory.png" alt="" width={1536} height={1024}
          sizes="(max-width: 799px) 130px, 280px" className={styles.art} />
      </header>

      <form className={styles.form} onSubmit={submit} method="post" aria-busy={pending} aria-label="Adicionar palavra">
        <fieldset disabled={!ready || pending || Boolean(attempt.current && error)}>
          <div className={styles.field}>
            <label htmlFor="word-en">Em inglês</label>
            <input ref={english} id="word-en" value={en} onChange={e => setEn(e.target.value)}
              maxLength={200} placeholder="take a break" autoComplete="off" required lang="en" />
          </div>
          <div className={styles.field}>
            <label htmlFor="word-pt">Significado em português</label>
            <input id="word-pt" value={pt} onChange={e => setPt(e.target.value)}
              maxLength={240} placeholder="fazer uma pausa" autoComplete="off" required />
          </div>
          <div className={`${styles.field} ${styles.collection}`}>
            <label htmlFor="word-collection"><FolderOpen size={17} aria-hidden="true" /> Coleção</label>
            <select id="word-collection" value={target} onChange={e => setTarget(e.target.value)}>
              {packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              <option value="new">Minhas palavras · nova coleção</option>
            </select>
          </div>
        </fieldset>

        {storageFailed && <p role="status" className={styles.notice}>Não foi possível guardar o rascunho nesta aba. Copie os campos antes de sair.</p>}
        {loadError && <p role="status" className={styles.notice}>Não foi possível listar suas coleções. Você pode criar uma nova.</p>}
        {error && <div className="product-error" role="alert"><p>{error}</p>{attempt.current && <Link className="product-text-link" href="/library">Conferir coleção</Link>}</div>}
        <button className={`product-primary ${styles.submit}`} type="submit" disabled={!ready || pending}>
          {pending ? 'Salvando…' : error && attempt.current ? 'Tentar novamente' : 'Adicionar palavra'}
          <Plus size={19} aria-hidden="true" />
        </button>
        <div className={styles.confirmation} role="status" aria-live="polite">
          {saved && <><Check size={18} aria-hidden="true" /><span><strong>{saved}</strong> adicionada</span><Link href="/review">Revisar <ArrowRight size={16} aria-hidden="true" /></Link></>}
        </div>
        <noscript>Ative o JavaScript para adicionar palavras.</noscript>
      </form>
    </div>
  )
}
