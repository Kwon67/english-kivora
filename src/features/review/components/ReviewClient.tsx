'use client'

import SpotIllustration from '@/components/illustrations/SpotIllustration'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Link from 'next/link'
import StudioHero from '@/components/learning/StudioHero'
import { ArrowRight, Plus, RotateCcw, Sparkles, X } from 'lucide-react'
import { submitCardReview } from '@/app/actions'
import { scheduleReview, toSchedulingState, formatMinutesEstimate } from '../lib/learningSteps'
import { REVIEW_GRADE } from '../lib/reviewGrades'
import type { DueCard } from './GuidedReviewClient'
import ProductMotion from '@/features/words/ProductMotion'
import PracticeRoutes from '@/components/learning/PracticeRoutes'
import AudioButton from '@/components/ui/AudioButton'
import { buildClozeChallenge } from '../lib/clozeChallenge'
import { isGradeAllowedAfterPractice, type PracticeOutcome } from '../lib/practiceOutcome'
import type { Card } from '@/types/database.types'
import { parseReviewRecovery, reconcileReviewRecovery, type PendingReview } from '../lib/reviewRecovery'
import { nextLapseCount } from '../lib/leech'
export type { DueCard } from './GuidedReviewClient'
const STORAGE = 'kivora-focused-review-v2'
const grades = [{ value: REVIEW_GRADE.AGAIN, label: 'De novo' }, { value: REVIEW_GRADE.HARD, label: 'Difícil' }, { value: REVIEW_GRADE.GOOD, label: 'Lembrei' }, { value: REVIEW_GRADE.EASY, label: 'Fácil' }]
type Props = { userId?: string; initialDueCards: DueCard[]; initialStats: { newCards: number; learning: number; review: number; sessionLimit: number }; packCardsByPackId: Record<string, Card[]>; sessionTitle?: string; disableStoredSessionRestore?: boolean; initialLoadStatus?: 'ok' | 'timeout' | 'error'; loadErrorMessage?: string }
export default function ReviewClient({ userId, initialDueCards, initialStats, packCardsByPackId, initialLoadStatus = 'ok', disableStoredSessionRestore = false, sessionTitle }: Props) {
  const storageKey = userId ? `${STORAGE}:${userId}` : null
  const [queue, setQueue] = useState(initialDueCards), [revealed, setRevealed] = useState(false)
  const [completed, setCompleted] = useState(0), [saving, setSaving] = useState(false), [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState<PendingReview[]>([])
  const [mode, setMode] = useState<'flashcard' | 'cloze'>('flashcard')
  const [selected, setSelected] = useState<Array<string | null>>([])
  const [activeGap, setActiveGap] = useState(0)
  const [outcome, setOutcome] = useState<PracticeOutcome | null>(null)
  const reviewRoot = useRef<HTMLDivElement>(null)
  const restored = useRef(false)
  const lock = useRef(false), revealButton = useRef<HTMLButtonElement>(null)
  const active = queue[0], total = completed + queue.length + pending.length
  const pool = active ? [...(packCardsByPackId[active.pack_id] ?? []), ...initialDueCards.map(item => item.cards)].filter(card => card.id !== active.card_id).map(card => card.english_phrase || card.en || '').filter(Boolean) : []
  const challenge = active ? buildClozeChallenge(active.cards.english_phrase || '', pool) : null
  const isCloze = mode === 'cloze' && Boolean(challenge)
  const allGapsFilled = Boolean(challenge?.answers.every((_, index) => selected[index]))
  useGSAP(() => {
    if (!revealed || !reviewRoot.current) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const answer = reviewRoot.current?.querySelector('.memory-answer p')
      if (answer) gsap.from(answer, { y: 18, opacity: 0, duration: .48, ease: 'power3.out', clearProps: 'transform,opacity' })
      gsap.from('.study-grades > button', { y: 22, opacity: 0, stagger: .055, duration: .44, ease: 'power3.out', clearProps: 'transform,opacity' })
    })
    return () => media.revert()
  }, { scope: reviewRoot, dependencies: [revealed, active?.card_id], revertOnUpdate: true })

  function chooseWord(option: string) {
    if (!challenge || revealed || saving || !ready) return
    // A word can move between gaps, so mistakes remain easy to correct.
    const next = challenge.answers.map((_, index) => index === activeGap ? option : selected[index] === option ? null : selected[index] ?? null)
    setSelected(next)
    const nextGap = next.findIndex((word, index) => index > activeGap && !word)
    const firstEmpty = next.findIndex(word => !word)
    setActiveGap(nextGap >= 0 ? nextGap : firstEmpty >= 0 ? firstEmpty : activeGap)
  }
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    if (!disableStoredSessionRestore && storageKey) try {
      const saved = parseReviewRecovery(sessionStorage.getItem(storageKey))
      if (saved) {
        const recovered = reconcileReviewRecovery(saved, initialDueCards, Date.now(), initialStats.sessionLimit, initialLoadStatus === 'ok')
        setQueue(recovered.queue); setPending(recovered.pending); setCompleted(recovered.completed)
      }
    } catch { /* A blocked storage area does not prevent reviewing. */ }
    setReady(true)
  }, [disableStoredSessionRestore, initialDueCards, initialLoadStatus, initialStats.sessionLimit, storageKey])
  useEffect(() => {
    if (!ready || disableStoredSessionRestore || !storageKey) return
    try {
      if (queue.length || pending.length) sessionStorage.setItem(storageKey, JSON.stringify({ version: 2, at: Date.now(), queue, pending, completed }))
      else sessionStorage.removeItem(storageKey)
    } catch { /* Server confirmation remains the source of truth. */ }
  }, [ready, disableStoredSessionRestore, storageKey, queue, pending, completed])
  useEffect(() => {
    if (!saving) return
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [saving])
  useEffect(() => {
    if (!pending.length || saving) return
    const earliest = Math.min(...pending.map(item => item.dueAt))
    const timer = window.setTimeout(() => {
      const now = Date.now()
      const due = pending.filter(item => item.dueAt <= now)
      if (!due.length) return
      const ids = new Set(due.map(item => item.card.card_id))
      setPending(current => current.filter(item => !ids.has(item.card.card_id)))
      setQueue(current => [...current, ...due.filter(item => !current.some(card => card.card_id === item.card.card_id)).map(item => item.card)])
    }, Math.min(Math.max(0, earliest - Date.now()), 2147483647))
    return () => window.clearTimeout(timer)
  }, [pending, saving])
  async function rate(quality: number) {
    if (!active || !revealed || lock.current || !ready || !isGradeAllowedAfterPractice(quality, outcome)) return
    lock.current = true; setSaving(true); setError('')
    try {
      const result = await submitCardReview({ cardId: active.card_id, packId: active.pack_id, quality, expectedTotalReviews: active.total_reviews || 0,
        ...(isCloze && (outcome === 'correct' || outcome === 'wrong') ? { practiceMode: 'multiple_choice', practiceOutcome: outcome } : {}) })
      const nextAt = new Date(result.reviewResult.nextReviewDate).getTime()
      const scheduled = scheduleReview(quality, toSchedulingState(active))
      if (scheduled.learningStep !== null && Number.isFinite(nextAt)) {
        const card: DueCard = { ...active, isNew: false, learning_step: scheduled.learningStep,
          interval_days: scheduled.intervalDays, ease_factor: scheduled.easeFactor,
          repetitions: scheduled.repetitions, lapses: nextLapseCount(quality, active.lapses ?? 0, (active.repetitions ?? 0) > 0),
          total_reviews: (active.total_reviews ?? 0) + 1,
          selectionTag: 'Hora de relembrar', selectionReason: 'Esta frase voltou para consolidar o que você acabou de praticar.' }
        setPending(current => [...current.filter(item => item.card.card_id !== card.card_id), { card, dueAt: nextAt }])
      }
      const next = queue.slice(1), count = completed + 1
      setQueue(next); setCompleted(count); setRevealed(false); setSelected([]); setActiveGap(0); setOutcome(null)
      if (!next.length) void fetch('/api/streak/update', { method: 'POST' }).catch(() => undefined)
      requestAnimationFrame(() => revealButton.current?.focus())
    } catch { setError('Resposta não confirmada. Tente novamente ou recarregue para conferir.') }
    finally { lock.current = false; setSaving(false) }
  }
  // Key events share the same synchronous lock as clicks.
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button,a,[contenteditable="true"],[role="dialog"]')) return
      if (event.code === 'Space' && active && !revealed && !isCloze) { event.preventDefault(); setRevealed(true) }
      const grade = grades[Number(event.key) - 1]
      if (revealed && grade) { event.preventDefault(); void rate(grade.value) }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  })
  if (initialLoadStatus !== 'ok' && !active) return <ProductMotion className="study-desk"><div className="study-finish"><RotateCcw size={32} /><h1>Não foi possível<br />abrir a revisão.</h1><button className="product-primary" onClick={() => window.location.reload()}>Tentar novamente</button><Link href="/library">Abrir coleção</Link></div></ProductMotion>
  if (!active && pending.length) return <ProductMotion className="study-desk"><div className="study-finish" role="status"><SpotIllustration motif="moon" className="mx-auto h-10 w-10" /><span className="product-kicker">PAUSA PARA FIXAR</span><h1>Mais uma chance<br />em instantes.</h1><p>Próxima revisão prevista para {new Date(Math.min(...pending.map(item => item.dueAt))).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Ela volta automaticamente enquanto esta página estiver aberta.</p><Link className="product-text-link" href="/library">Abrir coleção <ArrowRight size={16} /></Link></div><PracticeRoutes /></ProductMotion>
  if (!active) return <div className="study-desk study-desk--review">
    <StudioHero ornament={completed ? 'sunflower' : 'sun'} label={completed ? 'Sessão concluída' : 'Revisão em dia'} title={completed ? 'Bom trabalho.' : 'Tudo em dia.'}
      description={completed ? `${completed} ${completed === 1 ? 'resposta salva' : 'respostas salvas'}.` : 'Sua revisão está em dia. Experimente usar o inglês em uma situação nova.'}>
      <Link href="/today">Praticar em contexto <ArrowRight size={16} /></Link>
      <Link href="/library">Abrir coleção</Link>
      {completed > 0 && <button onClick={() => window.location.reload()}>Ver próximas revisões</button>}
    </StudioHero><PracticeRoutes />
  </div>
  return <div ref={reviewRoot} className="study-desk study-desk--review" data-testid="review-page">
    <div className="review-session">
      <StudioHero title="Revisão" ornament="pencil" compact>
        <Link href="/add"><Plus size={16} />Adicionar palavra</Link>
      </StudioHero>
      <div className="study-session-line"><span>{sessionTitle || 'Sua sessão de hoje'}</span><span aria-live="polite">{completed} / {total} respostas</span><Link href="/library" aria-label="Pausar revisão" aria-disabled={saving} onClick={e => { if (saving) e.preventDefault() }}><X size={19} /></Link></div>
      <div className="study-progress" role="progressbar" aria-label="Revisão diária" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}><span style={{ transform: `scaleX(${total ? completed / total : 0})` }} /></div>
    </div>
    <section className="review-exercise" aria-label="Exercício de revisão">
      {challenge && <div className="review-mode-picker" role="group" aria-label="Formato da revisão">
        <button type="button" aria-pressed={!isCloze} disabled={revealed || saving} onClick={() => setMode('flashcard')}>Flashcard</button>
        <button type="button" aria-pressed={isCloze} disabled={revealed || saving || !challenge} onClick={() => setMode('cloze')}>Completar frase</button>
      </div>}
      <ProductMotion motionKey={`${active.card_id}-${isCloze}`} className="memory-card review-card" subtle>
        <div className="memory-card-top"><span className="tone-chip" data-tone={active.isNew ? 'vocabulary' : 'review'}>{active.isNew ? 'Nova descoberta' : active.selectionTag || 'Hora de relembrar'}</span>{(!isCloze || revealed) && <AudioButton url={active.cards.audio_url} fallbackText={active.cards.english_phrase} autoPlay={false} variant="game" />}</div>
        {isCloze && challenge ? <>
          <span className="product-kicker">COMPLETE A FRASE ORIGINAL</span>
          <p className="review-cloze-hint">{active.cards.portuguese_translation}</p>
          <h2 className="review-cloze-sentence" lang="en" aria-live="polite" aria-atomic="true">{challenge.answers.map((answer, index) => <Fragment key={index}>
            {challenge.segments[index]}
            {revealed ? <span className="review-cloze-blank">{answer}</span> : <button type="button" className="review-cloze-blank" aria-label={`Lacuna ${index + 1} de ${challenge.answers.length}: ${selected[index] || 'vazia'}`} aria-pressed={activeGap === index} disabled={saving || !ready} onClick={() => setActiveGap(index)}>{selected[index] || '____'}</button>}
          </Fragment>)}{challenge.segments[challenge.answers.length]}</h2>
          <div className="review-cloze-options" role="group" aria-label={`Palavras para a lacuna ${activeGap + 1}`}>{challenge.options.map(option => <button key={option} type="button" lang="en" aria-pressed={selected.includes(option)} disabled={revealed || saving || !ready} onClick={() => chooseWord(option)}>{option}</button>)}</div>
          <p className="memory-instruction review-cloze-feedback" aria-live="polite">{revealed ? outcome === 'correct' ? 'Muito bem! Você completou a frase.' : `Confira a frase corrigida acima. Escolha “De novo” para praticá-la outra vez.` : allGapsFilled ? 'Tudo preenchido. Você pode tocar nas lacunas para trocar as palavras ou confirmar sua resposta.' : `Escolha uma palavra para a lacuna ${activeGap + 1} de ${challenge.answers.length}. Toque em uma lacuna para editá-la.`}</p>
        </> : <>
          <span className="product-kicker">COMO VOCÊ DIRIA EM PORTUGUÊS?</span>
          <h2 lang="en">{active.cards.english_phrase}</h2>
          <div className="memory-answer" aria-live="polite">{revealed && <p>{active.cards.portuguese_translation}</p>}</div>
          <p className="memory-instruction">{revealed ? 'Avalie sua lembrança com sinceridade. O intervalo se adapta a você.' : 'Tente lembrar antes de revelar. Sem pressa.'}</p>
        </>}
      </ProductMotion>
      <div className="study-response">
        {revealed ? <>
          <div className="study-grades">{grades.map((grade, index) => <button key={grade.value} type="button" disabled={saving || !ready || !isGradeAllowedAfterPractice(grade.value, outcome)} onClick={() => void rate(grade.value)} data-grade={index}><strong>{grade.label}</strong><span>{formatMinutesEstimate(scheduleReview(grade.value, toSchedulingState(active)).intervalMinutes)}</span><kbd aria-hidden="true">{index + 1}</kbd></button>)}</div>
          <p className="study-save-state" role="status">{saving ? 'Salvando resposta…' : 'Sua resposta define quando esta palavra volta.'}</p>
        </> : isCloze && challenge ? <button ref={revealButton} className="product-primary study-reveal" disabled={!ready || !allGapsFilled} onClick={() => { setOutcome(challenge.answers.every((answer, index) => selected[index] === answer) ? 'correct' : 'wrong'); setRevealed(true) }}>Confirmar resposta <ArrowRight size={18} /></button> : <button ref={revealButton} className="product-primary study-reveal" disabled={!ready} onClick={() => setRevealed(true)}>Mostrar resposta <ArrowRight size={18} /></button>}
        {error && <div className="product-error" role="alert"><p>{error}</p><button onClick={() => window.location.reload()}>Recarregar</button></div>}
      </div>
      <details className="study-insight"><summary><Sparkles size={16} aria-hidden="true" /> Por que revisar esta palavra?</summary><p>{active.selectionReason || 'Esta palavra faz parte da sua fila de hoje. A repetição espaçada combina seu histórico com a dificuldade que você informa para calcular o próximo intervalo.'}</p></details>
    </section>
    <footer className="study-footnote"><Link href="/today">Prática de hoje</Link><Link href="/review?mode=guided">Prática guiada <ArrowRight size={14} /></Link></footer>
    <PracticeRoutes collapsible />
  </div>
}
