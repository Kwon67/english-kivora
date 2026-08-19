import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'
import { homeCardClass, homeHeroCardClass, homeShellClass } from '@/lib/homeStyles'
import { landingRadius, landingRadiusLg } from '@/lib/landingStyles'

export default function ExploreLoading() {
  return (
    <div className={homeShellClass}>
      <div className="relative z-10 mx-auto max-w-6xl">
        <RouteLoadingSkeleton label="Carregando catálogo de packs...">
          <Skeleton className={`h-44 w-full ${homeHeroCardClass}`} />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className={`${homeCardClass} p-5`}>
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className={`mt-4 h-10 w-16 ${landingRadius}`} />
                <Skeleton className="mt-3 h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className={`h-24 w-full ${landingRadiusLg}`} />
            ))}
          </div>
        </RouteLoadingSkeleton>
      </div>
    </div>
  )
}