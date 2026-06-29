import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import BrandMark from '@/components/ui/BrandMark'
import AdminSidebarNav from '@/components/layout/AdminSidebarNav'
import { accentBadge, glassTile } from '@/features/admin/lib/adminUi'
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
    <aside
      className={`${glassTile} flex w-full shrink-0 flex-col overflow-hidden p-3 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:max-h-[calc(100svh-3rem)] lg:w-56 lg:overflow-y-auto`}
      style={{ viewTransitionName: 'admin-sidebar' }}
    >
      <div className="border-b-2 border-brand-dark/15 pb-3">
        <BrandMark
          className="max-w-[164px]"
          subtitle="Painel de Controle"
          subtitleClassName="text-[8px] tracking-[0.12em]"
        />
        <div className="mt-3">
          <span className={`${accentBadge} inline-flex items-center gap-1.5`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border-2 border-brand-dark bg-bg-primary px-3 py-3 shadow-[3px_3px_0_var(--color-brand-dark)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent font-heading text-xs font-bold text-brand-dark">
            {(profile.username || 'A').charAt(0).toUpperCase()}
          </div>
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
    <aside className={`${glassTile} flex w-full shrink-0 flex-col overflow-hidden p-3 lg:w-56`}>
      <div className="border-b-2 border-brand-dark/15 pb-3">
        <div className="h-9 w-36 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
        <div className="mt-3 h-6 w-16 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
      </div>

      <div className="mt-3 rounded-xl border-2 border-brand-dark/20 bg-bg-primary px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl border-2 border-brand-dark/20 bg-bg-card" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
            <div className="mt-2 h-3 w-16 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-col">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="h-9 rounded-lg border-2 border-brand-dark/20 bg-bg-primary"
          />
        ))}
      </div>
    </aside>
  )
}