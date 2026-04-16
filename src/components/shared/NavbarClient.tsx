'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { createPortal } from 'react-dom'
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
  Swords,
} from 'lucide-react'
import { logoutAction } from '@/app/actions'
import BrandMark from '@/components/shared/BrandMark'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import type { Profile } from '@/types/database.types'

interface NavbarClientProps {
  profile: Profile
}

export default function NavbarClient({ profile }: NavbarClientProps) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuTopOffset, setMenuTopOffset] = useState(88)
  const prefersReducedMotion = useReducedMotion()
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const headerElement = headerRef.current
    if (!headerElement) return

    const updateMenuTopOffset = () => {
      setMenuTopOffset(Math.round(headerElement.getBoundingClientRect().bottom))
    }

    updateMenuTopOffset()

    const resizeObserver = new ResizeObserver(updateMenuTopOffset)
    resizeObserver.observe(headerElement)
    window.addEventListener('resize', updateMenuTopOffset)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateMenuTopOffset)
    }
  }, [])

  const memberLinks = [
    { href: '/home', label: 'Início', icon: Home },
    { href: '/history', label: 'Histórico', icon: BarChart3 },
  ]

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Painel', icon: LayoutDashboard },
    { href: '/admin/packs', label: 'Packs', icon: Package },
    { href: '/admin/assign', label: 'Atribuir', icon: UserCheck },
    { href: '/admin/arena', label: 'Arena', icon: Swords },
  ]

  const links = isAdmin ? [...adminLinks, ...memberLinks] : memberLinks
  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.26, ease: [0.16, 1, 0.3, 1] as const }
  const backdropTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.12, ease: [0.16, 1, 0.3, 1] as const }
  const canRenderPortal = typeof document !== 'undefined'
  const mobileMenu =
    canRenderPortal
      ? createPortal(
          <AnimatePresence initial={false}>
            {mobileMenuOpen && (
              <m.div
                key="mobile-menu-layer"
                className="fixed inset-x-0 bottom-0 z-[60] lg:hidden"
                style={{ top: menuTopOffset }}
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={backdropTransition}
              >
                <button
                  type="button"
                  className="absolute inset-0 bg-[rgba(17,32,51,0.34)] backdrop-blur-md"
                  aria-label="Fechar menu"
                  onClick={() => setMobileMenuOpen(false)}
                />

                <div className="absolute inset-x-4 top-4 max-h-[calc(100svh-7rem)] overflow-y-auto pb-4">
                  <m.div
                    key="mobile-menu-panel"
                    className="floating-glass overflow-hidden rounded-[30px] border border-white/90 p-5"
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.985 }}
                    transition={panelTransition}
                    style={{ transformOrigin: 'top center' }}
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <BrandMark subtitle={isAdmin ? 'Performance Control' : 'Daily Fluency Lab'} />
                      <div className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white -translate-x-1">
                        {isAdmin ? 'Admin' : 'Aluno'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {links.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname.startsWith(link.href)
                        const transitionTypes =
                          link.href === '/home' || link.href === '/admin/dashboard'
                            ? navBackTransitionTypes
                            : navForwardTransitionTypes

                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            transitionTypes={transitionTypes}
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
                  </m.div>
                </div>
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null

  return (
    <>
      <div ref={headerRef} className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
        <Link
          href={isAdmin ? '/admin/dashboard' : '/home'}
          transitionTypes={navBackTransitionTypes}
          className="flex min-w-0 items-center rounded-full transition-transform duration-200 hover:scale-[1.01]"
        >
          <BrandMark className="min-w-0" subtitle={isAdmin ? 'Performance Control' : 'Daily Fluency Lab'} />
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname.startsWith(link.href)
            const transitionTypes =
              link.href === '/home' || link.href === '/admin/dashboard'
                ? navBackTransitionTypes
                : navForwardTransitionTypes

            return (
              <Link
                key={link.href}
                href={link.href}
                transitionTypes={transitionTypes}
                className={`inline-flex items-center gap-2 px-2 py-1 text-[13px] font-bold uppercase tracking-widest transition-opacity ${
                  isActive
                    ? 'text-[var(--color-primary)] opacity-100'
                    : 'text-[var(--color-text)] opacity-70 hover:opacity-100'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <div className="hidden items-center gap-2 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[13px] font-bold uppercase tracking-widest text-white shadow-[0_16px_30px_-24px_rgba(43,122,11,0.42)] xl:inline-flex xl:-translate-x-1">
              <Shield className="h-3.5 w-3.5" strokeWidth={2.3} />
              Admin
            </div>
          )}

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--color-primary-container)] bg-[var(--color-surface-container-highest)] text-sm font-bold text-[var(--color-text)]">
              {(profile.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-bold text-[var(--color-text)]">{profile.username}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">
                {isAdmin ? 'Administrador' : 'Aluno'}
              </p>
            </div>
          </div>

          <form action={logoutAction} className="hidden sm:block">
            <button type="submit" className="text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-error)]">
              <LogOut className="h-5 w-5" strokeWidth={2} />
              <span className="sr-only">Sair</span>
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex items-center justify-center text-[var(--color-text)] transition-colors lg:hidden"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <Menu className="h-6 w-6" strokeWidth={2} />}
          </button>
        </div>
      </div>
      {mobileMenu}
    </>
  )
}
