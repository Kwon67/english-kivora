import { MessageSquare } from 'lucide-react'
import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'

export default function TutorSessionLoading() {
  return (
    <div className="home-mobile-optimized landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-4xl">
        <RouteLoadingSkeleton label="Iniciando sessão com o tutor...">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="mt-2 h-4 w-56 rounded-full" />
            </div>
          </div>
          <div className="rounded-2xl border-2 border-brand-dark bg-bg-card p-6 shadow-[6px_6px_0_var(--color-brand-dark)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark">
              <MessageSquare className="h-6 w-6 animate-pulse" />
            </div>
            <Skeleton className="mx-auto mt-6 h-20 w-full max-w-md rounded-2xl" />
            <Skeleton className="mx-auto mt-4 h-14 w-14 rounded-full" />
          </div>
        </RouteLoadingSkeleton>
      </div>
    </div>
  )
}
