'use client'

import { useUIStore } from '@/store/uiStore'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const isZenMode = useUIStore((state) => state.isZenMode)

  return (
    <div className={twMerge(
      clsx('min-h-screen min-h-[100svh] max-w-full overflow-x-hidden overflow-x-clip transition-all duration-500 [touch-action:pan-y]', {
        'stitch-mobile-nav-pad': !isZenMode
      })
    )}>
      {children}
    </div>
  )
}
