import { redirect } from 'next/navigation'
import Navbar from '@/components/shared/Navbar'
import type { NavbarProfile } from '@/components/shared/Navbar'
import ArenaListener from '@/components/shared/ArenaListener'
import { createClient } from '@/lib/supabase/server'

export async function DashboardChrome() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username,role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <>
      <Navbar profile={profile as NavbarProfile} />
      <ArenaListener userId={user.id} />
    </>
  )
}

export function DashboardChromeFallback() {
  return (
    <>
      <div className="stitch-topbar">
        <div className="mx-auto flex max-w-[var(--page-width)] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="h-10 w-36 rounded-full bg-[var(--color-surface-container)]" />
          <div className="hidden h-10 w-64 rounded-full bg-[var(--color-surface-container)] lg:block" />
          <div className="h-10 w-10 rounded-full bg-[var(--color-surface-container)] sm:h-9 sm:w-9" />
        </div>
      </div>

      <div className="stitch-mobile-nav sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-1 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-12 w-12 rounded-xl bg-[var(--color-surface-container)]"
            />
          ))}
        </div>
      </div>
    </>
  )
}
