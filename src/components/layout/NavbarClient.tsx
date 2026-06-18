'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, TouchEvent, WheelEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  BarChart3,
  BookOpen,
  Compass,
  Home,
  ListChecks,
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
import ThemeToggle from '@/components/ui/ThemeToggle'
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
  exact?: boolean
}

const PRIMARY_DESKTOP_HREFS = new Set(['/home', '/tutor', '/explore', '/arena', '/review'])

const desktopNavLinkClass = (active: boolean) =>
  `inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap px-1 text-[12px] font-bold leading-none transition-colors duration-150 xl:text-[13px] ${
    active
      ? 'text-primary'
      : 'text-text-muted hover:text-text hover:text-primary'
  }`

const mobileGlassPanel =
  'no-scrollbar absolute inset-x-3 top-[4.75rem] max-h-[calc(100vh-6.5rem)] max-h-[calc(100svh-6.5rem)] overscroll-none overflow-x-hidden rounded-2xl border border-border bg-[rgba(244,245,232,0.92)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-2 pb-2 pt-2 shadow-[var(--shadow-xl)] backdrop-blur-[18px] backdrop-saturate-[140%] dark:bg-[rgba(5,7,4,0.92)] sm:left-auto sm:right-6 sm:w-[24rem]'
const mobileMenuItem =
  'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors duration-150'

function mobileNavItemClass(active: boolean, isAdminLink = false) {
  if (isAdminLink && active) {
    return `${mobileMenuItem} bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300`
  }

  if (isAdminLink) {
    return `${mobileMenuItem} text-text-muted hover:bg-surface-container-low hover:text-amber-600 dark:hover:text-amber-300`
  }

  if (active) {
    return `${mobileMenuItem} bg-primary-light text-primary dark:bg-primary/10`
  }

  return `${mobileMenuItem} text-text hover:bg-surface-container-low`
}

