import Navbar from '@/components/layout/Navbar'
import type { NavbarProfile } from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/server'
import { withTimeout } from '@/lib/withTimeout'

const AUTH_TIMEOUT_MS = 5_000

export async function DashboardChrome() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await withTimeout(
    supabase.auth.getUser(),
    AUTH_TIMEOUT_MS,
    { data: { user: null }, error: null } as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>
  )

  if (!user) {
    return <DashboardChromeFallback />
  }

  const profile = await withTimeout(
    Promise.resolve(
      supabase
        .from('profiles')
        .select('username,role,avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => data)
    ),
    AUTH_TIMEOUT_MS,
    null
  )

  if (!profile) {
    return <DashboardChromeFallback />
  }

  return (
    <>
      <Navbar profile={profile as NavbarProfile} />
    </>
  )
}

export function DashboardChromeFallback() {
  return (
    <>
      <div className="stitch-topbar">
        <div className="mx-auto flex max-w-[var(--page-width)] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="h-10 w-36 rounded-[0.8rem] bg-[var(--color-surface-container)]" />
          <div className="hidden h-10 w-64 rounded-[0.8rem] bg-[var(--color-surface-container)] lg:block" />
          <div className="h-10 w-10 rounded-[0.8rem] bg-[var(--color-surface-container)] sm:h-9 sm:w-9" />
        </div>
      </div>

    </>
  )
}
