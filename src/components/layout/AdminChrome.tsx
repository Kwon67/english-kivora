import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WorkspaceNavigationSkeleton from '@/components/navigation/WorkspaceNavigationSkeleton'
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
  return <WorkspaceNavigationSkeleton />
}
