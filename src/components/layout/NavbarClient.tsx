'use client'

import { usePathname } from 'next/navigation'
import BrandMark from '@/components/ui/BrandMark'
import { useUIStore } from '@/store/uiStore'
import WorkspaceNavigation from '@/components/navigation/WorkspaceNavigation'
import type { NavbarProfile } from './Navbar'

export default function NavbarClient({ profile }: { profile: NavbarProfile }) {
  const pathname = usePathname()
  const isZenMode = useUIStore(state => state.isZenMode)
  if (isZenMode) return null
  if (pathname === '/onboarding') {
    return <header className="workspace-navigation"><div className="workspace-navigation-bar"><BrandMark showSubtitle={false} /></div></header>
  }
  return <WorkspaceNavigation username={profile.username || 'Estudante'} isAdmin={profile.role === 'admin'} />
}
