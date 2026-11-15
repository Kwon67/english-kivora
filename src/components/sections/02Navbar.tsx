'use client'

import { useState } from 'react'
import BrandMark from '@/components/ui/BrandMark'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { LandingMobileProgress } from '@/components/landing/LandingScrollProgress'
import { useLandingNavigation } from '@/components/landing/LandingNavigationProvider'
import Button from '@/components/ui/Button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/shadcn/sheet'
import { LANDING_CHAPTERS } from '@/lib/landingSections'
import { landingRadius, landingRadiusLg } from '@/lib/landingStyles'
import { useHydrated } from '@/hooks/useHydrated'

const links = LANDING_CHAPTERS.filter(({ id }) =>
  ['seu-caminho', 'como-funciona', 'precos', 'faq'].includes(id),
).map(({ id, label }) => ({ href: `#${id}`, label, sectionId: id }))

export default function Navbar() {
  const { activeSection } = useLandingNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const hydrated = useHydrated()

  return (
    <header className="workspace-public-navigation">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="font-heading text-lg font-bold text-brand-dark sm:text-xl">
          <BrandMark showSubtitle={false} />
        </Link>

        <div className="workspace-public-links">
          {links.map((link) => {
            const isActive = activeSection === link.sectionId

            return (
              <Link
                key={link.href}
                href={link.href}
                className="workspace-navigation-link"
                aria-current={isActive ? 'location' : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button href="/login" variant="outline" landing className="inline-flex">
            Entrar
          </Button>
          <Button href="/register" variant="accent" landing className="hidden md:inline-flex">
            Começar grátis
          </Button>
          {!hydrated ? (
            <details className="landing-menu-fallback lg:hidden">
              <summary aria-label="Abrir menu" className={`flex h-11 w-11 touch-manipulation cursor-pointer list-none items-center justify-center ${landingRadius} border border-brand-border bg-bg-card text-brand-dark`}>
                <Menu className="h-5 w-5" aria-hidden="true" />
              </summary>
              <div className="landing-menu-fallback-panel">
                <p className="mb-2 px-3 font-heading font-semibold">Conheça a Kivora</p>
                {links.map(link => <a key={link.href} href={link.href} className="workspace-menu-destination">{link.label}</a>)}
                <a href="/login" className="workspace-menu-destination">Entrar</a>
                <a href="/register" className="workspace-button premium-primary mt-2">Começar grátis</a>
              </div>
            </details>
          ) : <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className={`flex h-11 w-11 touch-manipulation items-center justify-center ${landingRadius} border border-brand-border bg-bg-card text-brand-dark hover:bg-primary-light active:scale-95 lg:hidden`}
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent aria-describedby={undefined} className="workspace-navigation-sheet">
              <SheetHeader>
                <SheetTitle>Conheça a Kivora</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`${landingRadiusLg} px-3.5 py-3 font-heading text-sm font-medium text-brand-dark transition-colors hover:bg-bg-primary`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-3 grid gap-2 border-t border-brand-dark px-4 pt-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={`${landingRadiusLg} border border-brand-dark px-3.5 py-3 text-center font-heading text-sm font-medium text-brand-dark`}
                >
                  Entrar
                </Link>
                <Button
                  landing
                  href="/register"
                  variant="accent"
                  className="w-full"
                  onClick={() => setMenuOpen(false)}
                >
                  Começar grátis
                </Button>
              </div>
            </SheetContent>
          </Sheet>}
        </div>
      </nav>

      <LandingMobileProgress />
    </header>
  )
}
