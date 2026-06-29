'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, TouchEvent, WheelEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  BarChart3,
  BookOpen,
  Brain,
  Compass,
  Home,
  LibraryBig,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Settings,
  Settings2,
  Zap,
  Trophy,
  Wand2,
  X,
} from 'lucide-react'
import { logoutAction } from '@/app/actions'

import type { NavbarProfile } from '@/components/layout/Navbar'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

import { trackUxEvent } from '@/lib/uxAnalytics'
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

const PRIMARY_DESKTOP_HREFS = new Set(['/home', '/tutor', '/explore', '/blitz', '/review'])
const PRIMARY_MOBILE_HREFS = new Set(['/home', '/review', '/study', '/blitz', '/settings'])

const NAV_MENU_GROUPS: { title: string; hrefs: string[] }[] = [
  { title: 'Estudar', hrefs: ['/explore', '/study', '/history'] },
  { title: 'Praticar', hrefs: ['/review', '/blitz', '/tutor'] },
  { title: 'Progresso', hrefs: ['/ranking', '/problem-words'] },
  { title: 'Conta', hrefs: ['/library', '/settings'] },
]

function buildNavMenuGroups(links: NavLinkItem[], excludeHrefs: Set<string>) {
  const linkByHref = new Map(links.map((link) => [link.href, link]))

  return NAV_MENU_GROUPS.map((group) => ({
    title: group.title,
    links: group.hrefs
      .map((href) => linkByHref.get(href))
      .filter((link): link is NavLinkItem => {
        if (!link) return false
        return !excludeHrefs.has(link.href)
      }),
  })).filter((group) => group.links.length > 0)
}

const desktopNavLinkClass = (active: boolean) =>
  `inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap px-1 font-body text-sm font-medium leading-none transition-colors ${
    active
      ? 'text-brand-dark'
      : 'text-brand-dark hover:text-brand-secondary'
  }`

const mobileMenuPanel =
  'no-scrollbar absolute inset-x-3 top-[var(--app-topbar-height)] max-h-[calc(100dvh-var(--app-topbar-height)-1rem)] overscroll-none overflow-x-hidden rounded-2xl border-2 border-brand-dark bg-bg-card px-2 pb-2 pt-2 shadow-[6px_6px_0_var(--color-brand-dark)] sm:left-auto sm:right-6 sm:w-[min(24rem,calc(100vw-3rem))]'
const mobileMenuItem =
  'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 font-heading text-sm font-bold transition-colors'
const mobileMenuGroupTitle =
  'px-3.5 py-2 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark'

function mobileNavItemClass(active: boolean) {
  if (active) {
    return `${mobileMenuItem} border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[2px_2px_0_var(--color-brand-dark)]`
  }

  return `${mobileMenuItem} text-brand-dark hover:bg-bg-primary hover:text-brand-secondary`
}

