'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isZenMode = useUIStore((state) => state.isZenMode)
  const isOnboardingWizard = pathname === '/onboarding'

  useEffect(() => {
    if (isZenMode) {
      document.documentElement.dataset.zenMode = '1'
    } else {
      delete document.documentElement.dataset.zenMode
    }

    return () => {
      delete document.documentElement.dataset.zenMode
    }
  }, [isZenMode])

  useEffect(() => {
    if (isOnboardingWizard) {
      document.documentElement.dataset.onboardingWizard = '1'
    } else {
      delete document.documentElement.dataset.onboardingWizard
    }

    return () => {
      delete document.documentElement.dataset.onboardingWizard
    }
  }, [isOnboardingWizard])

  return (
    <div className={twMerge(
      clsx('min-h-screen min-h-[100svh] max-w-full overflow-x-hidden overflow-x-clip bg-bg-primary transition-all duration-500 [touch-action:pan-y]', {
        'stitch-mobile-nav-pad': !isZenMode && !isOnboardingWizard,
      })
    )}>
      {children}
    </div>
  )
}
