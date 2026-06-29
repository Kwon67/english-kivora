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
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

export default function HomeFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <m.footer
        {...footerMotion}
        className="content-visibility-section render-contained relative mt-6 overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[5px_5px_0_var(--color-brand-dark)] sm:hidden"
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-brand-dark bg-brand-accent text-brand-dark transition-colors hover:bg-bg-primary"
                >
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="relative z-10 flex min-w-0 items-center justify-between gap-2 border-t-2 border-brand-dark px-3 py-2 font-body text-[10px] font-semibold text-brand-secondary">
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
        className="content-visibility-section render-contained relative mt-10 hidden max-w-full overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card p-8 shadow-[8px_8px_0_var(--color-brand-dark)] sm:mt-12 sm:block"
      >
        <div className="relative z-10 min-w-0">
          <div className="grid min-w-0 gap-4 lg:grid-cols-[1.1fr_1.55fr]">
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
                        className="inline-flex min-w-0 items-center justify-start gap-2 rounded-lg border-2 border-brand-dark px-4 py-2 font-body text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
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
                    className="min-w-0 rounded-xl border-2 border-brand-dark bg-bg-card p-5 shadow-[4px_4px_0_var(--color-brand-dark)]"
                  >
                    <div className="mb-4 flex min-w-0 items-center gap-2">
                      <SectionIcon className="h-4 w-4 shrink-0 text-brand-dark" strokeWidth={2.4} />
                      <h4 className="min-w-0 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
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

          <div className="mt-5 flex min-w-0 flex-row items-center justify-between gap-3 border-t-2 border-brand-dark pt-5">
            <p className="text-left font-body text-xs font-semibold leading-relaxed text-brand-secondary">
              &copy; {currentYear} Kivora English. Todos os direitos reservados.
            </p>

            <Link
              href="/library"
              transitionTypes={navForwardTransitionTypes}
              prefetch={false}
              className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border-2 border-brand-dark px-4 py-2 font-body text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
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
