import { Suspense } from 'react'
import { DashboardChrome, DashboardChromeFallback } from './DashboardChrome'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="stitch-mobile-nav-pad min-h-[100svh]">
      <Suspense fallback={<DashboardChromeFallback />}>
        <DashboardChrome />
      </Suspense>
      <main className="relative mx-auto w-full max-w-[var(--page-width)] px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
