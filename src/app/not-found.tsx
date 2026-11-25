import { Card } from '@/components/shadcn/card'
import PublicPageNavigation from '@/components/navigation/PublicPageNavigation'
import { SearchX } from 'lucide-react'
import { homeCardClass, homeFrostedSurface } from '@/lib/homeStyles'

export default function NotFound() {
  return (
    <main id="main-content" className="public-feedback-page">
      <PublicPageNavigation href="/home" />
      <Card asChild unstyled><section className={`${homeCardClass} ${homeFrostedSurface} w-full max-w-md p-8 text-center`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
          <SearchX className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-text">
          Página não encontrada
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          O endereço acessado não existe ou foi movido.
        </p>

      </section></Card>
    </main>
  )
}
