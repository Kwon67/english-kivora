import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'
import { homeShellClass } from '@/lib/homeStyles'
import { landingRadius, landingRadiusLg } from '@/lib/landingStyles'
import {
  exploreCardClass,
  exploreHeroCardClass,
} from '@/features/explore/lib/explorePageUi'

export default function ExploreLoading() {
  return (
    <div className={homeShellClass}>
      <div className="relative z-10 mx-auto max-w-6xl">
        <RouteLoadingSkeleton label="Carregando catálogo de packs...">
          <Skeleton className={`h-44 w-full ${exploreHeroCardClass}`} />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className={`${exploreCardClass} p-5`}>
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className={`mt-4 h-10 w-16 ${landingRadius}`} />
                <Skeleton className="mt-3 h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className={`home-frosted-subtle h-24 w-full border border-brand-dark ${landingRadiusLg}`} />
            ))}
          </div>
        </RouteLoadingSkeleton>
      </div>
    </div>
  )
}
