'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TouchEvent, WheelEvent } from 'react'
import Link from 'next/link'
import { AnimatePresence, m, useReducedMotion, type Variants } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { LogOut, Settings2 } from 'lucide-react'
import { logoutAction } from '@/app/actions'
import { useSafariIOS } from '@/hooks/useSafariIOS'
import { homeCardClass, homeIconBox, homeSmallPillClass } from '@/lib/homeStyles'
import { landingRadius } from '@/lib/landingStyles'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

type NavLinkItem = {
  href: string
  label: string
  icon: LucideIcon
  match?: string
  exact?: boolean
}

type MobileNavMenuProps = {
  open: boolean
  onClose: () => void
  username: string
  isAdmin: boolean
  groups: { title: string; links: NavLinkItem[] }[]
  adminLinks: NavLinkItem[]
  isActive: (href: string, match?: string, exact?: boolean) => boolean
  warmRoute: (href: string) => void
  scrollable: boolean
  menuRef: React.RefObject<HTMLDivElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  onTouchMove: (event: TouchEvent<HTMLDivElement>) => void
  onWheel: (event: WheelEvent<HTMLDivElement>) => void
}

const accentSquare =
  'inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] border border-brand-dark bg-brand-accent'
const connectorLine = 'section-badge-line inline-block h-px shrink-0 bg-brand-dark/60'
const mobileMenuPanel =
  'no-scrollbar pointer-events-auto absolute inset-x-3 top-[var(--app-topbar-height)] z-[2] max-h-[calc(100dvh-var(--app-topbar-height)-1rem)] overscroll-none overflow-x-hidden rounded-[13px] border border-brand-dark bg-bg-card px-3 pb-4 pt-3 opacity-100 shadow-[0_16px_48px_rgba(28,25,21,0.14)]'

const mobileMenuPanelMotionStyle = {
  left: '0.75rem',
  right: '0.75rem',
  width: 'auto',
  transformOrigin: 'top center',
} as const
const mobileMenuItem = `${landingRadius} flex items-center gap-3 px-3 py-2.5 font-heading text-sm font-bold`
const logoutButtonClass = `${landingRadius} inline-flex h-10 w-10 items-center justify-center border border-brand-dark bg-bg-card text-brand-dark shadow-[3px_3px_0_#1C1915] transition-[transform,box-shadow,background-color] duration-200 hover:bg-brand-accent hover:shadow-[4px_4px_0_#D5E06B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } },
}

const panelVariants: Variants = {
  hidden: { y: -12, scale: 0.985 },
  visible: {
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 30, mass: 0.85 },
  },
  exit: { y: -8, scale: 0.99, transition: { duration: 0.16, ease: 'easeIn' } },
}

const contentVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
}

const blockVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
}

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
  },
}

function SectionKicker({
  label,
  lineWidth = 'w-6',
  animate,
  delay = 0,
}: {
  label: string
  lineWidth?: string
  animate: boolean
  delay?: number
}) {
  const squareMotion = animate
    ? {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring' as const, stiffness: 520, damping: 24, delay },
      }
    : {}

  const lineMotion = animate
    ? {
        initial: { scaleX: 0, opacity: 0 },
        animate: { scaleX: 1, opacity: 1 },
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const, delay: delay + 0.06 },
      }
    : {}

  const pillMotion = animate
    ? {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const, delay: delay + 0.03 },
      }
    : {}

  return (
    <div className="flex w-fit items-center">
      <m.span className={accentSquare} aria-hidden="true" {...squareMotion} />
      <m.span
        className={`${connectorLine} ${lineWidth} origin-right`}
        aria-hidden="true"
        {...lineMotion}
      />
      <m.span className={homeSmallPillClass} {...pillMotion}>
        {label}
      </m.span>
    </div>
  )
}

function MenuNavLink({
  link,
  active,
  onClose,
  warmRoute,
  animate,
}: {
  link: NavLinkItem
  active: boolean
  onClose: () => void
  warmRoute: (href: string) => void
  animate: boolean
}) {
  const Icon = link.icon
  const motionProps = animate
    ? {
        variants: itemVariants,
        whileTap: { scale: 0.98 },
      }
    : {}

  const LinkWrapper = animate ? m.div : 'div'

  return (
    <LinkWrapper {...motionProps}>
      <Link
        href={link.href}
        transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
        prefetch={false}
        scroll
        aria-current={active ? 'page' : undefined}
        aria-label={link.label}
        onClick={onClose}
        onMouseEnter={() => warmRoute(link.href)}
        onTouchStart={() => warmRoute(link.href)}
        className={`${mobileMenuItem} ${
          active
            ? 'bg-brand-accent text-brand-dark shadow-[2px_2px_0_#1C1915]'
            : 'text-brand-dark hover:bg-bg-primary'
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-brand-dark p-1.5 ${
            active ? 'bg-bg-card text-brand-dark' : 'bg-brand-accent text-brand-dark'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        </div>
        <span className="min-w-0 flex-1">{link.label}</span>
        {active ? (
          <span className="inline-block h-2 w-2 shrink-0 rounded-[2px] border border-brand-dark bg-brand-dark" aria-hidden="true" />
        ) : null}
      </Link>
    </LinkWrapper>
  )
}

