'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RotateCcw } from 'lucide-react'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard route error:', error)
  }, [error])

  return (
    <section className="premium-card mx-auto max-w-lg p-8 text-center">
      <p className="section-kicker">Algo deu errado</p>
      <h1 className="mt-4 text-2xl font-bold text-text">Não foi possível carregar esta página</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">
        Houve um problema ao buscar os dados. Tente novamente ou volte para o início.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button type="button" onClick={reset} className="btn-primary inline-flex justify-center">
          <RotateCcw className="h-4 w-4" />
          Tentar novamente
        </button>
        <Link href="/home" className="btn-ghost inline-flex justify-center" transitionTypes={navBackTransitionTypes}>
          <Home className="h-4 w-4" />
          Voltar ao início
        </Link>
      </div>
    </section>
  )
}