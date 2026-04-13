import NavbarClient from '@/components/shared/NavbarClient'
import type { Profile } from '@/types/database.types'

interface NavbarProps {
  profile: Profile
}

export default function Navbar({ profile }: NavbarProps) {
  return (
    <div className="sticky top-0 z-50 bg-[var(--color-surface-container-lowest)]">
      <nav className="w-full border-b border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] shadow-[0_18px_40px_-32px_rgba(17,32,51,0.26)]">
        <NavbarClient profile={profile} />
      </nav>
    </div>
  )
}
