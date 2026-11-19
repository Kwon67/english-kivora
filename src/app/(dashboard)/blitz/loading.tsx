import BlitzShell from '@/features/blitz/components/BlitzShell'
import RouteLoadingSkeleton, { Skeleton, SkeletonText } from '@/components/ui/RouteLoadingSkeleton'

export default function Loading() {
  return (
    <BlitzShell>
      <RouteLoadingSkeleton label="Carregando Blitz">
        <div className="blitz-overview" aria-hidden="true">
          <div className="blitz-entry-hero blitz-loading-hero space-y-4">
            <Skeleton className="h-10 w-32 rounded-control" />
            <SkeletonText className="max-w-sm" lines={2} />
            <Skeleton className="h-12 w-40 rounded-control" />
          </div>
          <SkeletonText className="mt-6 max-w-md" />
        </div>
      </RouteLoadingSkeleton>
    </BlitzShell>
  )
}
