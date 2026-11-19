'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Home, RotateCcw } from 'lucide-react'

export default function RouteFailure({ reset, admin = false, retryPending = false }: {
  reset: () => void
  admin?: boolean
  retryPending?: boolean
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  return <section aria-labelledby="route-failure-title" className="workspace-feedback workspace-feedback--centered px-4">
    <h1 ref={heading} tabIndex={-1} id="route-failure-title" className="text-text">Não foi possível abrir esta área</h1>
    <p className="mt-3 text-sm leading-relaxed text-text-muted">Tente novamente ou volte para {admin ? 'a visão geral da administração' : 'o início'}.</p>
    <div className="workspace-feedback-actions">
      <button type="button" onClick={reset} aria-disabled={retryPending || undefined} className="btn-primary inline-flex justify-center">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />Tentar novamente
      </button>
      <Link href={admin ? '/admin/dashboard' : '/home'} className="btn-ghost inline-flex justify-center"><Home className="h-4 w-4" aria-hidden="true" />{admin ? 'Visão geral' : 'Voltar ao início'}</Link>
    </div>
    {retryPending && <p role="status" className="mt-3 text-sm text-text-muted">Carregando histórico…</p>}
  </section>
}
