'use client'

import type { ReactNode } from 'react'
import AdminWorkspaceOpening from '@/features/admin/components/AdminWorkspaceOpening'

export default function MembersHeader({ totalMembers, action }: { totalMembers: number; action?: ReactNode }) {
  return <AdminWorkspaceOpening
    breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Membros' }]} title="Membros"
    description="Acompanhe seus alunos e gerencie os acessos ao programa."
    accentLabel={` ${totalMembers} cadastrados`.trim()} action={action}
  />
}
