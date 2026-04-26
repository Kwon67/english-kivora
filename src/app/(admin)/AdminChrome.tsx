import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FileText,
  Home,
  LayoutDashboard,
  Package,
  Swords,
  UserCheck,
  Users,
} from 'lucide-react'
import BrandMark from '@/components/shared/BrandMark'
import ArenaListener from '@/components/shared/ArenaListener'
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
        className="bg-[var(--color-surface-container-lowest)] flex w-full shrink-0 flex-col rounded-[2rem] editorial-shadow ghost-border p-6 lg:w-[290px]"
        style={{ viewTransitionName: 'admin-sidebar' }}
      >
        <div className="flex flex-col items-start gap-4 rounded-[2rem] bg-[var(--color-surface-container)] p-5">
          <BrandMark
            className="max-w-[200px]"
            subtitle="Painel de Controle"
            subtitleClassName="text-[9px] tracking-[0.2em]"
          />
          <div className="inline-flex rounded-full bg-[var(--color-primary-container)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-on-primary-container)]">
            Status administrativo
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)]/62 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] font-bold text-[var(--color-text)]">
              {(profile.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">{profile.username}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                Operações
              </p>
            </div>
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
      </aside>
      <ArenaListener userId={user.id} />
    </>
  )
}

export function AdminHeader() {
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 editorial-shadow"
      style={{ viewTransitionName: 'admin-header' }}
    >
      <div>
        <p className="section-kicker">Administração Kivora</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
          Centro de controle do programa de inglês
        </h2>
      </div>
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-container)] px-5 py-3 text-right shadow-[0_20px_45px_-32px_rgba(17,32,51,0.35)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-subtle)]">
          Área de Trabalho
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--color-text)]">Painel Operacional</p>
      </div>
    </header>
  )
}

export function AdminSidebarFallback() {
  return (
    <aside className="bg-[var(--color-surface-container-lowest)] flex w-full shrink-0 flex-col rounded-[2rem] editorial-shadow ghost-border p-6 lg:w-[290px]">
      <div className="rounded-[2rem] bg-[var(--color-surface-container)] p-5">
        <div className="h-10 w-40 rounded-full bg-[var(--color-surface-container-high)]" />
        <div className="mt-4 h-7 w-28 rounded-full bg-[var(--color-surface-container-high)]" />
      </div>

      <div className="mt-5 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)]/62 p-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-[var(--color-surface-container)]" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded-full bg-[var(--color-surface-container)]" />
            <div className="mt-2 h-3 w-16 rounded-full bg-[var(--color-surface-container)]" />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        {Array.from({ length: navItems.length }).map((_, index) => (
          <div
            key={index}
            className="h-12 rounded-full bg-[var(--color-surface-container)]"
          />
        ))}
      </div>
    </aside>
  )
}

export function AdminHeaderFallback() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 editorial-shadow">
      <div>
        <div className="h-3 w-24 rounded-full bg-[var(--color-surface-container)]" />
        <div className="mt-4 h-9 w-80 rounded-2xl bg-[var(--color-surface-container)]" />
      </div>
      <div className="h-16 w-44 rounded-[24px] bg-[var(--color-surface-container)]" />
    </header>
  )
}
