'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  Compass,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Settings,
  Swords,
  Trophy,
  User,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import { logoutAction } from '@/app/actions'
import BrandMark from '@/components/shared/BrandMark'
import ThemeToggle from '@/components/shared/ThemeToggle'
import type { NavbarProfile } from '@/components/shared/Navbar'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

import { useUIStore } from '@/store/uiStore'

interface NavbarClientProps {
  profile: NavbarProfile
}

type NavLinkItem = {
  href: string
  label: string
  desktopLabel?: string
  icon: typeof Home
  match?: string
}

export default function NavbarClient({ profile }: NavbarClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile.role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isZenMode = useUIStore((state) => state.isZenMode)
  const shouldLockMobileMenuScroll = mobileMenuOpen && !isZenMode

  const memberLinks = useMemo(
    (): NavLinkItem[] => [
      { href: '/home', label: 'Início', icon: Home },
      { href: '/tutor', label: 'Tutor IA', desktopLabel: 'Tutor', icon: MessageSquare },
      { href: '/explore', label: 'Explorar', icon: Compass },
      { href: '/arena', label: 'Arena', icon: Swords, match: '/arena/' },
      { href: '/review', label: 'Revisar', icon: BookOpen },
      { href: '/history', label: 'Histórico', icon: BarChart3 },
      { href: '/ranking', label: 'Ranking', icon: Trophy },
      { href: '/social', label: 'Social', icon: Users },
      { href: '/profile', label: 'Perfil', icon: User },
    ],
    []
  )

  const adminLinks = useMemo(
    (): NavLinkItem[] => [
      { href: '/admin/dashboard', label: 'Admin', icon: Settings, match: '/admin/' },
      { href: '/generate', label: 'Gerador IA', desktopLabel: 'Gerador', icon: Wand2 },
    ],
    []
  )

  const navLinks = useMemo(
    () => (isAdmin ? [...memberLinks, ...adminLinks] : memberLinks),
    [adminLinks, isAdmin, memberLinks]
  )
  const primaryMobileLinks = useMemo(
    () => navLinks.filter((link) => ['/home', '/tutor', '/review', '/arena', '/explore'].includes(link.href)),
    [navLinks]
  )
  const isMobileOverflowActive = navLinks.some(
    (link) =>
      !primaryMobileLinks.some((primaryLink) => primaryLink.href === link.href) &&
      isActive(link.href, link.match)
  )

  useEffect(() => {
    for (const link of navLinks) {
      if (link.href !== pathname) {
        router.prefetch(link.href)
      }
    }
  }, [navLinks, pathname, router])

  useEffect(() => {
    if (!shouldLockMobileMenuScroll) return

    const scrollY = window.scrollY
    const { body, documentElement } = document
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    documentElement.style.overscrollBehavior = 'none'

    return () => {
      body.style.overflow = previousBodyStyles.overflow
      body.style.position = previousBodyStyles.position
      body.style.top = previousBodyStyles.top
      body.style.width = previousBodyStyles.width
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior
      window.scrollTo(0, scrollY)
    }
  }, [shouldLockMobileMenuScroll])

  function isActive(href: string, match?: string) {
    if (match) return pathname === href || pathname.startsWith(match)
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function warmRoute(href: string) {
    if (href !== pathname) {
      router.prefetch(href)
    }
  }

  if (isZenMode) return null

  return (
    <>
      <div
        className="stitch-topbar"
        style={{ viewTransitionName: 'site-header' }}
      >
        <nav className="w-full" aria-label="Navegação principal">
          <div className="mx-auto flex max-w-[var(--page-width)] items-center gap-3 px-4 py-3 sm:px-6">
            <Link
              href={isAdmin ? '/admin/dashboard' : '/home'}
              transitionTypes={navBackTransitionTypes}
              className="shrink-0"
            >
              <BrandMark compact={false} />
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
              <div className="flex max-w-full items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-[0.85rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-1 shadow-[var(--shadow-sm)]">
              {memberLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href, link.match)
                const desktopLabel = link.desktopLabel || link.label
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                    onMouseEnter={() => warmRoute(link.href)}
                    onTouchStart={() => warmRoute(link.href)}
                    aria-label={link.label}
                    title={link.label}
                    className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[0.65rem] px-2.5 text-[13px] font-semibold leading-none transition-colors ${
                      active
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-sm)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="hidden xl:inline">{desktopLabel}</span>
                  </Link>
                )
              })}
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {isAdmin && (
                <div className="mr-2 flex items-center gap-1 border-r border-[var(--color-border)] pr-4">
                  {adminLinks.map((link) => {
                    const Icon = link.icon
                    const active = isActive(link.href, link.match)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        aria-label={link.label}
                        title={link.label}
                        className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[0.65rem] border px-2.5 text-[12px] font-bold leading-none transition-colors ${
                          active
                            ? 'border-transparent bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'
                            : 'border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] text-[var(--color-text-muted)] hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-600 dark:hover:border-amber-400/30 dark:hover:bg-amber-400/5 dark:hover:text-amber-400'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                        <span>{link.desktopLabel || link.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
              <ThemeToggle />
              <Link href="/profile" className="block" aria-label="Abrir perfil" title="Perfil">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username || 'Avatar'}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full border border-[rgba(193,200,196,0.5)] object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(193,200,196,0.5)] bg-[var(--color-surface-container-lowest)] text-sm font-bold text-[var(--color-primary)]">
                    {(profile.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[rgba(186,26,26,0.08)] hover:text-[var(--color-error)]"
                  aria-label="Sair"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[0.75rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] lg:hidden"
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
          className="fixed inset-0 z-[70] bg-[rgba(27,28,24,0.18)] backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute inset-x-4 top-20 max-h-[calc(100svh-7rem)] overscroll-contain overflow-y-auto rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xl)] sm:left-auto sm:right-6 sm:w-[24rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username || 'Avatar'}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full border border-[rgba(193,200,196,0.5)] object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(193,200,196,0.5)] bg-[var(--color-surface-container-lowest)] text-sm font-bold text-[var(--color-primary)]">
                    {(profile.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">{profile.username}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                    {isAdmin ? 'Administrador' : 'Membro'}
                  </p>
                </div>
              </Link>
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
                    className={`flex items-center justify-between rounded-[0.8rem] px-4 py-3 ${
                      active
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
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
        <div className="mx-auto flex max-w-md items-center justify-around gap-1 px-2 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-2">
          {primaryMobileLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href, link.match)
            return (
              <Link
                key={link.href}
                href={link.href}
                transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                onMouseEnter={() => warmRoute(link.href)}
                onTouchStart={() => warmRoute(link.href)}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center rounded-[0.8rem] px-1 py-2 ${
                  active ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-sm)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)]'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="mt-1 max-w-full truncate text-[9px] font-bold uppercase tracking-[0.04em]">
                  {link.label}
                </span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center rounded-[0.8rem] px-1 py-2 ${
              isMobileOverflowActive
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)]'
            }`}
            aria-label="Abrir mais opções"
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={isMobileOverflowActive ? 2.5 : 2} />
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.04em]">Mais</span>
          </button>
        </div>
      </div>
    </>
  )
}
