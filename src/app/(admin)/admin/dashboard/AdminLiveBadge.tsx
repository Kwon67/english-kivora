'use client'

import { adminDashboardPill } from '@/features/admin/lib/adminDashboardUi'

export default function AdminLiveBadge() {
  return (
    <span className={`${adminDashboardPill} inline-flex items-center gap-2 bg-brand-accent`}>
      <span className="relative flex h-2 w-2">
        <span className="admin-live-pulse absolute inline-flex h-full w-full rounded-full bg-brand-dark" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-dark" />
      </span>
      Ao vivo
    </span>
  )
}