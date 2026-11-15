'use client'

import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import WorkspaceNavigation from '@/components/navigation/WorkspaceNavigation'
import type { NavbarProfile } from './Navbar'

export default function NavbarClient({ profile }: { profile: NavbarProfile }) {
  const pathname = usePathname()
  const isZenMode = useUIStore(state => state.isZenMode)
  if (isZenMode) return null
  if (pathname === '/onboarding') return <header className="workspace-onboarding-brand">Kivora English</header>
  return <WorkspaceNavigation username={profile.username || 'Estudante'} isAdmin={profile.role === 'admin'} />
}
