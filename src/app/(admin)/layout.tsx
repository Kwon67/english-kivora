import { Suspense } from 'react'
import {
  AdminHeader,
  AdminHeaderFallback,
  AdminSidebar,
  AdminSidebarFallback,
} from '@/components/layout/AdminChrome'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-[var(--color-bg)]">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col gap-4 overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:flex-row">
        <Suspense fallback={<AdminSidebarFallback />}>
          <AdminSidebar />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Suspense fallback={<AdminHeaderFallback />}>
            <AdminHeader />
          </Suspense>
          <main id="main-content" className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