export default function MobileNavMenu({
  open,
  onClose,
  username,
  isAdmin,
  groups,
  adminLinks,
  isActive,
  warmRoute,
  scrollable,
  menuRef,
  contentRef,
  onTouchMove,
  onWheel,
}: MobileNavMenuProps) {
  const isIOS = useSafariIOS()
  const prefersReducedMotion = useReducedMotion()
  const shouldAnimate = !prefersReducedMotion && !isIOS

  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const LinkList = shouldAnimate ? m.div : 'div'

  useEffect(() => {
    setMounted(true)
  }, [])
  const linkListMotion = shouldAnimate
    ? { variants: listVariants, initial: 'hidden', animate: 'visible' }
    : {}

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !open) return

    const blockBackgroundScroll = (event: Event) => {
      event.preventDefault()
    }

    overlay.addEventListener('touchmove', blockBackgroundScroll, { passive: false })
    overlay.addEventListener('wheel', blockBackgroundScroll, { passive: false })

    return () => {
      overlay.removeEventListener('touchmove', blockBackgroundScroll)
      overlay.removeEventListener('wheel', blockBackgroundScroll)
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <m.div
          key="mobile-nav-menu"
          className="fixed inset-0 z-[70] max-w-[100vw] lg:hidden"
          initial={false}
          animate={false}
        >
          <m.div
            ref={overlayRef}
            className="absolute inset-0 z-[1] overflow-x-hidden bg-brand-dark/30 backdrop-blur-[2px] [touch-action:none]"
            variants={shouldAnimate ? overlayVariants : undefined}
            initial={shouldAnimate ? 'hidden' : false}
            animate={shouldAnimate ? 'visible' : false}
            exit={shouldAnimate ? 'exit' : undefined}
            onClick={onClose}
          />
          <m.div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            style={mobileMenuPanelMotionStyle}
            className={`${mobileMenuPanel} ${scrollable ? 'overflow-y-auto [touch-action:pan-y]' : 'overflow-y-hidden [touch-action:none]'}`}
            variants={shouldAnimate ? panelVariants : undefined}
            initial={shouldAnimate ? 'hidden' : false}
            animate={shouldAnimate ? 'visible' : 'visible'}
            exit={shouldAnimate ? 'exit' : undefined}
            onClick={(event) => event.stopPropagation()}
            onTouchMove={onTouchMove}
            onWheel={onWheel}
          >
            <m.div
              ref={contentRef}
              variants={shouldAnimate ? contentVariants : undefined}
              initial={shouldAnimate ? 'hidden' : false}
              animate={shouldAnimate ? 'visible' : 'visible'}
            >
              <m.div className="mb-4" variants={shouldAnimate ? blockVariants : undefined}>
                <SectionKicker label="Menu" lineWidth="w-8" animate={shouldAnimate} />
              </m.div>

              <m.div
                className={`${homeCardClass} mb-4 px-3 py-3 shadow-[4px_4px_0_#1C1915]`}
                variants={shouldAnimate ? blockVariants : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/settings"
                    prefetch={false}
                    onClick={onClose}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <m.div
                      className={homeIconBox}
                      whileHover={shouldAnimate ? { rotate: -4, scale: 1.04 } : undefined}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                    >
                      <Settings2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                    </m.div>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-sm font-bold text-brand-dark">{username}</p>
                      <span className={`mt-1.5 inline-flex ${homeSmallPillClass}`}>
                        {isAdmin ? 'Administrador' : 'Conta'}
                      </span>
                    </div>
                  </Link>

                  <form action={logoutAction} className="inline-flex shrink-0">
                    <m.button
                      type="submit"
                      className={logoutButtonClass}
                      aria-label="Sair da sessão"
                      whileHover={shouldAnimate ? { y: -1, x: -1 } : undefined}
                      whileTap={shouldAnimate ? { x: 2, y: 2, boxShadow: '0 0 0 #1C1915' } : undefined}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    >
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                    </m.button>
                  </form>
                </div>
              </m.div>

              <div className="flex flex-col gap-0.5">
                {groups.map((group, groupIndex) => (
                  <m.div
                    key={group.title}
                    className={groupIndex > 0 ? 'mt-5 border-t border-brand-border pt-5' : ''}
                    variants={shouldAnimate ? blockVariants : undefined}
                  >
                    <div className="mb-2 px-1">
                      <SectionKicker
                        label={group.title}
                        lineWidth="w-5"
                        animate={shouldAnimate}
                        delay={0.08 + groupIndex * 0.05}
                      />
                    </div>
                    <LinkList className="flex flex-col gap-0.5" {...linkListMotion}>
                      {group.links.map((link) => (
                        <MenuNavLink
                          key={link.href}
                          link={link}
                          active={isActive(link.href, link.match, link.exact)}
                          onClose={onClose}
                          warmRoute={warmRoute}
                          animate={shouldAnimate}
                        />
                      ))}
                    </LinkList>
                  </m.div>
                ))}

                {isAdmin ? (
                  <m.div
                    className="mt-5 border-t border-brand-border pt-5"
                    variants={shouldAnimate ? blockVariants : undefined}
                  >
                    <div className="mb-2 px-1">
                      <SectionKicker
                        label="Admin"
                        lineWidth="w-5"
                        animate={shouldAnimate}
                        delay={0.08 + groups.length * 0.05}
                      />
                    </div>
                    <LinkList className="flex flex-col gap-0.5" {...linkListMotion}>
                      {adminLinks.map((link) => (
                        <MenuNavLink
                          key={link.href}
                          link={link}
                          active={isActive(link.href, link.match, link.exact)}
                          onClose={onClose}
                          warmRoute={warmRoute}
                          animate={shouldAnimate}
                        />
                      ))}
                    </LinkList>
                  </m.div>
                ) : null}
              </div>
            </m.div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}