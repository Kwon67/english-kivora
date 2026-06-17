import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileText,
  Home,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Sparkles,
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
        className="flex w-full shrink-0 flex-col overflow-hidden rounded-[1rem] border border-border bg-card p-3 shadow-[var(--shadow-sm)] lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:w-56 lg:overflow-y-auto"
        style={{ viewTransitionName: 'admin-sidebar' }}
      >
        <div className="border-b border-border pb-3">
          <BrandMark
            className="max-w-[164px]"
            subtitle="Painel de Controle"
            subtitleClassName="text-[8px] tracking-[0.12em]"
          />
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-text-subtle">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </div>
        </div>

        <div className="mt-3 rounded-md bg-surface-container-lowest px-2 py-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-surface-container-high)] text-xs font-bold text-text-muted">
              {(profile.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{profile.username}</p>
              <p className="text-xs font-medium text-text-subtle">
                Operações
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const transitionTypes =
              item.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes

            return (
              <Link
                key={item.href}
                href={item.href}
                transitionTypes={transitionTypes}
                className="group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-container-low hover:text-text"
              >
                <Icon
                  className="h-4 w-4 shrink-0 text-text-subtle transition-colors group-hover:text-primary"
                  strokeWidth={2}
                />
                <span className="min-w-0 truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-3 border-t border-border pt-3">
          <Link
            href="/generate"
            transitionTypes={navForwardTransitionTypes}
            className="group flex items-center gap-2 rounded-md border border-[var(--color-primary-light)] bg-primary-light/35 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:border-[var(--color-primary-light)] hover:bg-primary-light/55"
          >
            <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="min-w-0 truncate">Gerador IA</span>
          </Link>
        </div>
      </aside>
      <ArenaListener userId={user.id} />
    </>
  )
}

export function AdminHeader() {
  return (
    <header
      className="flex items-center justify-between overflow-hidden rounded-[1rem] border border-border bg-card px-4 py-3 shadow-[var(--shadow-sm)]"
      style={{ viewTransitionName: 'admin-header' }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">
          Administração Kivora
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Gestão de membros, packs, tarefas e relatórios.
        </p>
      </div>
    </header>
  )
}

export function AdminSidebarFallback() {
  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[1rem] border border-border bg-card p-3 shadow-[var(--shadow-sm)] lg:w-56">
      <div className="border-b border-border pb-3">
        <div className="h-9 w-36 rounded-md bg-[var(--color-surface-container)]" />
        <div className="mt-3 h-4 w-16 rounded-md bg-[var(--color-surface-container)]" />
      </div>

      <div className="mt-3 rounded-md bg-surface-container-lowest px-2 py-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-[var(--color-surface-container)]" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
            <div className="mt-2 h-3 w-16 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:flex lg:flex-col">
        {Array.from({ length: navItems.length + 1 }).map((_, index) => (
          <div
            key={index}
            className="h-9 rounded-md bg-[var(--color-surface-container)]"
          />
        ))}
      </div>
    </aside>
  )
}

export function AdminHeaderFallback() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[1rem] border border-border bg-card px-4 py-3 shadow-[var(--shadow-sm)]">
      <div>
        <div className="h-3 w-24 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
        <div className="mt-2 h-4 w-64 rounded-[0.6rem] bg-[var(--color-surface-container)]" />
      </div>
    </header>
  )
}
