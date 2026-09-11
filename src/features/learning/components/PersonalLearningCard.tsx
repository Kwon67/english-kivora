'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle2, Headphones, Loader2, Sparkles } from 'lucide-react'
import type { PersonalLearningStatus } from '../lib/personalLearningTypes'
import { homeCardClass, homePrimaryButton, homeSecondaryButton } from '@/lib/homeStyles'

export default function PersonalLearningCard() {
  const router = useRouter()
  const refreshed = useRef(false)
  const [status, setStatus] = useState<PersonalLearningStatus | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    let polls = 0
    async function update(start = false) {
      try {
        const response = await fetch('/api/learning/personalize', {
          method: start ? 'POST' : 'GET',
          ...(start ? { headers: { 'Content-Type': 'application/json' }, body: '{}' } : {}),
          cache: 'no-store', signal: controller.signal,
        })
        if (response.status === 401) return
        if (!response.ok && response.status !== 503) throw new Error('Unavailable')
        const next = await response.json() as PersonalLearningStatus
        if (disposed) return
        setStatus(next)
        if (next.status === 'ready') {
          if (!refreshed.current) { refreshed.current = true; router.refresh() }
          return
        }
        const working = ['queued', 'generating', 'audio'].includes(next.status)
        if ((working || (next.status === 'failed' && next.retryable)) && polls++ < 36) {
          // A periodic idempotent POST recovers workers interrupted by a server
          // restart. The database lease and retry budget prevent duplicate work.
          timer = setTimeout(() => { void update(polls % 6 === 0) }, 10_000)
        }
      } catch {
        if (!disposed) setStatus({ status: 'unavailable', message: 'A preparação automática está temporariamente indisponível. Continue com suas revisões.' })
      }
    }
    void update(true)
    return () => { disposed = true; controller.abort(); if (timer) clearTimeout(timer) }
  }, [router, retry])

  if (status?.status === 'disabled') return null
  const working = !status || ['queued', 'generating', 'audio'].includes(status.status)
  const ready = status?.status === 'ready'
  const unavailable = status?.status === 'unavailable' || status?.status === 'failed'

  return (
    <section className={`${homeCardClass} p-6 sm:p-8`} aria-labelledby="personal-learning-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-brand-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <span className="font-body text-xs font-bold uppercase tracking-wide">Feito para você{status?.level ? ` · ${status.level}` : ''}</span>
          </div>
          <h2 id="personal-learning-title" className="mt-3 font-heading text-xl font-bold text-brand-dark">
            {ready ? 'Seu próximo passo está pronto' : status?.status === 'deferred' ? 'Consolidar também é avançar' : 'Seu inglês guia o próximo treino'}
          </h2>
          <p className="mt-2 font-body text-sm text-brand-secondary" role="status" aria-live="polite">
            {status?.message || 'Preparando uma prática com base no seu nível, nos seus interesses e nas suas dificuldades.'}
          </p>
          {status?.objective && <p className="mt-3 font-body text-sm font-semibold text-brand-dark">{status.objective}</p>}
          {!!status?.reasons?.length && (
            <ul className="mt-3 space-y-1 font-body text-sm text-brand-secondary">
              {status.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          )}
        </div>
        {working ? <Loader2 className="h-6 w-6 animate-spin text-brand-primary" aria-label="Preparando treino" /> : ready ? <CheckCircle2 className="h-6 w-6 text-brand-primary" aria-hidden="true" /> : null}
      </div>
      {status?.status === 'audio' && <p className="mt-4 flex items-center gap-2 font-body text-xs text-brand-secondary"><Headphones className="h-4 w-4" />{status.audioReady || 0} de {status.cardCount} áudios preparados</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        {ready && status.activityId ? (
          <Link className={homePrimaryButton} href={`/play/${status.activityId}`}><BookOpen className="h-4 w-4" />Começar meu treino</Link>
        ) : <Link className={homeSecondaryButton} href="/review">{ready ? 'Consolidar minhas frases' : 'Continuar minhas revisões'}</Link>}
        {unavailable && status.retryable !== false && <button className={homeSecondaryButton} onClick={() => setRetry((value) => value + 1)}>Tentar novamente</button>}
      </div>
    </section>
  )
}
