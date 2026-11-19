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

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    let frame = 0
    const updateKeyboard = () => {
      const active = document.activeElement
      const editing = active instanceof HTMLElement &&
        (active.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, select') || active.isContentEditable)
      const keyboardOpen = editing && window.innerHeight - viewport.height > 120
      document.documentElement.toggleAttribute('data-keyboard-open', keyboardOpen)

      if (keyboardOpen && active instanceof HTMLElement) {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          const bounds = active.getBoundingClientRect()
          const visibleBottom = viewport.offsetTop + viewport.height
          if (bounds.bottom > visibleBottom - 16 || bounds.top < viewport.offsetTop + 16) {
            active.scrollIntoView({ block: 'center', behavior: 'instant' })
          }
        })
      }
    }

    viewport.addEventListener('resize', updateKeyboard)
    viewport.addEventListener('scroll', updateKeyboard)
    document.addEventListener('focusin', updateKeyboard)
    document.addEventListener('focusout', updateKeyboard)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', updateKeyboard)
      viewport.removeEventListener('scroll', updateKeyboard)
      document.removeEventListener('focusin', updateKeyboard)
      document.removeEventListener('focusout', updateKeyboard)
      document.documentElement.removeAttribute('data-keyboard-open')
    }
  }, [])

  return (
    <div data-kivora-workspace="learning" className={twMerge(
      clsx('premium-app min-h-screen min-h-[100svh] max-w-full min-w-0 bg-bg-primary', {
        'stitch-mobile-nav-pad premium-app-with-nav': !isZenMode && !isOnboardingWizard,
      })
    )}>
      {children}
    </div>
  )
}
