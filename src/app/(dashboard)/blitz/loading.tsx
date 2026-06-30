import { Zap } from 'lucide-react'
import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'
import BlitzShell from '@/features/blitz/components/BlitzShell'
import { blitzCard, blitzHeroArena, blitzIconBox } from '@/features/blitz/lib/blitzUi'
import { landingRadius } from '@/lib/landingStyles'

export default function BlitzLoading() {
  return (
    <BlitzShell>
      <RouteLoadingSkeleton label="Carregando Blitz...">
        <div className={`${blitzHeroArena} p-8`}>
          <div className={`h-12 w-12 ${blitzIconBox}`}>
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
          <Skeleton className="mt-5 h-12 w-40 rounded-[13px]" />
          <Skeleton className={`mt-4 h-14 w-full max-w-md ${landingRadius}`} />
          <Skeleton className="mt-4 h-4 w-full max-w-xl rounded-full" />
          <Skeleton className={`mt-6 h-12 w-48 ${landingRadius}`} />
        </div>
        <div className={`${blitzCard} p-6`}>
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className={`mt-5 h-12 w-full ${landingRadius}`} />
          <Skeleton className={`mt-3 h-12 w-full ${landingRadius}`} />
        </div>
      </RouteLoadingSkeleton>
    </BlitzShell>
  )
}