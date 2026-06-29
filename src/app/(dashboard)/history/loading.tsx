import { Loader2 } from 'lucide-react'

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)]'

export default function Loading() {
  return (
    <div className="home-mobile-optimized historico-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 animate-pulse pb-12">
        <div className={`${glassTile} h-64 sm:h-72`} />

        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`${glassTile} h-36`} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className={`${glassTile} h-80`} />
          <div className={`${glassTile} h-80`} />
        </div>

        <div className={`${glassTile} h-96`} />

        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}
