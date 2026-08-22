'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import type { ReactNode } from 'react'
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
  Wand2,
  X,
} from 'lucide-react'
import { logoutAction } from '@/app/actions'

import type { NavbarProfile } from '@/components/layout/Navbar'
import MobileNavMenu from '@/components/layout/MobileNavMenu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu'
import { homeIconBoxSm, homeSmallPillClass } from '@/lib/homeStyles'
import { landingRadius } from '@/lib/landingStyles'
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
/* Four tabs + "Mais" = five targets, the practical ceiling for a thumb-width bar. Account lives
   in the overflow sheet: it is a settings destination, not a daily task, and having both "Conta"
   and "Mais" on the bar gave the learner two lookalike catch-alls to choose between. */
const PRIMARY_MOBILE_HREFS = new Set(['/home', '/review', '/study', '/blitz'])

const NAV_MENU_GROUPS: { title: string; hrefs: string[] }[] = [
  { title: 'Estudar', hrefs: ['/explore', '/study', '/history'] },
  { title: 'Praticar', hrefs: ['/review', '/blitz', '/tutor'] },
  { title: 'Progresso', hrefs: ['/problem-words'] },
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

const mobileMenuIconBox = (active: boolean) =>
  active
    ? `${homeIconBoxSm} bg-bg-card`
    : homeIconBoxSm
const mobileMenuGroupTitle = `mb-1.5 px-1 ${homeSmallPillClass}`

function desktopMoreMenuItemClass(active: boolean) {
  return `flex items-center gap-3 px-3.5 py-2.5 font-heading text-sm font-bold transition-colors ${
    active ? 'bg-brand-accent text-brand-dark' : 'text-brand-dark hover:bg-bg-primary'
  }`
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
  const isAnyActive = groups.some((group) =>
    group.links.some((link) => isActive(link.href, link.match, link.exact))
  )

  if (groups.length === 0) return null

  return (
    // Era `role="menu"` escrito à mão com clique-fora via listener de `mousedown`: prometia o
    // contrato de um menu ARIA de verdade mas não entregava teclado nenhum — sem Esc, sem
    // ArrowDown/ArrowUp/Home/End entre itens, foco não entrava no menu nem voltava ao "Mais" ao
    // fechar. DropdownMenu do Radix cobre os quatro nativamente.
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className={desktopNavLinkClass(isAnyActive)}
        >
          Mais
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={7}
        className={`min-w-[12rem] gap-0 rounded-container border border-brand-dark bg-bg-card p-0 py-2 shadow-[0_8px_24px_rgba(28,25,21,0.08)] ring-0`}
      >
        {groups.map((group, groupIndex) => (
          <DropdownMenuGroup
            key={group.title}
            className={groupIndex > 0 ? 'mt-2 border-t border-brand-border pt-2' : ''}
          >
            <DropdownMenuLabel className={`${mobileMenuGroupTitle} mx-3 px-0 py-0`}>
              {group.title}
            </DropdownMenuLabel>
            {group.links.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href, link.match, link.exact)
              return (
                <DropdownMenuItem key={link.href} asChild className="rounded-none p-0 focus:bg-transparent">
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    aria-label={link.label}
                    transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
                    prefetch={false}
                    onMouseEnter={() => warmRoute(link.href)}
                    className={desktopMoreMenuItemClass(active)}
                  >
                    <div className={mobileMenuIconBox(active)}>
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    </div>
                    <span>{link.label}</span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
  // Radix devolve o foco ao DialogTrigger; como o hambúrguer é um botão controlado por
  // estado (e não um trigger do Radix), o menu precisa desta referência para devolvê-lo.
  const mobileMenuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const isZenMode = useUIStore((state) => state.isZenMode)
  const isOnboardingWizard = pathname === '/onboarding'

  const memberLinks = useMemo(
    (): NavLinkItem[] => [
      { href: '/home', label: 'Início', icon: Home },
      { href: '/tutor', label: 'Tutor IA', desktopLabel: 'Tutor', icon: MessageSquare },
      { href: '/explore', label: 'Explorar', icon: Compass },
      { href: '/study', label: 'Rotina', icon: ListChecks },
      { href: '/blitz', label: 'Blitz', icon: Zap, match: '/blitz/' },
      { href: '/review', label: 'Revisar', icon: BookOpen },
      { href: '/history', label: 'Histórico', icon: BarChart3 },
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

  const mobileBottomNavRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = mobileBottomNavRef.current
    if (!node) return

    const mobileQuery = window.matchMedia('(max-width: 767px)')

    const syncBottomChrome = () => {
      if (!mobileQuery.matches) {
        document.documentElement.style.removeProperty('--app-bottom-chrome')
        return
      }

      const height = Math.ceil(node.getBoundingClientRect().height)
      if (height > 0) {
        document.documentElement.style.setProperty('--app-bottom-chrome', `${height}px`)
      }
    }

    syncBottomChrome()

    const resizeObserver = new ResizeObserver(syncBottomChrome)
    resizeObserver.observe(node)
    mobileQuery.addEventListener('change', syncBottomChrome)
    window.addEventListener('orientationchange', syncBottomChrome)

    return () => {
      resizeObserver.disconnect()
      mobileQuery.removeEventListener('change', syncBottomChrome)
      window.removeEventListener('orientationchange', syncBottomChrome)
      document.documentElement.style.removeProperty('--app-bottom-chrome')
    }
  }, [])



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

  if (isZenMode) return null

  if (isOnboardingWizard) {
    return (
      <div className="sticky top-0 z-50 border-b border-brand-border bg-bg-primary">
        <div className="mx-auto flex w-full max-w-[var(--page-width)] items-center justify-center px-4 py-3 sm:px-6">
          <span className="font-heading text-lg font-bold text-brand-dark">Kivora English</span>
        </div>
      </div>
    )
  }

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
                  ref={mobileMenuTriggerRef}
                  type="button"
                  className={`flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center ${landingRadius} border border-brand-dark bg-brand-accent text-brand-dark shadow-offset-sm transition-[transform,box-shadow,opacity] duration-200 hover:shadow-offset-accent active:translate-x-[2px] active:translate-y-[2px] active:shadow-none lg:hidden`}
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {mobileMenuOpen ? (
                      <m.span
                        key="close"
                        initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-flex"
                      >
                        <X className="h-5 w-5" />
                      </m.span>
                    ) : (
                      <m.span
                        key="menu"
                        initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-flex"
                      >
                        <Menu className="h-5 w-5" />
                      </m.span>
                    )}
                  </AnimatePresence>
                </button>
              </IconTooltip>
            </div>
          </div>
        </nav>
      </div>

      <MobileNavMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        username={profile.username}
        isAdmin={isAdmin}
        groups={mobileOverflowGroups}
        adminLinks={adminLinks}
        isActive={isActive}
        warmRoute={warmRoute}
        triggerRef={mobileMenuTriggerRef}
      />

      <div
        ref={mobileBottomNavRef}
        className="stitch-mobile-nav border-t border-brand-border bg-bg-primary md:hidden"
      >
        <div className="mx-auto flex w-full max-w-md items-center justify-around gap-1 px-2 pt-1.5 [touch-action:pan-y]">
          {primaryMobileLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href, link.match, link.exact)
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
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
