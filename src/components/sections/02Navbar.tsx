'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { landingRadius } from '@/lib/landingStyles'

const links = [
  { href: '#como-funciona', label: 'Como Funciona', sectionId: 'como-funciona' },
  { href: '#recursos', label: 'Recursos', sectionId: 'recursos' },
  { href: '#precos', label: 'Preços', sectionId: 'precos' },
  { href: '#faq', label: 'FAQ', sectionId: 'faq' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuTop, setMenuTop] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const headerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  useEffect(() => {
    const sectionIds = links.map((link) => link.sectionId)
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id)
        }
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: [0, 0.15, 0.35, 0.55],
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const updateMenuTop = () => {
      if (!headerRef.current) return
      setMenuTop(headerRef.current.getBoundingClientRect().bottom)
    }

    updateMenuTop()
    window.addEventListener('resize', updateMenuTop)
    window.addEventListener('scroll', updateMenuTop, { passive: true })

    const scrollY = window.scrollY
    const { body, documentElement } = document
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }
    const previousHtmlOverflow = documentElement.style.overflow

    documentElement.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    return () => {
      window.removeEventListener('resize', updateMenuTop)
      window.removeEventListener('scroll', updateMenuTop)
      documentElement.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyStyles.overflow
      body.style.position = previousBodyStyles.position
      body.style.top = previousBodyStyles.top
      body.style.width = previousBodyStyles.width
      window.scrollTo(0, scrollY)
    }
  }, [menuOpen])

  function syncMenuTop() {
    if (!headerRef.current) return
    setMenuTop(headerRef.current.getBoundingClientRect().bottom)
  }

  function toggleMenu() {
    if (menuOpen) {
      setMenuOpen(false)
      return
    }

    syncMenuTop()
    setMenuOpen(true)
  }

  const mobileMenu =
    menuOpen && mounted ? (
      <div className="fixed inset-0 z-[100] md:hidden" role="presentation">
        <button
          type="button"
          aria-label="Fechar menu"
          className="absolute inset-0 bg-brand-dark/25"
          onClick={() => setMenuOpen(false)}
        />
        <div
          id="landing-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          style={{
            top: menuTop + 12,
            maxHeight: `calc(100dvh - ${menuTop + 12}px - 1rem)`,
          }}
          className={`absolute inset-x-3 overflow-y-auto overscroll-contain ${landingRadius} border border-brand-dark bg-bg-card px-3 py-3 shadow-[0_8px_24px_rgba(28,25,21,0.08)]`}
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`${landingRadius} px-3.5 py-3 font-heading text-base font-bold text-brand-dark transition-colors hover:bg-bg-primary`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid gap-2 border-t border-brand-dark pt-3">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className={`${landingRadius} border border-brand-dark px-3.5 py-3 text-center font-heading text-base font-bold text-brand-dark`}
            >
              Entrar
            </Link>
            <Button landing href="/register" variant="accent" className="w-full" onClick={() => setMenuOpen(false)}>
              Começar grátis →
            </Button>
          </div>
        </div>
      </div>
    ) : null

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 border-b bg-bg-primary pt-[env(safe-area-inset-top,0px)] transition-shadow duration-300 supports-[backdrop-filter]:bg-bg-primary/95 supports-[backdrop-filter]:backdrop-blur ${
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
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={toggleMenu}
            className={`flex h-11 w-11 touch-manipulation items-center justify-center ${landingRadius} border border-brand-dark bg-brand-accent text-brand-dark active:scale-95 md:hidden`}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mounted && mobileMenu ? createPortal(mobileMenu, document.body) : null}
    </header>
  )
}
