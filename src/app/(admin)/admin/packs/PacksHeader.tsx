'use client'

import type { ReactNode } from 'react'
import AdminSectionHeader from '@/features/admin/components/AdminSectionHeader'

export default function PacksHeader({ packCount, action }: { packCount: number; action?: ReactNode }) {
  return <AdminSectionHeader illustration="review"
    breadcrumb={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Conteúdo' }]} title="Conteúdo"
    description="Organize o conteúdo, importe frases e prepare a próxima experiência de aprendizado."
    accentLabel={` ${packCount} packs`.trim()} action={action}
  />
}
