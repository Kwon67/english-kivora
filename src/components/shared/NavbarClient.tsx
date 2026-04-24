'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  Home,
  LogOut,
  Menu,
  Settings,
  Shield,
  Swords,
  Trophy,
  X,
} from 'lucide-react'
import { logoutAction } from '@/app/actions'
import BrandMark from '@/components/shared/BrandMark'
import ThemeToggle from '@/components/shared/ThemeToggle'
import type { NavbarProfile } from '@/components/shared/Navbar'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

interface NavbarClientProps {
  profile: NavbarProfile
}

export default function NavbarClient({ profile }: NavbarClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile.role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const memberLinks = useMemo(
    () => [
      { href: '/home', label: 'Lounge', icon: Home },
      { href: '/arena', label: 'Arena', icon: Swords, match: '/arena/' },
      { href: '/review', label: 'Review', icon: BookOpen },
      { href: '/history', label: 'History', icon: BarChart3 },
      { href: '/ranking', label: 'Ranking', icon: Trophy },
      { href: '/problem-words', label: 'Words', icon: Shield },
    ],
    []
  )

  const adminLinks = useMemo(
    () => [
      { href: '/admin/dashboard', label: 'Admin', icon: Settings, match: '/admin/' },
    ],
    []
  )

  const navLinks = useMemo(
    () => (isAdmin ? [...memberLinks, ...adminLinks] : memberLinks),
    [adminLinks, isAdmin, memberLinks]
  )

  useEffect(() => {
    for (const link of navLinks) {
      if (link.href !== pathname) {
        router.prefetch(link.href)
      }
    }
  }, [navLinks, pathname, router])

  function isActive(href: string, match?: string) {
    if (match) return pathname === href || pathname.startsWith(match)
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function warmRoute(href: string) {
    if (href !== pathname) {
      router.prefetch(href)
    }
  }

  return (
    <>
      <div
        className="stitch-topbar"
        style={{ viewTransitionName: 'site-header' }}
      >
        <nav className="w-full">
          <div className="mx-auto flex max-w-[var(--page-width)] items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href={isAdmin ? '/admin/dashboard' : '/home'} transitionTypes={navBackTransitionTypes}>
              <BrandMark compact={false} />
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href, link.match)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                    onMouseEnter={() => warmRoute(link.href)}
                    onTouchStart={() => warmRoute(link.href)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                      active
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_10px_20px_rgba(0,0,0,0.1)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <ThemeToggle />
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(193,200,196,0.5)] bg-[var(--color-surface-container-lowest)] text-sm font-bold text-[var(--color-primary)]">
                {(profile.username || 'U').charAt(0).toUpperCase()}
              </div>
              <form action={logoutAction}>
                <button type="submit" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-error)]">
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  Sair
                </button>
              </form>
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] sm:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[70] bg-[rgba(27,28,24,0.18)] backdrop-blur-sm sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute inset-x-4 top-20 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xl)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(193,200,196,0.5)] bg-[var(--color-surface-container-lowest)] text-sm font-bold text-[var(--color-primary)]">
                  {(profile.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">{profile.username}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                    {isAdmin ? 'Administrador' : 'Membro'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <form action={logoutAction}>
                  <button type="submit" className="btn-ghost px-4 py-2 text-sm">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </form>
              </div>
            </div>

            <div className="grid gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href, link.match)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                    onClick={() => setMobileMenuOpen(false)}
                    onMouseEnter={() => warmRoute(link.href)}
                    onTouchStart={() => warmRoute(link.href)}
                    className={`flex items-center justify-between rounded-[1.1rem] px-4 py-3 ${
                      active
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-surface-container-low)] text-[var(--color-text)]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      <span className="text-sm font-semibold">{link.label}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em] opacity-70">
                      {active ? 'Atual' : 'Abrir'}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="stitch-mobile-nav sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-1 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
          {navLinks.slice(0, 6).map((link) => {
            const Icon = link.icon
            const active = isActive(link.href, link.match)
            return (
              <Link
                key={link.href}
                href={link.href}
                transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                onMouseEnter={() => warmRoute(link.href)}
                onTouchStart={() => warmRoute(link.href)}
                className={`flex flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 ${
                  active ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] whitespace-nowrap">
                  {link.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
