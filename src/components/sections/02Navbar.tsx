'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import Button from '@/components/ui/Button'

const links = [
  { href: '#como-funciona', label: 'Como Funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#precos', label: 'Preços' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousOverflow
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-bg-primary pt-[env(safe-area-inset-top,0px)] supports-[backdrop-filter]:bg-bg-primary/95 supports-[backdrop-filter]:backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="font-heading text-lg font-bold text-brand-dark sm:text-xl">
          Kivora English
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-secondary hover:text-brand-dark"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden font-heading text-xs font-bold uppercase text-brand-dark sm:inline"
          >
            Entrar
          </Link>
          <Button href="/register" variant="outline" className="hidden px-3 py-2 text-xs sm:inline-flex sm:px-5 sm:py-2.5">
            Começar grátis →
          </Button>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[2px_2px_0_var(--color-brand-dark)] active:scale-95 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" aria-hidden={!menuOpen}>
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-brand-dark/20"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="landing-mobile-menu"
            className="absolute inset-x-3 top-[calc(4.25rem+env(safe-area-inset-top,0px))] max-h-[calc(100dvh-5.5rem-env(safe-area-inset-top,0px))] overflow-y-auto overscroll-contain rounded-2xl border-2 border-brand-dark bg-bg-card px-3 py-3 shadow-[6px_6px_0_var(--color-brand-dark)]"
          >
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3.5 py-3 font-heading text-sm font-bold text-brand-dark transition-colors hover:bg-bg-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 grid gap-2 border-t border-brand-border pt-3">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border-2 border-brand-dark px-3.5 py-3 text-center font-heading text-sm font-bold text-brand-dark"
              >
                Entrar
              </Link>
              <Button href="/register" variant="accent" className="w-full" onClick={() => setMenuOpen(false)}>
                Começar grátis →
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}