import WorkspaceMotion from '@/components/motion/WorkspaceMotion'
import { Suspense } from 'react'
import { DashboardChrome, DashboardChromeFallback } from '@/components/layout/DashboardChrome'
import { DashboardLayoutWrapper } from '@/components/layout/DashboardLayoutWrapper'
import PresenceTracker from '@/components/layout/PresenceTracker'
import SubscriptionAlert from '@/features/billing/components/SubscriptionAlert'

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
      <main id="main-content" className="landing-light relative mx-auto w-full min-w-0 bg-bg-primary font-body text-brand-dark">
        <SubscriptionAlert />
        <WorkspaceMotion>{children}</WorkspaceMotion>
      </main>
    </DashboardLayoutWrapper>
  )
}
