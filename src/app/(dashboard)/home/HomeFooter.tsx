'use client'

import { m } from 'framer-motion'
import Link from 'next/link'
import BrandMark from '@/components/ui/BrandMark'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  ArrowRight,
  BookOpen,
  Compass,
  Heart,
  MessageSquare,
  RefreshCw,
  Swords,
  Trophy,
  User,
} from 'lucide-react'

const footerSections = [
  {
    title: 'Estudar',
    Icon: BookOpen,
    links: [
      { href: '/home', label: 'Página Inicial' },
      { href: '/explore', label: 'Explorar Packs' },
      { href: '/history', label: 'Histórico' },
    ],
  },
  {
    title: 'Praticar',
    Icon: Swords,
    links: [
      { href: '/arena', label: 'Arena de Prática' },
      { href: '/review', label: 'Sessão de Revisão' },
      { href: '/tutor', label: 'Tutor de IA' },
    ],
  },
  {
    title: 'Progresso',
    Icon: Trophy,
    links: [
      { href: '/profile', label: 'Meu Perfil' },
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

export default function HomeFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <m.footer
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="content-visibility-section render-contained relative mt-10 max-w-full overflow-hidden rounded-[24px] border border-border bg-card/75 shadow-[var(--shadow-lg)] backdrop-blur-md dark:bg-surface-container-lowest/90 sm:mt-12 sm:rounded-[32px]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--color-surface-container-low)]/55 via-transparent to-[var(--color-primary-light)]/35 dark:to-primary/8" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent dark:via-primary/25 sm:inset-x-8" />

      <div className="relative z-10 min-w-0 px-3 py-4 sm:px-7 sm:py-8">
        <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[1.1fr_1.55fr]">
          <section className="min-w-0 overflow-hidden rounded-[20px] border border-border bg-[var(--color-surface-container-low)]/70 p-4 shadow-[var(--shadow-sm)] backdrop-blur-sm dark:bg-[var(--color-surface-container)]/55 sm:rounded-[28px] sm:p-6">
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
              <BrandMark compact={false} tone="default" />

              <p className="max-w-sm text-sm leading-relaxed text-text-muted [overflow-wrap:anywhere]">
                Rotina de inglês, revisão e prática competitiva em um só lugar.
              </p>

              <div className="grid min-w-0 grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                {highlightLinks.map((item) => {
                  const Icon = item.Icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      transitionTypes={navForwardTransitionTypes}
                      prefetch={false}
                      className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-[16px] border border-border bg-surface-container-lowest/80 px-2 text-[11px] font-bold text-primary shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-primary-container)] hover:text-primary-dark sm:h-9 sm:justify-start sm:gap-2 sm:rounded-full sm:px-3 sm:text-xs"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>

          <nav className="grid min-w-0 gap-2 sm:grid-cols-3 sm:gap-3" aria-label="Links do rodapé">
            {footerSections.map((section) => {
              const SectionIcon = section.Icon

              return (
                <section
                  key={section.title}
                  className="min-w-0 overflow-hidden rounded-[20px] border border-border bg-[var(--color-surface-container-low)]/70 p-3.5 shadow-[var(--shadow-sm)] backdrop-blur-sm dark:bg-[var(--color-surface-container)]/55 sm:rounded-[28px] sm:p-5"
                >
                  <div className="mb-2.5 flex min-w-0 items-center gap-2 sm:mb-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary ring-1 ring-primary/10 dark:bg-primary/12 dark:ring-primary/15">
                      <SectionIcon className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                    </span>
                    <h4 className="min-w-0 truncate text-[11px] font-black uppercase tracking-[0.1em] text-text-subtle sm:text-xs sm:tracking-[0.12em]">
                      {section.title}
                    </h4>
                  </div>

                  <ul className="grid gap-1.5 sm:space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          transitionTypes={navForwardTransitionTypes}
                          prefetch={false}
                          className="group inline-flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[14px] px-2.5 py-2 text-[13px] font-bold leading-tight text-text-muted transition-colors hover:bg-[var(--color-surface-container-high)]/70 hover:text-primary sm:rounded-[18px] sm:text-sm"
                        >
                          <span className="min-w-0 flex-1 truncate">{link.label}</span>
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

        <div className="mt-4 flex min-w-0 flex-col items-stretch justify-between gap-3 border-t border-border pt-4 sm:mt-5 sm:flex-row sm:items-center sm:pt-5">
          <p className="text-center text-[11px] font-semibold leading-relaxed text-text-subtle sm:text-left sm:text-xs">
            &copy; {currentYear} Kivora English. Todos os direitos reservados.
          </p>

          <Link
            href="/profile"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-[16px] border border-border bg-surface-container-lowest/80 px-3 py-2 text-xs font-bold text-text-subtle shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-primary sm:min-h-0 sm:rounded-full sm:py-1.5"
          >
            <User className="h-3.5 w-3.5" strokeWidth={2.3} />
            <span className="min-w-0 truncate">Área do estudante</span>
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
          </Link>
        </div>
      </div>
    </m.footer>
  )
}
