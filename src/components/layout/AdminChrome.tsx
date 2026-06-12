import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowUpRight,
  FileText,
  Home,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Swords,
  UserCheck,
  Users,
} from 'lucide-react'
import BrandMark from '@/components/ui/BrandMark'
import ArenaListener from '@/features/arena/components/ArenaListener'
import { createClient } from '@/lib/supabase/server'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

const navItems = [
  { href: '/home', label: 'Início', icon: Home },
  { href: '/admin/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Membros', icon: Users },
  { href: '/admin/packs', label: 'Packs', icon: Package },
  { href: '/admin/assign', label: 'Atribuições', icon: UserCheck },
  { href: '/admin/reports', label: 'Relatórios', icon: FileText },
  { href: '/admin/arena', label: 'Arena', icon: Swords },
]

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
    <>
      <aside
        className="flex w-full shrink-0 flex-col overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-md)] lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:w-[17.5rem] lg:overflow-y-auto"
        style={{ viewTransitionName: 'admin-sidebar' }}
      >
        <div className="rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4">
          <BrandMark
            className="max-w-[200px]"
            subtitle="Painel de Controle"
            subtitleClassName="text-[9px] tracking-[0.14em]"
          />
          <div className="mt-4 inline-flex items-center gap-2 rounded-[0.7rem] bg-[var(--color-primary-container)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-[var(--color-on-primary-container)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </div>
        </div>

        <div className="mt-4 rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[0.75rem] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] font-black text-[var(--color-primary)]">
              {(profile.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[var(--color-text)]">{profile.username}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                Operações
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-4 grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const transitionTypes =
              item.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes

            return (
              <Link
                key={item.href}
                href={item.href}
                transitionTypes={transitionTypes}
                className="group flex min-h-12 items-center gap-2 rounded-[0.8rem] border border-transparent px-3 py-2.5 text-[var(--color-text-muted)] transition-all hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)] lg:gap-3 lg:px-4"
              >
                <Icon
                  className="h-4 w-4 shrink-0 text-[var(--color-text-subtle)] transition-colors group-hover:text-[var(--color-primary)] lg:h-5 lg:w-5"
                  strokeWidth={2}
                />
                <span className="min-w-0 truncate text-xs font-black lg:text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
      <ArenaListener userId={user.id} />
    </>
  )
}

export function AdminHeader() {
  return (
    <header
      className="flex flex-col gap-4 overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-md)] sm:flex-row sm:items-center sm:justify-between"
      style={{ viewTransitionName: 'admin-header' }}
    >
      <div>
        <p className="section-kicker">Administração Kivora</p>
        <h2 className="mt-3 text-2xl font-black leading-tight text-[var(--color-text)] sm:text-3xl">
          Centro operacional
        </h2>
        <p className="mt-1 text-sm font-semibold text-[var(--color-text-muted)]">
          Gestão de membros, packs, tarefas e relatórios.
        </p>
      </div>
      <Link
        href="/generate"
        transitionTypes={navForwardTransitionTypes}
        className="btn-ghost w-fit"
      >
        <Package className="h-4 w-4" />
        Gerador IA
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </header>
  )
}

export function AdminSidebarFallback() {
  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-md)] lg:w-[17.5rem]">
      <div className="rounded-[0.9rem] bg-[var(--color-surface-container)] p-4">
        <div className="h-10 w-40 rounded-[0.75rem] bg-[var(--color-surface-container-high)]" />
        <div className="mt-4 h-7 w-28 rounded-[0.7rem] bg-[var(--color-surface-container-high)]" />
      </div>

      <div className="mt-4 rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[0.75rem] bg-[var(--color-surface-container)]" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
            <div className="mt-2 h-3 w-16 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:flex lg:flex-col">
        {Array.from({ length: navItems.length }).map((_, index) => (
          <div
            key={index}
            className="h-12 rounded-[0.8rem] bg-[var(--color-surface-container)]"
          />
        ))}
      </div>
    </aside>
  )
}

export function AdminHeaderFallback() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-md)]">
      <div>
        <div className="h-3 w-24 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
        <div className="mt-4 h-8 w-72 rounded-[0.8rem] bg-[var(--color-surface-container)]" />
      </div>
      <div className="h-11 w-36 rounded-[0.75rem] bg-[var(--color-surface-container)]" />
    </header>
  )
}
