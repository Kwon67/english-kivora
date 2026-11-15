'use client'

import type { ReactNode } from 'react'
import AdminSectionHeader from '@/features/admin/components/AdminSectionHeader'

export default function ReportsHeader({ action }: { action?: ReactNode }) {
  return <AdminSectionHeader
    breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Relatórios' }]} title="Relatórios"
    description="Entenda a retenção, a precisão e as oportunidades de evolução do programa."
    accentLabel="Últimos 30 dias" action={action}
  />
}