function DesktopMoreMenu({
  groups,
  isActive,
  warmRoute,
}: {
  groups: { title: string; links: NavLinkItem[] }[]
  isActive: (href: string, match?: string, exact?: boolean) => boolean
  warmRoute: (href: string) => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const isAnyActive = groups.some((group) =>
    group.links.some((link) => isActive(link.href, link.match, link.exact))
  )

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

  if (groups.length === 0) return null

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
          className="absolute right-0 top-[calc(100%+0.45rem)] z-[120] min-w-[11.5rem] overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card py-1.5 shadow-[4px_4px_0_var(--color-brand-dark)]"
        >
          {groups.map((group, groupIndex) => (
            <div key={group.title} className={groupIndex > 0 ? 'mt-1 border-t border-brand-border pt-1' : ''}>
              <p className={mobileMenuGroupTitle}>
                {group.title}
              </p>
              {group.links.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href, link.match, link.exact)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    aria-current={active ? 'page' : undefined}
                    aria-label={link.label}
                    transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                    prefetch={false}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => warmRoute(link.href)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 font-heading text-sm font-bold transition-colors ${ active ? 'bg-brand-accent text-brand-dark' : 'text-brand-dark hover:bg-bg-primary hover:text-brand-secondary' }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
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
          className="z-[120] rounded-md bg-brand-dark px-2 py-1 font-body text-xs font-semibold text-white shadow-sm"
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
      { href: '/blitz', label: 'Blitz', icon: Zap, match: '/blitz/' },
      { href: '/review', label: 'Revisar', icon: BookOpen },
      { href: '/history', label: 'Histórico', icon: BarChart3 },
      { href: '/ranking', label: 'Ranking', icon: Trophy },
      { href: '/problem-words', label: 'Dificuldades', icon: Brain },
      { href: '/library', label: 'Biblioteca', icon: LibraryBig },
      { href: '/settings', label: 'Conta', icon: Settings2 },
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
    () => memberLinks,
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
    () => navLinks.filter((link) => PRIMARY_MOBILE_HREFS.has(link.href)),
    [navLinks]
  )
  const mobileOverflowGroups = useMemo(
    () => buildNavMenuGroups(memberLinks, PRIMARY_MOBILE_HREFS),
    [memberLinks]
  )
  const desktopMoreGroups = useMemo(
    () => buildNavMenuGroups(secondaryDesktopLinks, new Set()),
    [secondaryDesktopLinks]
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

  function trackNavClick(href: string, label: string) {
    trackUxEvent('nav_click', { href, label })
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
      <div className="sticky top-0 z-50 border-b border-brand-border bg-bg-primary" style={{ viewTransitionName: 'site-header' }}>
        <nav className="w-full" aria-label="Navegação principal">
          <div className="mx-auto flex w-full max-w-[var(--page-width)] items-center justify-between gap-6 px-6 py-3">
            <Link
              href={isAdmin ? '/admin/dashboard' : '/home'}
              transitionTypes={navBackTransitionTypes}
              prefetch={false}
              className="shrink-0 font-heading text-lg font-bold text-brand-dark transition-colors hover:text-brand-secondary"
            >
              Kivora English
            </Link>

            <div className="hidden min-w-0 items-center justify-center lg:flex">
              <div className="flex max-w-full flex-nowrap items-center gap-3 overflow-x-auto 2xl:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                      aria-current={active ? 'page' : undefined}
                      aria-label={link.label}
                      className={desktopNavLinkClass(active)}
                    >
                      {desktopLabel}
                    </Link>
                  )
                })}
                <div className="2xl:hidden">
                  <DesktopMoreMenu
                    groups={desktopMoreGroups}
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
                      aria-current={active ? 'page' : undefined}
                      aria-label={link.label}
                      className={`${desktopNavLinkClass(active)} hidden 2xl:inline-flex`}
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
                  <div className="mr-1 flex items-center gap-3 border-r border-brand-border pr-3 xl:mr-2 xl:gap-4 xl:pr-4">
                    {adminLinks.map((link) => {
                      const active = isActive(link.href, link.match, link.exact)
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          prefetch={false}
                          aria-current={active ? 'page' : undefined}
                          aria-label={link.label}
                          className={`inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap px-1 font-body text-sm font-medium leading-none transition-colors ${ active ? 'text-brand-dark' : 'text-brand-dark hover:text-brand-secondary' }`}
                        >
                          <span>{link.desktopLabel || link.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
                <IconTooltip label="Conta e configurações">
                  <Link
                    href="/settings"
                    prefetch={false}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-dark transition-colors hover:bg-bg-card hover:text-brand-secondary"
                    aria-label="Abrir conta e configurações"
                  >
                    <Settings2 className="h-4.5 w-4.5" strokeWidth={2} />
                  </Link>
                </IconTooltip>
                <form action={logoutAction}>
                  <IconTooltip label="Sair">
                    <button
                      type="submit"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-dark transition-colors hover:bg-bg-card hover:text-brand-secondary"
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-brand-dark bg-bg-card text-brand-dark shadow-[2px_2px_0_var(--color-brand-dark)] transition-colors hover:bg-brand-accent lg:hidden"
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
          className="fixed inset-0 z-[70] max-w-[100vw] overflow-x-hidden bg-brand-dark/25 [touch-action:none] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            ref={mobileMenuRef}
            className={`${mobileMenuPanel} ${mobileMenuScrollable ? 'overflow-y-auto [touch-action:pan-y]' : 'overflow-y-hidden [touch-action:none]'}`}
            onClick={(e) => e.stopPropagation()}
            onTouchMove={handleMobileMenuTouchMove}
            onWheel={handleMobileMenuWheel}
          >
            <div ref={mobileMenuContentRef}>
              <div className="mb-2 rounded-xl border-2 border-brand-dark bg-bg-primary px-3 py-3 shadow-[3px_3px_0_var(--color-brand-dark)]">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/settings"
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[2px_2px_0_var(--color-brand-dark)]">
                      <Settings2 className="h-4.5 w-4.5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-sm font-bold text-brand-dark">{profile.username}</p>
                      <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                        {isAdmin ? 'Administrador' : 'Conta'}
                      </p>
                    </div>
                  </Link>
                  <form action={logoutAction} className="inline-flex shrink-0">
                    <button
                      type="submit"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-brand-dark bg-bg-card text-brand-dark shadow-[2px_2px_0_var(--color-brand-dark)] transition-colors hover:bg-brand-accent"
                      aria-label="Sair"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </form>
                </div>
              </div>

              <div className="grid gap-0.5 py-1.5">
                {mobileOverflowGroups.map((group, groupIndex) => (
                  <div key={group.title} className={groupIndex > 0 ? 'mt-2 border-t border-brand-border pt-2' : ''}>
                    <p className={mobileMenuGroupTitle}>
                      {group.title}
                    </p>
                    {group.links.map((link) => {
                      const Icon = link.icon
                      const active = isActive(link.href, link.match, link.exact)

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                          prefetch={false}
                          scroll
                          aria-current={active ? 'page' : undefined}
                          aria-label={link.label}
                          onClick={() => setMobileMenuOpen(false)}
                          onMouseEnter={() => warmRoute(link.href)}
                          onTouchStart={() => warmRoute(link.href)}
                          className={mobileNavItemClass(active)}
                        >
                          <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                          <span>{link.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ))}
                {isAdmin ? (
                  <div className="mt-2 border-t border-brand-border pt-2">
                    <p className={mobileMenuGroupTitle}>
                      Admin
                    </p>
                    {adminLinks.map((link) => {
                      const Icon = link.icon
                      const active = isActive(link.href, link.match, link.exact)

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          transitionTypes={navForwardTransitionTypes}
                          prefetch={false}
                          scroll
                          aria-current={active ? 'page' : undefined}
                          aria-label={link.label}
                          onClick={() => setMobileMenuOpen(false)}
                          onMouseEnter={() => warmRoute(link.href)}
                          onTouchStart={() => warmRoute(link.href)}
                          className={mobileNavItemClass(active)}
                        >
                          <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                          <span>{link.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-brand-border bg-bg-primary md:hidden">
        <div className="mx-auto flex w-full max-w-md items-center justify-around gap-1 px-2 pb-2 pt-2 [touch-action:pan-y]">
          {primaryMobileLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href, link.match, link.exact)
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={link.href === '/settings'}
                scroll
                aria-current={active ? 'page' : undefined}
                aria-label={link.label}
                transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                onMouseEnter={() => warmRoute(link.href)}
                onTouchStart={() => warmRoute(link.href)}
                onClick={() => trackNavClick(link.href, link.label)}
                className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 transition-colors ${ active ? 'text-brand-dark' : 'text-brand-dark hover:text-brand-secondary' }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span className="mt-1 max-w-full truncate font-heading text-[9px] font-bold uppercase tracking-widest">
                  {link.desktopLabel || link.label}
                </span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 transition-colors ${ isMobileOverflowActive ? 'text-brand-dark' : 'text-brand-dark hover:text-brand-secondary' }`}
            aria-label="Abrir mais opções"
          >
            <MoreHorizontal className="h-5 w-5 shrink-0" strokeWidth={isMobileOverflowActive ? 2.5 : 2} />
            <span className="mt-1 font-heading text-[9px] font-bold uppercase tracking-widest">Mais</span>
          </button>
        </div>
      </div>
    </Tooltip.Provider>
  )
}
