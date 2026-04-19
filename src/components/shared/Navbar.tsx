import NavbarClient from '@/components/shared/NavbarClient'
import type { Profile } from '@/types/database.types'

interface NavbarProps {
  profile: Profile
}

export default function Navbar({ profile }: NavbarProps) {
  return (
    <div
      className="stitch-topbar"
      style={{ viewTransitionName: 'site-header' }}
    >
      <nav className="w-full">
        <NavbarClient profile={profile} />
      </nav>
    </div>
  )
}
