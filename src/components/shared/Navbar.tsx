import NavbarClient from '@/components/shared/NavbarClient'
import type { Profile } from '@/types/database.types'

export type NavbarProfile = Pick<Profile, 'username' | 'role'>

interface NavbarProps {
  profile: NavbarProfile
}

export default function Navbar({ profile }: NavbarProps) {
  return <NavbarClient profile={profile} />
}
