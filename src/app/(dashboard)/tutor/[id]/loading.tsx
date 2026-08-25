import { MessageSquare } from 'lucide-react'
import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'
import { homeIconBox, homeShellClass } from '@/lib/homeStyles'
import { landingCtaCardShadow, landingRadius , landingRadiusLg} from '@/lib/landingStyles'
import { tutorCard, tutorFrostedSubtle } from '@/features/tutor/lib/tutorPageUi'

export default function TutorSessionLoading() {
  return (
    <div className={homeShellClass}>
      <div className="relative z-10 mx-auto max-w-5xl space-y-5">
        <RouteLoadingSkeleton label="Iniciando sessão com o tutor...">
          <Skeleton className={`h-10 w-32 ${landingRadius}`} />
          <div className={`${tutorCard} ${landingCtaCardShadow} overflow-hidden`}>
            <div className="border-b border-brand-dark p-6">
              <div className="flex items-center gap-3">
                <Skeleton className={`h-12 w-12 ${landingRadius}`} />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 rounded-full" />
                  <Skeleton className={`mt-2 h-4 w-56 ${landingRadius}`} />
                </div>
              </div>
            </div>
            <div className={`bg-bg-primary p-6 ${tutorFrostedSubtle}`}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center">
                <div className={`h-14 w-14 ${homeIconBox}`}>
                  <MessageSquare className="h-6 w-6 animate-pulse" />
                </div>
              </div>
              <Skeleton className={`mx-auto mt-6 h-20 w-full max-w-md ${landingRadiusLg}`} />
              <Skeleton className="mx-auto mt-4 h-14 w-14 rounded-full" />
            </div>
          </div>
        </RouteLoadingSkeleton>
      </div>
    </div>
  )
}
