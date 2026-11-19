import RouteLoadingSkeleton, { Skeleton, SkeletonText } from '@/components/ui/RouteLoadingSkeleton'
import '@/features/curriculum/components/activity.css'

export default function Loading() {
  return (
    <RouteLoadingSkeleton label="Carregando prova">
      <div className="assessment-screen space-y-5" aria-hidden="true">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-10 w-3/4 rounded-control" />
        <SkeletonText className="max-w-sm" />
        <Skeleton className="h-11 w-36 rounded-control" />
      </div>
    </RouteLoadingSkeleton>
  )
}
