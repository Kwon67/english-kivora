import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)]'

export default function ExploreLoading() {
  return (
    <div className="home-mobile-optimized landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl">
        <RouteLoadingSkeleton label="Carregando catálogo de packs...">
          <Skeleton className="h-44 w-full rounded-2xl border-2 border-brand-dark shadow-[6px_6px_0_var(--color-brand-dark)]" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className={`${glassTile} p-5`}>
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="mt-4 h-10 w-16 rounded-xl" />
                <Skeleton className="mt-3 h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-24 w-full rounded-[20px]" />
            ))}
          </div>
        </RouteLoadingSkeleton>
      </div>
    </div>
  )
}
