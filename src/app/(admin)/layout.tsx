import { Suspense } from 'react'
import { AdminSidebar, AdminSidebarFallback } from '@/components/layout/AdminChrome'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-ops-deck min-h-screen min-h-[100svh] overflow-x-hidden bg-bg-primary font-body text-brand-dark">
      <div className="mx-auto flex min-h-screen min-h-[100svh] w-full max-w-[1440px] flex-col gap-4 overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:flex-row">
        <Suspense fallback={<AdminSidebarFallback />}>
          <AdminSidebar />
        </Suspense>

        <main id="main-content" className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}