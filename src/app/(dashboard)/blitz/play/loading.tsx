import BlitzShell from '@/features/blitz/components/BlitzShell'
import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'

export default function Loading() {
  return (
    <BlitzShell>
      <RouteLoadingSkeleton label="Carregando partida do Blitz">
        <div className="blitz-match space-y-5" aria-hidden="true">
          <Skeleton className="h-8 w-24 rounded-control" />
          <Skeleton className="h-16 rounded-control" />
          <Skeleton className="h-10 w-3/4 rounded-control" />
          <Skeleton className="h-12 rounded-control" />
          <Skeleton className="h-12 rounded-control" />
        </div>
      </RouteLoadingSkeleton>
    </BlitzShell>
  )
}
