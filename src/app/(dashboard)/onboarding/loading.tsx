import RouteLoadingSkeleton, { Skeleton, SkeletonText } from '@/components/ui/RouteLoadingSkeleton'
import styles from '@/features/onboarding/components/Onboarding.module.css'

export default function Loading() {
  return (
    <RouteLoadingSkeleton label="Carregando configuração inicial">
      <div className={styles.shell} aria-hidden="true">
        <div className="space-y-4">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-10 w-4/5 rounded-control" />
          <SkeletonText className="max-w-sm" lines={2} />
          <Skeleton className="h-11 w-32 rounded-control" />
        </div>
      </div>
    </RouteLoadingSkeleton>
  )
}
