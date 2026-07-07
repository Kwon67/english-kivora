import { Suspense } from 'react'
import { DashboardChrome, DashboardChromeFallback } from '@/components/layout/DashboardChrome'
import { DashboardLayoutWrapper } from '@/components/layout/DashboardLayoutWrapper'
import PresenceTracker from '@/components/layout/PresenceTracker'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayoutWrapper>
      <PresenceTracker />
      <Suspense fallback={<DashboardChromeFallback />}>
        <DashboardChrome />
      </Suspense>
      <main id="main-content" className="home-page-texture landing-light relative mx-auto w-full max-w-[var(--page-width)] overflow-x-hidden overflow-x-clip bg-bg-primary px-4 py-6 font-body text-brand-dark sm:px-6 sm:py-8">
        {children}
      </main>
    </DashboardLayoutWrapper>
  )
}
