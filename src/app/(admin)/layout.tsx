import WorkspaceMotion from '@/components/motion/WorkspaceMotion'
import { Suspense } from 'react'
import { AdminSidebar, AdminSidebarFallback } from '@/components/layout/AdminChrome'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div data-kivora-workspace="admin" className="admin-ops-deck admin-premium-shell min-h-[100svh] bg-bg-primary font-body text-brand-dark">
        <Suspense fallback={<AdminSidebarFallback />}>
          <AdminSidebar />
        </Suspense>

        <main id="main-content" className="admin-premium-main min-w-0"><WorkspaceMotion>{children}</WorkspaceMotion></main>
    </div>
  )
}
