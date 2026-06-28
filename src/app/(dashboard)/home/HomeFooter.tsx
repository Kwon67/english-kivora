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
      { href: '/ranking', label: 'Ranking Semanal' },
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
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
}

export default function HomeFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <m.footer
        {...footerMotion}
        className="content-visibility-section render-contained relative mt-6 overflow-hidden rounded-2xl border border-border bg-card/80 shadow-[var(--shadow-md)] backdrop-blur-sm dark:bg-surface-container-lowest/90 sm:hidden"
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-container-lowest/80 text-primary transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-primary-dark"
                >
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="relative z-10 flex min-w-0 items-center justify-between gap-2 border-t border-border/80 px-3 py-2 text-[10px] font-semibold text-text-subtle">
          <span className="min-w-0 truncate">&copy; {currentYear} Kivora</span>
          <Link
            href="/settings"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-1 text-text-subtle transition-colors hover:text-primary"
          >
            <Settings2 className="h-3 w-3" strokeWidth={2.3} />
            Conta
          </Link>
        </div>
      </m.footer>

      <m.footer
        {...footerMotion}
        className="content-visibility-section render-contained relative mt-10 hidden max-w-full overflow-hidden rounded-[32px] border border-border bg-card/75 shadow-[var(--shadow-lg)] backdrop-blur-md dark:bg-surface-container-lowest/90 sm:mt-12 sm:block sm:rounded-[32px]"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-surface-container-low)]/55 via-transparent to-[var(--color-primary-light)]/35 dark:to-primary/8" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent dark:via-primary/25" />

        <div className="relative z-10 min-w-0 px-7 py-8">
          <div className="grid min-w-0 gap-4 lg:grid-cols-[1.1fr_1.55fr]">
            <section className="min-w-0 overflow-hidden rounded-[28px] border border-border bg-[var(--color-surface-container-low)]/70 p-6 shadow-[var(--shadow-sm)] backdrop-blur-sm dark:bg-[var(--color-surface-container)]/55">
              <div className="flex min-w-0 flex-col gap-5">
                <BrandMark compact={false} tone="default" />

                <p className="max-w-sm text-sm leading-relaxed text-text-muted [overflow-wrap:anywhere]">
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
                        className="inline-flex h-9 min-w-0 items-center justify-start gap-2 rounded-full border border-border bg-surface-container-lowest/80 px-3 text-xs font-bold text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-primary-container)] hover:text-primary-dark"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>

            <nav className="grid min-w-0 gap-3 sm:grid-cols-3" aria-label="Links do rodapé">
              {footerSections.map((section) => {
                const SectionIcon = section.Icon

                return (
                  <section
                    key={section.title}
                  className="min-w-0 rounded-[28px] border border-border bg-[var(--color-surface-container-low)]/70 p-5 shadow-[var(--shadow-sm)] backdrop-blur-sm dark:bg-[var(--color-surface-container)]/55"
                  >
                    <div className="mb-4 flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary ring-1 ring-primary/10 dark:bg-primary/12 dark:ring-primary/15">
                        <SectionIcon className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                      </span>
                      <h4 className="min-w-0 text-xs font-black uppercase tracking-[0.12em] text-text-subtle">
                        {section.title}
                      </h4>
                    </div>

                    <ul className="space-y-2">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            transitionTypes={navForwardTransitionTypes}
                            prefetch={false}
                            className="group inline-flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[18px] px-2.5 py-2 text-sm font-bold leading-tight text-text-muted transition-colors hover:bg-[var(--color-surface-container-high)]/70 hover:text-primary"
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

          <div className="mt-5 flex min-w-0 flex-row items-center justify-between gap-3 border-t border-border pt-5">
            <p className="text-left text-xs font-semibold leading-relaxed text-text-subtle">
              &copy; {currentYear} Kivora English. Todos os direitos reservados.
            </p>

            <Link
              href="/library"
              transitionTypes={navForwardTransitionTypes}
              prefetch={false}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-border bg-surface-container-lowest/80 px-3 py-1.5 text-xs font-bold text-text-subtle shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-primary"
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
