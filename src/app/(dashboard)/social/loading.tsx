import DashboardShell from '@/components/layout/DashboardShell'
import RouteLoadingSkeleton, { Skeleton } from '@/components/ui/RouteLoadingSkeleton'
import { glassTile } from '@/lib/dashboardUi'

export default function SocialLoading() {
  return (
    <DashboardShell maxWidthClass="max-w-[var(--page-width)]">
      <RouteLoadingSkeleton label="Carregando comunidade...">
        <Skeleton className="h-8 w-56 rounded-2xl" />
        <Skeleton className="h-4 w-72 max-w-full rounded-full" />
        <div className={`${glassTile} p-6`}>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="mt-8 h-7 w-40 rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className={`${glassTile} p-6`}>
              <Skeleton className="mx-auto h-24 w-24 rounded-full" />
              <Skeleton className="mx-auto mt-4 h-5 w-28 rounded-full" />
              <Skeleton className="mx-auto mt-3 h-4 w-full rounded-full" />
              <Skeleton className="mt-6 h-10 w-full rounded-full" />
            </div>
          ))}
        </div>
      </RouteLoadingSkeleton>
    </DashboardShell>
  )
}