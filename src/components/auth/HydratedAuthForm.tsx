'use client'

import type { ComponentProps } from 'react'
import { useHydrated } from '@/hooks/useHydrated'

export default function HydratedAuthForm({ children, ...props }: Omit<ComponentProps<'form'>, 'method' | 'action'>) {
  const hydrated = useHydrated()

  return (
    <form {...props} method="post" aria-busy={!hydrated}>
      {!hydrated && (
        <p role="status" className="text-sm leading-relaxed text-text-muted">
          Carregando formulário… Recarregue a página se ele não abrir.
        </p>
      )}
      <noscript><p className="text-sm text-text-muted">Ative o JavaScript para acessar sua conta.</p></noscript>
      <fieldset disabled={!hydrated} className="m-0 flex w-full min-w-0 flex-col items-start gap-4 border-0 p-0">
        {children}
      </fieldset>
    </form>
  )
}
