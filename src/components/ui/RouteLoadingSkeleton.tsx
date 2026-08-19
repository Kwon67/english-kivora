import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[20px] bg-[var(--color-surface-container-high)] ${className ?? ''}`}>
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  )
}

interface RouteLoadingSkeletonProps {
  label: string
  children?: ReactNode
}

export default function RouteLoadingSkeleton({ label, children }: RouteLoadingSkeletonProps) {
  return (
    <div className="animate-fade-in space-y-6 pb-8">
      {children}
      <div className="flex items-center justify-center gap-2 py-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        {label}
      </div>
    </div>
  )
}

export { Skeleton }