function DesktopMoreMenu({
  links,
  isActive,
  warmRoute,
}: {
  links: NavLinkItem[]
  isActive: (href: string, match?: string, exact?: boolean) => boolean
  warmRoute: (href: string) => void
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const isAnyActive = links.some((link) => isActive(link.href, link.match, link.exact))

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  if (links.length === 0) return null

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={desktopNavLinkClass(isAnyActive)}
      >
        Mais
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.45rem)] z-[120] min-w-[11.5rem] overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-[var(--shadow-xl)]"
        >
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href, link.match, link.exact)
            return (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                prefetch={false}
                onClick={() => setOpen(false)}
                onMouseEnter={() => warmRoute(link.href)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-bold transition-colors duration-150 ${ active ? 'bg-primary-light text-primary dark:bg-primary/10' : 'text-text hover:bg-surface-container-low' }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function IconTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="bottom"
          sideOffset={8}
          className="z-[120] rounded-md bg-gray-900 px-2 py-1 text-xs font-semibold text-white shadow-sm"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default function NavbarClient({ profile }: NavbarClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = profile.role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuScrollable, setMobileMenuScrollable] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
  const mobileMenuContentRef = useRef<HTMLDivElement | null>(null)
  const isZenMode = useUIStore((state) => state.isZenMode)
  const shouldLockMobileMenuScroll = mobileMenuOpen && !isZenMode

  const memberLinks = useMemo(
    (): NavLinkItem[] => [
      { href: '/home', label: 'Início', icon: Home },
      { href: '/tutor', label: 'Tutor IA', desktopLabel: 'Tutor', icon: MessageSquare },
      { href: '/explore', label: 'Explorar', icon: Compass },
      { href: '/study', label: 'Rotina', icon: ListChecks },
      { href: '/arena', label: 'Arena', icon: Swords, match: '/arena/' },
      { href: '/review', label: 'Revisar', icon: BookOpen },
      { href: '/history', label: 'Histórico', icon: BarChart3 },
      { href: '/ranking', label: 'Ranking', icon: Trophy },
      { href: '/social', label: 'Social', icon: Users },
      { href: '/profile', label: 'Perfil', icon: User, exact: true },
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
  const desktopCenterLinks = useMemo(
    () => memberLinks.filter((link) => link.href !== '/profile'),
    [memberLinks]
  )
  const primaryDesktopLinks = useMemo(
    () => desktopCenterLinks.filter((link) => PRIMARY_DESKTOP_HREFS.has(link.href)),
    [desktopCenterLinks]
  )
  const secondaryDesktopLinks = useMemo(
    () => desktopCenterLinks.filter((link) => !PRIMARY_DESKTOP_HREFS.has(link.href)),
    [desktopCenterLinks]
  )
  const primaryMobileLinks = useMemo(
    () => navLinks.filter((link) => ['/home', '/tutor', '/review', '/arena', '/profile'].includes(link.href)),
    [navLinks]
  )
  const isMobileOverflowActive = navLinks.some(
    (link) =>
      !primaryMobileLinks.some((primaryLink) => primaryLink.href === link.href) &&
      isActive(link.href, link.match, link.exact)
  )

  const mobileMenuOverlayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!shouldLockMobileMenuScroll) return

    const scrollY = window.scrollY
    const { body, documentElement } = document
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      touchAction: body.style.touchAction,
    }
    const previousHtmlStyles = {
      overflow: documentElement.style.overflow,
      overscrollBehavior: documentElement.style.overscrollBehavior,
      touchAction: documentElement.style.touchAction,
    }

    documentElement.dataset.scrollLock = 'true'
    documentElement.style.overflow = 'hidden'
    documentElement.style.overscrollBehavior = 'none'
    documentElement.style.touchAction = 'none'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.touchAction = 'none'

    return () => {
      delete documentElement.dataset.scrollLock
      documentElement.style.overflow = previousHtmlStyles.overflow
      documentElement.style.overscrollBehavior = previousHtmlStyles.overscrollBehavior
      documentElement.style.touchAction = previousHtmlStyles.touchAction
      body.style.overflow = previousBodyStyles.overflow
      body.style.position = previousBodyStyles.position
      body.style.top = previousBodyStyles.top
      body.style.width = previousBodyStyles.width
      body.style.touchAction = previousBodyStyles.touchAction

      const viewportOffset = window.visualViewport?.offsetTop ?? 0
      window.scrollTo(0, scrollY + viewportOffset)
    }
  }, [shouldLockMobileMenuScroll])

  useEffect(() => {
    const overlay = mobileMenuOverlayRef.current
    if (!overlay || !mobileMenuOpen) return

    const blockBackgroundScroll = (event: Event) => {
      event.preventDefault()
    }

    overlay.addEventListener('touchmove', blockBackgroundScroll, { passive: false })
    overlay.addEventListener('wheel', blockBackgroundScroll, { passive: false })

    return () => {
      overlay.removeEventListener('touchmove', blockBackgroundScroll)
      overlay.removeEventListener('wheel', blockBackgroundScroll)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) {
      const resetTimer = window.setTimeout(() => setMobileMenuScrollable(false), 0)
      return () => window.clearTimeout(resetTimer)
    }

    const panel = mobileMenuRef.current
    if (!panel) return

    function updateScrollable() {
      const currentPanel = mobileMenuRef.current
      const currentContent = mobileMenuContentRef.current
      if (!currentPanel || !currentContent) return
      setMobileMenuScrollable(currentContent.scrollHeight > currentPanel.clientHeight + 1)
    }

    updateScrollable()

    const resizeObserver = new ResizeObserver(updateScrollable)
    resizeObserver.observe(panel)
    if (mobileMenuContentRef.current) {
      resizeObserver.observe(mobileMenuContentRef.current)
    }
    window.addEventListener('resize', updateScrollable)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateScrollable)
    }
  }, [mobileMenuOpen, navLinks.length])

  function isActive(href: string, match?: string, exact = false) {
    if (exact) return pathname === href
    if (match) return pathname === href || pathname.startsWith(match)
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function warmRoute(href: string) {
    if (href !== pathname) {
      router.prefetch(href)
    }
  }

  function handleMobileMenuTouchMove(event: TouchEvent<HTMLDivElement>) {
    event.stopPropagation()
    if (!mobileMenuScrollable) {
      event.preventDefault()
    }
  }

  function handleMobileMenuWheel(event: WheelEvent<HTMLDivElement>) {
    event.stopPropagation()
    if (!mobileMenuScrollable) {
      event.preventDefault()
    }
  }

  if (isZenMode) return null

  return (
    <Tooltip.Provider delayDuration={400}>
      <div
        className="stitch-topbar"
        style={{ viewTransitionName: 'site-header' }}
      >
        <nav className="w-full" aria-label="Navegação principal">
          <div className="mx-auto grid w-full max-w-[var(--page-width)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:gap-4">
            <Link
              href={isAdmin ? '/admin/dashboard' : '/home'}
              transitionTypes={navBackTransitionTypes}
              prefetch={false}
              className="shrink-0"
            >
              <BrandMark compact className="hidden lg:flex xl:hidden" />
              <BrandMark compact={false} className="flex lg:hidden xl:flex" />
            </Link>

            <div className="hidden min-w-0 items-center justify-center lg:flex">
              <div className="flex max-w-full items-center gap-3 xl:gap-5">
                {primaryDesktopLinks.map((link) => {
                  const active = isActive(link.href, link.match, link.exact)
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
                      className={desktopNavLinkClass(active)}
                    >
                      {desktopLabel}
                    </Link>
                  )
                })}
                <div className="xl:hidden">
                  <DesktopMoreMenu
                    links={secondaryDesktopLinks}
                    isActive={isActive}
                    warmRoute={warmRoute}
                  />
                </div>
                {secondaryDesktopLinks.map((link) => {
                  const active = isActive(link.href, link.match, link.exact)
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
                      className={`${desktopNavLinkClass(active)} hidden xl:inline-flex`}
                    >
                      {desktopLabel}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
              <div className="hidden items-center gap-1.5 lg:flex xl:gap-2">
                {isAdmin && (
                  <div className="mr-1 flex items-center gap-3 border-r border-border pr-3 xl:mr-2 xl:gap-4 xl:pr-4">
                    {adminLinks.map((link) => {
                      const active = isActive(link.href, link.match, link.exact)
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          prefetch={false}
                          aria-label={link.label}
                          title={link.label}
                          className={`inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap px-1 text-[11px] font-bold leading-none transition-colors duration-150 xl:text-[12px] ${ active ? 'text-amber-600' : 'text-text-muted hover:text-amber-600' }`}
                        >
                          <span>{link.desktopLabel || link.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
                <IconTooltip label="Tema">
                  <span className="inline-flex">
                    <ThemeToggle />
                  </span>
                </IconTooltip>
                <IconTooltip label="Perfil">
                  <Link href="/profile" prefetch={false} className="block" aria-label="Abrir perfil">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username || 'Avatar'}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full border border-[rgba(193,200,196,0.5)] object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(193,200,196,0.5)] bg-surface-container-lowest text-sm font-bold text-primary">
                        {(profile.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                </IconTooltip>
                <form action={logoutAction}>
                  <IconTooltip label="Sair">
                    <button
                      type="submit"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors duration-150 hover:bg-[rgba(186,26,26,0.08)] hover:text-[var(--color-error)]"
                      aria-label="Sair"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </IconTooltip>
                </form>
              </div>

              <IconTooltip label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.75rem] border border-border bg-surface-container-lowest text-primary transition-colors duration-150 hover:bg-surface-container-low hover:text-primary-dark lg:hidden"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </IconTooltip>
            </div>
          </div>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div
          ref={mobileMenuOverlayRef}
          className="fixed inset-0 z-[70] max-w-[100vw] overflow-x-hidden bg-black/10 backdrop-blur-[2px] [touch-action:none] dark:bg-black/35 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            ref={mobileMenuRef}
            className={`${mobileGlassPanel} ${mobileMenuScrollable ? 'overflow-y-auto [touch-action:pan-y]' : 'overflow-y-hidden [touch-action:none]'}`}
            onClick={(e) => e.stopPropagation()}
            onTouchMove={handleMobileMenuTouchMove}
            onWheel={handleMobileMenuWheel}
          >
            <div ref={mobileMenuContentRef}>
              <div className="mb-2 flex items-center justify-between border-b border-border px-1.5 pb-3 pt-1">
                <Link
                  href="/profile"
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-w-0 items-center gap-3"
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username || 'Avatar'}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border border-[rgba(193,200,196,0.5)] object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(193,200,196,0.5)] bg-surface-container-lowest text-sm font-bold text-primary">
                      {(profile.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text">{profile.username}</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                      {isAdmin ? 'Administrador' : 'Membro'}
                    </p>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center gap-1.5">
                  <ThemeToggle />
                  <form action={logoutAction} className="inline-flex">
                    <button
                      type="submit"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors duration-150 hover:bg-[rgba(186,26,26,0.08)] hover:text-[var(--color-error)]"
                      aria-label="Sair"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </form>
                </div>
              </div>

              <div className="grid gap-0.5 py-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.href, link.match, link.exact)
                  const isAdminLink = adminLinks.some((adminLink) => adminLink.href === link.href)

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                      prefetch={link.href === '/profile'}
                      scroll
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={() => warmRoute(link.href)}
                      onTouchStart={() => warmRoute(link.href)}
                      className={mobileNavItemClass(active, isAdminLink)}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="stitch-mobile-nav sm:hidden">
        <div className="mx-auto flex w-full max-w-md items-center justify-around gap-1 px-2 pb-2 pt-2 [touch-action:pan-y]">
          {primaryMobileLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href, link.match, link.exact)
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={link.href === '/profile'}
                scroll
                transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                onMouseEnter={() => warmRoute(link.href)}
                onTouchStart={() => warmRoute(link.href)}
                className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 transition-colors duration-150 ${ active ? 'text-primary' : 'text-text-muted hover:text-primary' }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className="mt-1 max-w-full truncate text-[9px] font-bold uppercase tracking-[0.04em]">
                  {link.desktopLabel || link.label}
                </span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 transition-colors duration-150 ${ isMobileOverflowActive ? 'text-primary' : 'text-text-muted hover:text-primary' }`}
            aria-label="Abrir mais opções"
          >
            <MoreHorizontal className="h-5 w-5 shrink-0" strokeWidth={isMobileOverflowActive ? 2.5 : 2} />
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.04em]">Mais</span>
          </button>
        </div>
      </div>
    </Tooltip.Provider>
  )
}
