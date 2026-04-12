import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import type { Profile } from '@/types/database.types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="app-shell gradient-bg min-h-dvh pb-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_72%)]" />
      <Navbar profile={profile as Profile} />
      <main className="relative z-10 mx-auto w-full max-w-[var(--page-width)] px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}
