import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileText,
  LayoutDashboard,
  Package,
  Shield,
  UserCheck,
} from 'lucide-react'
import BrandMark from '@/components/shared/BrandMark'
import { createClient } from '@/lib/supabase/server'

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
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/packs', label: 'Packs', icon: Package },
    { href: '/admin/assign', label: 'Atribuições', icon: UserCheck },
    { href: '#', label: 'Relatórios', icon: FileText },
  ]

  return (
    <div className="app-shell min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col gap-4 px-4 py-4 lg:flex-row lg:px-6">
        <aside className="floating-glass flex w-full shrink-0 flex-col rounded-[32px] border border-white/90 p-4 lg:w-[290px]">
          <div className="flex items-center justify-between gap-3 rounded-[26px] bg-[rgba(255,255,255,0.7)] p-4">
            <BrandMark subtitle="Admin Control Deck" />
            <div className="hidden rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)] sm:block">
              Admin
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

            <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(15,118,110,0.1),rgba(29,78,216,0.08))] p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                <Shield className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={2.2} />
                English Ops
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Gerencie packs, atribuições e o ritmo de estudo da equipe com uma visão mais limpa e centralizada.
              </p>
            </div>
          </div>

          <nav className="mt-5 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-[24px] border border-transparent bg-white/58 px-4 py-3.5 text-sm font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-border)] hover:bg-white/86 hover:shadow-[0_18px_36px_-28px_rgba(17,32,51,0.55)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-secondary-light)] group-hover:text-[var(--color-secondary)]">
                      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    </span>
                    {item.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                    Open
                  </span>
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

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="floating-glass flex flex-wrap items-center justify-between gap-4 rounded-[32px] border border-white/90 px-5 py-4 sm:px-6">
            <div>
              <p className="section-kicker">Kivora Admin</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">Control center for the English program</h2>
            </div>
            <div className="rounded-[24px] border border-[var(--color-border)] bg-white/64 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
                Workspace
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">Operational dashboard</p>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
