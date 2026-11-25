'use client'

import type { ReactNode } from 'react'
import AdminWorkspaceOpening from '@/features/admin/components/AdminWorkspaceOpening'

export default function ReportsHeader({ action }: { action?: ReactNode }) {
  return <AdminWorkspaceOpening
    breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Relatórios' }]} title="Relatórios"
    description="Entenda a retenção, a precisão e as oportunidades de evolução do programa."
    accentLabel="Últimos 30 dias" action={action}
  />
}
