'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { LandingMobileProgress } from '@/components/landing/LandingScrollProgress'
import { useLandingNavigation } from '@/components/landing/LandingNavigationProvider'
import Button from '@/components/ui/Button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/shadcn/sheet'
import { LANDING_CHAPTERS } from '@/lib/landingSections'
import { landingRadius, landingRadiusLg } from '@/lib/landingStyles'

const links = LANDING_CHAPTERS.filter(({ id }) =>
  ['como-funciona', 'precos', 'depoimentos', 'faq'].includes(id),
).map(({ id, label }) => ({ href: `#${id}`, label, sectionId: id }))

export default function Navbar() {
  const { activeSection } = useLandingNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-bg-primary pt-[env(safe-area-inset-top,0px)] transition-shadow duration-300 supports-[backdrop-filter]:bg-bg-primary/92 supports-[backdrop-filter]:backdrop-blur-xl ${
        isScrolled
          ? 'border-brand-dark shadow-[0_4px_20px_rgba(28,25,21,0.08)]'
          : 'border-brand-dark shadow-none'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="font-heading text-lg font-bold text-brand-dark sm:text-xl">
          Kivora English
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => {
            const isActive = activeSection === link.sectionId

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-brand-dark' : 'text-brand-secondary hover:text-brand-dark'
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 w-full origin-left rounded-full bg-brand-dark transition-transform duration-200 ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button href="/login" variant="outline" landing className="hidden sm:inline-flex">
            Entrar
          </Button>
          <Button href="/register" variant="accent" landing className="hidden sm:inline-flex">
            Começar grátis →
          </Button>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className={`flex h-11 w-11 touch-manipulation items-center justify-center ${landingRadius} border border-brand-dark bg-brand-accent text-brand-dark active:scale-95 md:hidden`}
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent className="border-brand-dark bg-bg-card">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`${landingRadiusLg} px-3.5 py-3 font-heading text-base font-bold text-brand-dark transition-colors hover:bg-bg-primary`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-3 grid gap-2 border-t border-brand-dark px-4 pt-3">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={`${landingRadiusLg} border border-brand-dark px-3.5 py-3 text-center font-heading text-base font-bold text-brand-dark`}
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
                  Começar grátis →
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <LandingMobileProgress />
    </header>
  )
}
