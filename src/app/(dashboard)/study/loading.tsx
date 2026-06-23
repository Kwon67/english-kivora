import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'
import { pageBgGlowExplore, pageBgGridExplore } from '@/lib/pageShellBackground'

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card'

export default function StudyLoading() {
  return (
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-12 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className={pageBgGridExplore} />
      <div className={pageBgGlowExplore} />
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