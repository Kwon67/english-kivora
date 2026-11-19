import RouteLoadingSkeleton, { Skeleton, SkeletonText } from '@/components/ui/RouteLoadingSkeleton'
import styles from '@/features/profile/components/Settings.module.css'

export default function Loading() {
  return (
    <RouteLoadingSkeleton label="Carregando configurações">
      <div className={styles.settings} aria-hidden="true">
        <Skeleton className="h-10 w-48 rounded-control" />
        <SkeletonText className="max-w-sm" lines={2} />
        <Skeleton className="h-14 w-full rounded-control" />
      </div>
    </RouteLoadingSkeleton>
  )
}
