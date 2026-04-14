import { redirect } from 'next/navigation'
import {
  FileText,
  Home,
  LayoutDashboard,
  Package,
  Shield,
  UserCheck,
} from 'lucide-react'
import BrandMark from '@/components/shared/BrandMark'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/home')

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/packs', label: 'Packs', icon: Package },
    { href: '/admin/assign', label: 'Atribuições', icon: UserCheck },
    { href: '/admin/reports', label: 'Relatórios', icon: FileText },
  ]

  return (
    <div className="min-h-[100svh] bg-[var(--color-surface)] overflow-x-hidden">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col gap-4 px-6 py-6 lg:flex-row overflow-x-hidden">
        <aside
          className="bg-[var(--color-surface-container-lowest)] flex w-full shrink-0 flex-col rounded-[2rem] editorial-shadow ghost-border p-6 lg:w-[290px]"
          style={{ viewTransitionName: 'admin-sidebar' }}
        >
          <div className="flex flex-col items-start gap-4 rounded-[2rem] bg-[var(--color-surface-container)] p-5">
            <BrandMark
              className="max-w-[200px]"
              subtitle="Control Deck"
              subtitleClassName="text-[9px] tracking-[0.2em]"
            />
            <div className="inline-flex rounded-full bg-[var(--color-primary-container)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-on-primary-container)]">
              Admin Status
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-[var(--color-border)] bg-white/62 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] font-bold text-[var(--color-text)]">
                {(profile.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{profile.username}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                  Operations
                </p>
              </div>
            </div>

            <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(43,122,11,0.12),rgba(31,95,8,0.08))] p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                <Shield className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={2.2} />
                English Ops
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Gerencie packs, atribuições e o ritmo de estudo da equipe com uma visão mais limpa e centralizada.
              </p>
            </div>
          </div>

          <nav className="mt-8 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const transitionTypes =
                item.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  transitionTypes={transitionTypes}
                  className="group flex items-center gap-3 rounded-full px-5 py-3.5 transition-all text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]"
                >
                  <Icon
                    className="h-5 w-5 transition-colors text-[var(--color-text-subtle)] group-hover:text-[var(--color-primary)]"
                    strokeWidth={2}
                  />
                  <span className="text-sm font-bold">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto hidden rounded-[26px] border border-[var(--color-border)] bg-white/62 p-4 text-sm text-[var(--color-text-muted)] lg:block">
            <p className="font-semibold text-[var(--color-text)]">Daily direction</p>
            <p className="mt-2 leading-relaxed">
              Priorize cargas de estudo curtas, sequência consistente e sinais claros de progresso.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 editorial-shadow"
            style={{ viewTransitionName: 'admin-header' }}
          >
            <div>
              <p className="section-kicker">Kivora Admin</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">Control center for the English program</h2>
            </div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-container)] px-5 py-3 text-right shadow-[0_20px_45px_-32px_rgba(17,32,51,0.35)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Workspace
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--color-text)]">Operational dashboard</p>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
