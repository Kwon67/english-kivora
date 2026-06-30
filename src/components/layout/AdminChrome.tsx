import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import BrandMark from '@/components/ui/BrandMark'
import AdminSidebarNav from '@/components/layout/AdminSidebarNav'
import {
  adminSidebarAvatar,
  adminSidebarBadge,
  adminSidebarHeader,
  adminSidebarProfile,
  adminSidebarShell,
} from '@/features/admin/lib/adminDashboardUi'
import { createClient } from '@/lib/supabase/server'

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

  return (
    <aside className={adminSidebarShell} style={{ viewTransitionName: 'admin-sidebar' }}>
      <div className={adminSidebarHeader}>
        <BrandMark
          className="max-w-[164px]"
          subtitle="Torre de Comando"
          subtitleClassName="text-[8px] tracking-[0.12em]"
        />
        <div className="mt-3">
          <span className={adminSidebarBadge}>
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
            Admin
          </span>
        </div>
      </div>

      <div className={`${adminSidebarProfile} mt-3`}>
        <div className="flex items-center gap-2.5">
          <div className={adminSidebarAvatar}>{(profile.username || 'A').charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-bold text-brand-dark">{profile.username}</p>
            <p className="font-body text-xs font-semibold text-brand-secondary">Operações</p>
          </div>
        </div>
      </div>

      <AdminSidebarNav />
    </aside>
  )
}

export function AdminSidebarFallback() {
  return (
    <aside className={`${adminSidebarShell} animate-pulse`}>
      <div className={adminSidebarHeader}>
        <div className="h-9 w-36 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
        <div className="mt-3 h-6 w-16 rounded-full border border-brand-dark/15 bg-bg-primary" />
      </div>

      <div className={`${adminSidebarProfile} mt-3`}>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-[13px] border border-brand-dark/15 bg-bg-card" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded border border-brand-dark/15 bg-bg-card" />
            <div className="mt-2 h-3 w-16 rounded border border-brand-dark/15 bg-bg-card" />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1.5">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="h-9 rounded-[13px] border border-brand-dark/15 bg-bg-primary" />
        ))}
      </div>
    </aside>
  )
}