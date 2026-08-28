'use client'

import { useEffect } from 'react'
import { homeCardClass, homeFrostedSurface } from '@/lib/homeStyles'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application route error:', error)
  }, [error])

  return (
    <main className="flex min-h-screen min-h-[100svh] items-center justify-center bg-[var(--color-background)] px-6 py-16">
      <section className={`${homeCardClass} ${homeFrostedSurface} w-full max-w-md p-8 text-center`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
          Erro inesperado
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-text">
          Algo saiu do esperado
        </h1>
        <p className="mt-4 text-sm leading-6 text-text-muted">
          Não foi possível carregar esta área agora. Tente novamente em alguns instantes.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-dark"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  )
}
