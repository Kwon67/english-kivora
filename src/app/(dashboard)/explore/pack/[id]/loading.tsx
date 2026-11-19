import RouteLoadingSkeleton, { Skeleton, SkeletonText } from '@/components/ui/RouteLoadingSkeleton'

export default function Loading() {
  return (
    <div className="pack-detail">
      <RouteLoadingSkeleton label="Carregando detalhes da coleção">
        <div aria-hidden="true" className="space-y-6 py-4">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-9 w-3/5 rounded-control" />
          <SkeletonText lines={2} />
          <div className="border-y border-brand-border py-4">
            <SkeletonText lines={2} />
          </div>
          <SkeletonText lines={5} />
        </div>
      </RouteLoadingSkeleton>
    </div>
  )
}
