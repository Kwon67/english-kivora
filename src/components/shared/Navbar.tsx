import NavbarClient from '@/components/shared/NavbarClient'
import type { Profile } from '@/types/database.types'

interface NavbarProps {
  profile: Profile
}

export default function Navbar({ profile }: NavbarProps) {
  return <NavbarClient profile={profile} />
}

