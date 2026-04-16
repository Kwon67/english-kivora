import Link from 'next/link'
import { ArrowLeft, CloudOff } from 'lucide-react'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import RetryOfflineButton from './RetryOfflineButton'

export const dynamic = 'force-static'

export default function OfflinePage() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-4 py-10 sm:px-6">
      <div className="premium-card w-full max-w-2xl p-8 text-center sm:p-10">
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-[28px] bg-[rgba(17,32,51,0.08)] text-[var(--color-text)]">
          <CloudOff className="h-9 w-9" strokeWidth={1.8} />
        </div>

        <p className="section-kicker mt-6">Offline mode</p>
        <h1 className="mt-4 text-responsive-lg font-semibold text-[var(--color-text)]">
          A conexão caiu, mas o app continua de pé.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
          Quando a internet voltar, atualize a página para recuperar os dados em tempo real. Enquanto isso, o Kivora mantém a estrutura principal disponível.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <RetryOfflineButton />
          <Link href="/home" transitionTypes={navBackTransitionTypes} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Voltar para a home
          </Link>
        </div>
      </div>
    </div>
  )
}
