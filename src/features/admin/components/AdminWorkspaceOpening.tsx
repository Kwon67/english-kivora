import type { ComponentProps } from 'react'
import StreetScene from '@/components/landing/StreetScene'
import AdminSectionHeader from './AdminSectionHeader'

export default function AdminWorkspaceOpening(props: ComponentProps<typeof AdminSectionHeader>) {
  return (
    <div className="dashboard-opening">
      <AdminSectionHeader {...props} />
      <div className="dashboard-landscape" aria-hidden="true"><StreetScene /></div>
    </div>
  )
}
