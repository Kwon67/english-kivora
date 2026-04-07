'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions'
import type { Profile } from '@/types/database.types'
import { Home, BarChart3, LayoutDashboard, Package, UserCheck, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavbarProps {
  profile: Profile
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
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
      <nav className="sticky top-0 z-50 navbar-glass">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {/* Logo */}
          <Link
            href={isAdmin ? '/admin/dashboard' : '/home'}
            className="flex items-center gap-2 font-bold tracking-tight text-lg text-[var(--color-primary)] cursor-pointer shrink-0"
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="28" height="28" rx="8" fill="currentColor" opacity="0.1"/>
              <path d="M8 10h12M8 14h8M8 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="hidden sm:inline">Kivora English</span>
            <span className="sm:hidden">Kivora</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User & Mobile Menu Button */}
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl glass text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all duration-300 z-50"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* User Avatar - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-sm font-bold shrink-0">
                {(profile.username || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="hidden lg:inline text-sm font-medium text-[var(--color-text-muted)] max-w-[100px] truncate">
                {profile.username}
              </span>
            </div>

            {/* Logout Button */}
            <form action={logoutAction} className="hidden sm:block">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl glass px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] transition-all duration-300 hover:text-red-600 hover:border-red-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop - prevents interaction with background */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu Panel */}
          <div className="fixed top-16 left-0 right-0 bottom-0 bg-[var(--color-bg)] z-40 md:hidden overflow-y-auto border-t border-[var(--color-border)]">
            <div className="px-4 py-6 space-y-2">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-all duration-200 ${
                      isActive
                        ? 'glass text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:glass hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
              <div className="border-t border-[var(--color-border)] pt-2 mt-2">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-base font-bold shrink-0">
                    {(profile.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-[var(--color-text)] truncate">{profile.username}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{isAdmin ? 'Administrador' : 'Membro'}</p>
                  </div>
                </div>
                <form action={logoutAction} className="px-4 py-2">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    <LogOut className="w-5 h-5" />
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
