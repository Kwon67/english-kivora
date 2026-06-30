import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'
import { studyCard, studyHero, studyShell } from '@/features/study/lib/studyUi'
import { landingRadius } from '@/lib/landingStyles'

export default function StudyLoading() {
  return (
    <div className={studyShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl">
        <RouteLoadingSkeleton label="Carregando sua rotina...">
          <Skeleton className={`h-40 w-full sm:h-44 ${studyHero}`} />
          <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className={`${studyCard} p-5`}>
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className={`mt-4 h-9 w-14 ${landingRadius}`} />
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3 sm:space-y-4">
            {[0, 1].map((item) => (
              <div key={item} className={`${studyCard} p-5 sm:p-6`}>
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className={`mt-4 h-7 w-48 ${landingRadius}`} />
                <Skeleton className="mt-3 h-4 w-full max-w-lg rounded-full" />
                <Skeleton className={`mt-6 h-10 w-32 ${landingRadius}`} />
              </div>
            ))}
          </div>
        </RouteLoadingSkeleton>
      </div>
    </div>
  )
}