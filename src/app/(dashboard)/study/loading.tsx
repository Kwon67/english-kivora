import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)]'

export default function StudyLoading() {
  return (
    <div className="home-mobile-optimized landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl">
        <RouteLoadingSkeleton label="Carregando sua rotina...">
          <Skeleton className="h-36 w-full rounded-[20px]" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className={`${glassTile} p-5`}>
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="mt-4 h-9 w-14 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[0, 1].map((item) => (
              <div key={item} className={`${glassTile} p-6`}>
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="mt-4 h-7 w-48 rounded-xl" />
                <Skeleton className="mt-3 h-4 w-full max-w-lg rounded-full" />
                <Skeleton className="mt-6 h-10 w-32 rounded-xl" />
              </div>
            ))}
          </div>
        </RouteLoadingSkeleton>
      </div>
    </div>
  )
}
