import Link from 'next/link'
import { ArrowLeft, CloudOff } from 'lucide-react'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import RetryOfflineButton from '@/features/pwa/components/RetryOfflineButton'

export const dynamic = 'force-static'

export default function OfflinePage() {
  return (
    <main data-kivora-workspace="offline" className="grid min-h-[100svh] place-items-center px-4 sm:px-6">
      <section aria-labelledby="offline-title" className="workspace-feedback workspace-feedback--centered">
        <CloudOff className="mx-auto mb-5 size-8 text-text" aria-hidden="true" strokeWidth={1.8} />
        <h1 id="offline-title" className="font-heading font-medium text-text">Você está offline</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-muted">
          Quando a conexão voltar, tente carregar a página novamente. Você também pode voltar ao início.
        </p>

        <div className="workspace-feedback-actions">
          <RetryOfflineButton />
          <Link href="/home" transitionTypes={navBackTransitionTypes} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
            Voltar para o início
          </Link>
        </div>
      </section>
    </main>
  )
}
