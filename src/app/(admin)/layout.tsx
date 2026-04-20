import { Suspense } from 'react'
import {
  AdminHeader,
  AdminHeaderFallback,
  AdminSidebar,
  AdminSidebarFallback,
} from './AdminChrome'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100svh] overflow-x-hidden">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col gap-4 px-6 py-6 lg:flex-row overflow-x-hidden">
        <Suspense fallback={<AdminSidebarFallback />}>
          <AdminSidebar />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Suspense fallback={<AdminHeaderFallback />}>
            <AdminHeader />
          </Suspense>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
