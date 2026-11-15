import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebarClient from './AdminSidebarClient'

export async function AdminSidebar() {
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

  if (!profile || profile.role !== 'admin') redirect('/home')

  return <AdminSidebarClient username={profile.username || 'Administrador'} />
}

export function AdminSidebarFallback() {
  return (
    <>
      <div
        className="admin-desktop-header motion-safe:animate-pulse"
        aria-label="Carregando navegação"
      >
        <div className="h-10 w-44 rounded-xl bg-surface-container" />
        <div className="h-14 w-96 rounded-full bg-surface-container" />
        <div className="h-10 w-10 rounded-full bg-surface-container" />
      </div>
      <div className="admin-mobile-bar motion-safe:animate-pulse">
        <div className="h-9 w-32 rounded-lg bg-bg-primary" />
      </div>
    </>
  )
}
