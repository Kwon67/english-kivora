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
    <div className="min-h-[100svh] pb-10 bg-[var(--color-surface)]">
      <Navbar profile={profile as Profile} />
      <main className="relative mx-auto w-full max-w-[var(--page-width)] px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
