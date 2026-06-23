import { Zap } from 'lucide-react'
import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'
import BlitzShell from '@/features/blitz/components/BlitzShell'
import { blitzGlassPanel } from '@/features/blitz/lib/blitzUi'

export default function BlitzLoading() {
  return (
    <BlitzShell>
      <RouteLoadingSkeleton label="Carregando Blitz...">
        <div className={`${blitzGlassPanel} p-8`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-container text-primary">
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
          <Skeleton className="mt-5 h-10 w-32 rounded-2xl" />
          <Skeleton className="mt-4 h-4 w-full max-w-xl rounded-full" />
          <Skeleton className="mt-6 h-11 w-40 rounded-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className={`${blitzGlassPanel} p-6`}>
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="mt-5 h-12 w-28 rounded-xl" />
            </div>
          ))}
        </div>
      </RouteLoadingSkeleton>
    </BlitzShell>
  )
}