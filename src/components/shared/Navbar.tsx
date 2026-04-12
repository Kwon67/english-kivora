'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Shield,
  UserCheck,
  X,
} from 'lucide-react'
import { logoutAction } from '@/app/actions'
import BrandMark from '@/components/shared/BrandMark'
import type { Profile } from '@/types/database.types'

interface NavbarProps {
  profile: Profile
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const memberLinks = [
    { href: '/home', label: 'Início', icon: Home },
    { href: '/history', label: 'Histórico', icon: BarChart3 },
  ]

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/admin/packs', label: 'Packs', icon: Package },
    { href: '/admin/assign', label: 'Atribuir', icon: UserCheck },
  ]

  const links = isAdmin ? [...adminLinks, ...memberLinks] : memberLinks

  return (
    <>
      <div className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
        <nav className="navbar-glass mx-auto max-w-[var(--page-width)] rounded-[30px] px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={isAdmin ? '/admin/dashboard' : '/home'}
              className="flex min-w-0 items-center rounded-full transition-transform duration-200 hover:scale-[1.01]"
            >
              <BrandMark className="min-w-0" subtitle={isAdmin ? 'Performance Control' : 'Daily Fluency Lab'} />
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname.startsWith(link.href)

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[var(--color-text)] text-white shadow-[0_18px_38px_-24px_rgba(17,32,51,0.7)]'
                        : 'text-[var(--color-text-muted)] hover:bg-white/80 hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {isAdmin && (
                <div className="hidden items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)] xl:inline-flex">
                  <Shield className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={2.3} />
                  Admin
                </div>
              )}

              <div className="hidden items-center gap-3 rounded-full border border-[var(--color-border)] bg-white/72 px-2.5 py-2 shadow-sm sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-sm font-bold text-[var(--color-text)]">
                  {(profile.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden min-w-0 lg:block">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">{profile.username}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                    {isAdmin ? 'Administrador' : 'Aluno'}
                  </p>
                </div>
              </div>

              <form action={logoutAction} className="hidden sm:block">
                <button type="submit" className="btn-ghost px-4 py-2.5 text-sm">
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  <span className="hidden lg:inline">Sair</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/78 text-[var(--color-text)] shadow-sm transition-colors hover:bg-white lg:hidden"
                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </nav>
      </div>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[rgba(17,32,51,0.34)] backdrop-blur-sm lg:hidden"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-x-4 top-[5.5rem] z-50 lg:hidden">
            <div className="floating-glass overflow-hidden rounded-[30px] border border-white/90 p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <BrandMark subtitle={isAdmin ? 'Performance Control' : 'Daily Fluency Lab'} />
                <div className="rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                  {isAdmin ? 'Admin' : 'Aluno'}
                </div>
              </div>

              <div className="space-y-2">
                {links.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname.startsWith(link.href)

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-[22px] px-4 py-3.5 text-base font-semibold transition-colors ${
                        isActive
                          ? 'bg-[var(--color-text)] text-white'
                          : 'bg-white/72 text-[var(--color-text)]'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                        {link.label}
                      </span>
                      <span className="text-xs uppercase tracking-[0.24em] opacity-70">
                        {isActive ? 'Atual' : 'Abrir'}
                      </span>
                    </Link>
                  )
                })}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-[24px] border border-[var(--color-border)] bg-white/72 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-accent-light))] font-bold text-[var(--color-text)]">
                    {(profile.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">{profile.username}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                      {isAdmin ? 'Administrador' : 'Membro'}
                    </p>
                  </div>
                </div>

                <form action={logoutAction}>
                  <button type="submit" className="btn-ghost px-4 py-2.5 text-sm">
                    <LogOut className="h-4 w-4" strokeWidth={2} />
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
