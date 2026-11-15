'use client'

import AdminSectionHeader from '@/features/admin/components/AdminSectionHeader'
import AdminDashboardRealtime from './AdminDashboardRealtime'
import AdminLiveBadge from './AdminLiveBadge'

export default function AdminDashboardHeader({ todayLabel }: { todayLabel: string }) {
  return <>
    <AdminDashboardRealtime />
    <AdminSectionHeader
      breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Visão geral' }]} title="Visão geral"
      description="Acompanhe a atividade dos alunos e as tarefas do dia."
      accentLabel={todayLabel} metadata={<AdminLiveBadge />}
    />
  </>
}
