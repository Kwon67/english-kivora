import PublicPageNavigation from '@/components/navigation/PublicPageNavigation'
import { CloudOff } from 'lucide-react'
import RetryOfflineButton from '@/features/pwa/components/RetryOfflineButton'

export const dynamic = 'force-static'

export default function OfflinePage() {
  return (
    <main data-kivora-workspace="offline" id="main-content" className="public-feedback-page">
      <PublicPageNavigation href="/home" />
      <section aria-labelledby="offline-title" className="workspace-feedback workspace-feedback--centered">
        <CloudOff className="mx-auto mb-5 size-8 text-text" aria-hidden="true" strokeWidth={1.8} />
        <h1 id="offline-title" className="font-heading font-medium text-text">Você está offline</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-muted">
          Quando a conexão voltar, tente carregar a página novamente. Você também pode voltar ao início.
        </p>

        <div className="workspace-feedback-actions">
          <RetryOfflineButton />

        </div>
      </section>
    </main>
  )
}
