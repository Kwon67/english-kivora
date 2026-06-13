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
      className="content-visibility-section render-contained relative mt-10 max-w-full overflow-hidden rounded-[24px] border border-zinc-200/55 bg-white/45 shadow-[0_18px_48px_rgba(24,32,29,0.10)] backdrop-blur-md sm:mt-12 sm:rounded-[32px] sm:shadow-[0_24px_70px_rgba(24,32,29,0.12)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-emerald-50/35 dark:to-[#b8ff5c]/8" />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-emerald-700/25 to-transparent dark:via-[#b8ff5c]/25 sm:inset-x-8" />

      <div className="relative z-10 min-w-0 px-3 py-4 sm:px-7 sm:py-8">
        <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[1.1fr_1.55fr]">
          <section className="min-w-0 overflow-hidden rounded-[20px] border border-zinc-200/55 bg-white/35 p-4 shadow-[0_10px_28px_rgba(24,32,29,0.06)] backdrop-blur-sm sm:rounded-[28px] sm:p-6">
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
              <BrandMark compact={false} tone="default" />

              <p className="max-w-sm text-sm leading-relaxed text-zinc-600 [overflow-wrap:anywhere]">
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
                      className="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-[16px] border border-zinc-200/70 bg-white/45 px-2 text-[11px] font-bold text-emerald-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-emerald-700 dark:text-[#b8ff5c] dark:hover:text-[#cbff83] sm:h-9 sm:justify-start sm:gap-2 sm:rounded-full sm:px-3 sm:text-xs"
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
                  className="min-w-0 overflow-hidden rounded-[20px] border border-zinc-200/55 bg-white/35 p-3.5 shadow-[0_10px_28px_rgba(24,32,29,0.05)] backdrop-blur-sm sm:rounded-[28px] sm:p-5 sm:shadow-[0_12px_34px_rgba(24,32,29,0.06)]"
                >
                  <div className="mb-2.5 flex min-w-0 items-center gap-2 sm:mb-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-900/10 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c] dark:ring-[#b8ff5c]/15">
                      <SectionIcon className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                    </span>
                    <h4 className="min-w-0 truncate text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 sm:text-xs sm:tracking-[0.12em]">
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
                          className="group inline-flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[14px] px-2.5 py-2 text-[13px] font-bold leading-tight text-zinc-600 transition-colors hover:bg-white/55 hover:text-emerald-800 dark:hover:text-[#b8ff5c] sm:rounded-[18px] sm:text-sm"
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

        <div className="mt-4 flex min-w-0 flex-col items-stretch justify-between gap-3 border-t border-zinc-200/60 pt-4 sm:mt-5 sm:flex-row sm:items-center sm:pt-5">
          <p className="text-center text-[11px] font-semibold leading-relaxed text-zinc-500 sm:text-left sm:text-xs">
            &copy; {currentYear} Kivora English. Todos os direitos reservados.
          </p>

          <Link
            href="/profile"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-[16px] border border-zinc-200/70 bg-white/45 px-3 py-2 text-xs font-bold text-zinc-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-emerald-800 dark:hover:text-[#b8ff5c] sm:min-h-0 sm:rounded-full sm:py-1.5"
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
