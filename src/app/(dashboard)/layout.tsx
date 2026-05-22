import { Suspense } from 'react'
import { DashboardChrome, DashboardChromeFallback } from '@/components/layout/DashboardChrome'
import { DashboardLayoutWrapper } from '@/components/layout/DashboardLayoutWrapper'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayoutWrapper>
      <Suspense fallback={<DashboardChromeFallback />}>
        <DashboardChrome />
      </Suspense>
      <main className="home-page-texture relative mx-auto w-full max-w-[var(--page-width)] px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </DashboardLayoutWrapper>
  )
}
