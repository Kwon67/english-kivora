import { Zap } from 'lucide-react'
import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'
import { blitzGlassPanel } from '@/features/blitz/lib/blitzUi'

export default function BlitzPlayLoading() {
  return (
    <RouteLoadingSkeleton label="Preparando partida de Blitz...">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className={`${blitzGlassPanel} flex flex-wrap items-center justify-between gap-4 p-4`}>
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-12 w-28 rounded-[1rem]" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
        <div className={`${blitzGlassPanel} p-6`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-primary">
            <Zap className="h-7 w-7 animate-pulse" />
          </div>
          <Skeleton className="mx-auto mt-6 h-8 w-2/3 max-w-sm rounded-2xl" />
          <Skeleton className="mx-auto mt-4 h-12 w-full max-w-md rounded-2xl" />
          <Skeleton className="mx-auto mt-3 h-12 w-full max-w-md rounded-2xl" />
        </div>
      </div>
    </RouteLoadingSkeleton>
  )
}