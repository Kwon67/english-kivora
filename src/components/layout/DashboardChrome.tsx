import WorkspaceNavigationSkeleton from '@/components/navigation/WorkspaceNavigationSkeleton'
import Navbar from '@/components/layout/Navbar'
import type { NavbarProfile } from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/server'
import { withTimeout } from '@/lib/withTimeout'

const AUTH_TIMEOUT_MS = 5_000

export async function DashboardChrome() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS, {
    data: { user: null },
    error: null,
  } as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>)

  if (!user) {
    return <DashboardChromeFallback />
  }

  const profile = await withTimeout(
    Promise.resolve(
      supabase
        .from('profiles')
        .select('username,role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => data),
    ),
    AUTH_TIMEOUT_MS,
    null,
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
  return <WorkspaceNavigationSkeleton />
}
