'use client'

import { m } from 'framer-motion'
import Link from 'next/link'
import BrandMark from '@/components/ui/BrandMark'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  ArrowRight,
  BookOpen,
  Compass,
  MessageSquare,
  RefreshCw,
  Zap,
  Trophy,
  Settings2,
} from 'lucide-react'
import {
  homeCardClass,
  homeFooterCardClass,
  homeIconBox,
  homeNestedCardClass,
  homeSecondaryButton,
} from '@/lib/homeStyles'

const footerSections = [
  {
    title: 'Estudar',
    Icon: BookOpen,
    links: [
      { href: '/home', label: 'Página Inicial' },
      { href: '/study', label: 'Minha Rotina' },
      { href: '/explore', label: 'Explorar packs' },
      { href: '/history', label: 'Histórico' },
    ],
  },
  {
    title: 'Praticar',
    Icon: Zap,
    links: [
      { href: '/blitz', label: 'Blitz' },
      { href: '/review', label: 'Sessão de Revisão' },
      { href: '/tutor', label: 'Tutor de IA' },
    ],
  },
  {
    title: 'Progresso',
    Icon: Trophy,
    links: [
      { href: '/library', label: 'Minha Biblioteca' },
      { href: '/settings', label: 'Configurações' },
      { href: '/problem-words', label: 'Dificuldades' },
    ],
  },
]

const highlightLinks = [
  { href: '/explore', label: 'Explorar', Icon: Compass },
  { href: '/review', label: 'Revisar', Icon: RefreshCw },
  { href: '/tutor', label: 'Tutor', Icon: MessageSquare },
]

const footerMotion = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function HomeFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <m.footer
        {...footerMotion}
        className={`content-visibility-section render-contained relative mt-6 overflow-hidden sm:hidden ${homeCardClass}`}
      >
        <div className="relative z-10 flex min-w-0 items-center justify-between gap-3 px-3 py-2.5">
          <BrandMark compact tone="default" />

          <div className="flex shrink-0 items-center gap-1">
            {highlightLinks.map((item) => {
              const Icon = item.Icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  transitionTypes={navForwardTransitionTypes}
                  prefetch={false}
                  aria-label={item.label}
                  className={`h-9 w-9 transition-colors hover:bg-bg-primary ${homeIconBox}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="relative z-10 flex min-w-0 items-center justify-between gap-2 border-t border-brand-dark px-3 py-2 text-[10px] font-semibold text-brand-secondary">
          <span className="min-w-0 truncate">&copy; {currentYear} Kivora</span>
          <Link
            href="/settings"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-1 text-brand-secondary transition-colors hover:text-brand-dark"
          >
            <Settings2 className="h-3 w-3" strokeWidth={2.3} />
            Conta
          </Link>
        </div>
      </m.footer>

      <m.footer
        {...footerMotion}
        className={`content-visibility-section render-contained relative mt-10 hidden max-w-full overflow-hidden px-5 pb-24 pt-6 sm:mt-12 sm:block sm:px-6 sm:pt-7 md:px-8 md:pb-28 md:pt-8 ${homeFooterCardClass}`}
      >
        {/* Decorative lawn strip — lives in the reserved bottom gutter so it never sits behind text.
            Deliberately a plain background-image: no opacity/filter/mask here, since any of those
            promotes this div to its own compositing layer whose rectangular bounds can composite
            differently from the card and read as a faint rectangle. The 0.55 alpha, the softening
            blur and the vertical fade are baked into the SVG instead, so the pixels between the
            blades are the footer's own background, untouched.

            The filename carries a content hash because next.config serves /images/:path* with
            `max-age=31536000, immutable` — an in-place edit to a stable filename would never be
            re-fetched by a browser that already cached it. Re-hash the name whenever the art
            changes. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-24 md:h-32"
          style={{
            backgroundImage: "url('/images/home/footer-green-lawn.a7b1e3a8.svg')",
            backgroundSize: 'auto 100%',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'left bottom',
          }}
        />
        <div className="relative z-10 min-w-0">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[1.1fr_1.55fr] lg:gap-10">
            <section className="min-w-0 overflow-hidden p-0">
              <div className="flex min-w-0 flex-col gap-5">
                <BrandMark compact={false} tone="default" />

                <p className="max-w-sm font-body text-sm leading-relaxed text-brand-secondary [overflow-wrap:anywhere]">
                  Rotina de inglês, revisão e desafios rápidos em um só lugar.
                </p>

                <div className="flex min-w-0 flex-wrap gap-2">
                  {highlightLinks.map((item) => {
                    const Icon = item.Icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        transitionTypes={navForwardTransitionTypes}
                        prefetch={false}
                        className={homeSecondaryButton}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>

            <nav
              className="grid min-w-0 content-start gap-3 sm:grid-cols-3"
              aria-label="Links do rodapé"
            >
              {footerSections.map((section) => {
                const SectionIcon = section.Icon

                return (
                  <section
                    key={section.title}
                    className={`min-w-0 p-4 lg:p-5 ${homeNestedCardClass}`}
                  >
                    <div className="mb-3 flex min-w-0 items-center gap-2 lg:mb-4">
                      <SectionIcon className="h-4 w-4 shrink-0 text-brand-dark" strokeWidth={2.4} />
                      <h4 className="min-w-0 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
                        {section.title}
                      </h4>
                    </div>

                    <ul className="space-y-0.5">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            transitionTypes={navForwardTransitionTypes}
                            prefetch={false}
                            className="group inline-flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg px-2.5 py-2 font-body text-sm font-normal leading-tight text-brand-secondary transition-colors hover:text-brand-dark"
                          >
                            <span className="flex-1">{link.label}</span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </nav>
          </div>

          <div className="mt-6 flex min-w-0 flex-col items-start gap-4 border-t border-brand-dark pt-5 md:flex-row md:items-center md:justify-between md:gap-6">
            <p className="text-left font-body text-xs font-semibold leading-relaxed text-brand-dark">
              &copy; {currentYear} Kivora English. Todos os direitos reservados.
            </p>

            <Link
              href="/library"
              transitionTypes={navForwardTransitionTypes}
              prefetch={false}
              className={homeSecondaryButton}
            >
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2.3} />
              <span className="min-w-0 truncate">Biblioteca do estudante</span>
            </Link>
          </div>
        </div>
      </m.footer>
    </>
  )
}
