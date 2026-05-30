'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import BrandMark from '@/components/ui/BrandMark'
import type { NavbarProfile } from '@/components/layout/Navbar'
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

const mobileGlassPanel =
  'no-scrollbar absolute inset-x-4 top-20 max-h-[calc(100svh-7rem)] overscroll-none overflow-x-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 px-4 pb-2 pt-4 shadow-[var(--shadow-xl)] backdrop-blur-md sm:left-auto sm:right-6 sm:w-[24rem]'
const mobileMenuItem =
  'flex items-center justify-between px-4 py-3 transition-colors'

export default function NavbarClient({ profile }: NavbarClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile.role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuScrollable, setMobileMenuScrollable] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
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
    () => navLinks.filter((link) => ['/home', '/tutor', '/review', '/arena', '/profile'].includes(link.href)),
    [navLinks]
  )
  const isMobileOverflowActive = navLinks.some(
    (link) =>
      !primaryMobileLinks.some((primaryLink) => primaryLink.href === link.href) &&
      isActive(link.href, link.match)
  )

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

  useEffect(() => {
    if (!mobileMenuOpen) {
      const resetTimer = window.setTimeout(() => setMobileMenuScrollable(false), 0)
      return () => window.clearTimeout(resetTimer)
    }

    const panel = mobileMenuRef.current
    if (!panel) return

    function updateScrollable() {
      const currentPanel = mobileMenuRef.current
      if (!currentPanel) return
      setMobileMenuScrollable(currentPanel.scrollHeight > currentPanel.clientHeight + 1)
    }

    updateScrollable()

    const resizeObserver = new ResizeObserver(updateScrollable)
    resizeObserver.observe(panel)
    window.addEventListener('resize', updateScrollable)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateScrollable)
    }
  }, [mobileMenuOpen, navLinks.length])

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
          <div className="mx-auto flex w-full max-w-[var(--page-width)] items-center gap-3 overflow-x-clip px-4 py-3 sm:px-6">
            <Link
              href={isAdmin ? '/admin/dashboard' : '/home'}
              transitionTypes={navBackTransitionTypes}
              prefetch={false}
              className="shrink-0"
            >
              <BrandMark compact={false} />
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center overflow-x-clip lg:flex">
              <div className="no-scrollbar flex max-w-full items-center gap-5 overflow-x-auto">
              {memberLinks.map((link) => {
                const active = isActive(link.href, link.match)
                const desktopLabel = link.desktopLabel || link.label
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                    prefetch={false}
                    onMouseEnter={() => warmRoute(link.href)}
                    onTouchStart={() => warmRoute(link.href)}
                    aria-label={link.label}
                    title={link.label}
                    className={`inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap px-1 text-[13px] font-bold leading-none transition-colors ${
                      active
                        ? 'text-emerald-800'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {desktopLabel}
                  </Link>
                )
              })}
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {isAdmin && (
                <div className="mr-2 flex items-center gap-4 border-r border-[var(--color-border)] pr-4">
                  {adminLinks.map((link) => {
                    const active = isActive(link.href, link.match)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={false}
                        aria-label={link.label}
                        title={link.label}
                        className={`inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap px-1 text-[12px] font-bold leading-none transition-colors ${
	                          active
	                            ? 'text-amber-600'
	                            : 'text-[var(--color-text-muted)] hover:text-amber-600'
	                        }`}
                      >
                        <span>{link.desktopLabel || link.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
              <Link href="/profile" prefetch={false} className="block" aria-label="Abrir perfil" title="Perfil">
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
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.75rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] lg:hidden"
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
          className="fixed inset-0 z-[70] max-w-[100vw] overflow-x-hidden bg-white/10 backdrop-blur-2xl [touch-action:pan-y] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            ref={mobileMenuRef}
            className={`${mobileGlassPanel} ${mobileMenuScrollable ? 'overflow-y-auto [touch-action:pan-y]' : 'overflow-y-hidden [touch-action:none]'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-emerald-50/35" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/12 blur-[70px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-500/10 blur-[80px]" />

            <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/profile" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username || 'Avatar'}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full border border-zinc-200/70 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200/70 bg-white/55 text-sm font-bold text-emerald-800 shadow-sm">
                    {(profile.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-zinc-900">{profile.username}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    {isAdmin ? 'Administrador' : 'Membro'}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <form action={logoutAction}>
                  <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[32px] border border-zinc-200/70 bg-white/45 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-emerald-700">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </form>
              </div>
            </div>

            <div className="grid gap-2 pb-0">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href, link.match)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    onMouseEnter={() => warmRoute(link.href)}
                    onTouchStart={() => warmRoute(link.href)}
                    className={`${mobileMenuItem} ${
                      active
                        ? 'text-emerald-800'
                        : 'text-zinc-800 hover:text-emerald-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      <span className="text-sm font-bold">{link.label}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
            </div>
          </div>
        </div>
      )}

      <div className="stitch-mobile-nav sm:hidden">
        <div className="mx-auto flex w-full max-w-md items-center justify-around gap-1 overflow-x-clip px-2 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-2 [touch-action:pan-y]">
          {primaryMobileLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href, link.match)
            return (
              <Link
                key={link.href}
                href={link.href}
                transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                prefetch={false}
                onMouseEnter={() => warmRoute(link.href)}
                onTouchStart={() => warmRoute(link.href)}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center px-1 py-2 ${
                  active ? 'text-emerald-800' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
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
            className={`flex min-h-14 flex-1 flex-col items-center justify-center px-1 py-2 ${
              isMobileOverflowActive
                ? 'text-emerald-800'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
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
