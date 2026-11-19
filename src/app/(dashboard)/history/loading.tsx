import RouteLoadingSkeleton, { Skeleton, SkeletonText } from '@/components/ui/RouteLoadingSkeleton'
import styles from './History.module.css'

export default function Loading() {
  return (
    <RouteLoadingSkeleton label="Carregando histórico">
      <div className={styles.history} aria-hidden="true">
        <Skeleton className="h-10 w-44 rounded-control" />
        <Skeleton className="h-11 w-4/5 rounded-control" />
        <SkeletonText className="max-w-md" />
      </div>
    </RouteLoadingSkeleton>
  )
}
