'use client'

import type { ReactNode } from 'react'
import AdminSectionHeader from '@/features/admin/components/AdminSectionHeader'

export default function MembersHeader({ totalMembers, action }: { totalMembers: number; action?: ReactNode }) {
  return <AdminSectionHeader illustration="conversation"
    breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Membros' }]} title="Membros"
    description="Acompanhe seus alunos e gerencie os acessos ao programa."
    accentLabel={` ${totalMembers} cadastrados`.trim()} action={action}
  />
}
