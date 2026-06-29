'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import './globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-[var(--color-bg)] text-text antialiased">
        <Script src="/pwa-init.js" strategy="beforeInteractive" />
        <main className="flex min-h-screen min-h-[100svh] items-center justify-center px-6 py-16">
          <section className="w-full max-w-md text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-subtle">
              Erro inesperado
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text">
              Não foi possível continuar
            </h1>
            <p className="mt-4 text-sm leading-6 text-text-muted">
              A aplicação encontrou uma falha temporária. Nenhum detalhe técnico foi exposto.
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
      </body>
    </html>
  )
}