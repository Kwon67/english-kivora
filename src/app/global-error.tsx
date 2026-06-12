'use client'

import { useEffect } from 'react'

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
    <html lang="pt-BR">
      <body>
        <main className="flex min-h-[100svh] items-center justify-center bg-white px-6 py-16 text-slate-950">
          <section className="w-full max-w-md text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Erro inesperado
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Não foi possível continuar
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              A aplicação encontrou uma falha temporária. Nenhum detalhe técnico foi exposto.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#1DB954] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#169c46]"
            >
              Tentar novamente
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
