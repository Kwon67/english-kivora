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
      className="content-visibility-section render-contained relative mt-12 overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/45 shadow-[0_24px_70px_rgba(24,32,29,0.12)] backdrop-blur-md"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/10 to-emerald-50/35" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-700/25 to-transparent" />

      <div className="relative z-10 px-5 py-6 sm:px-7 sm:py-8">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1.55fr]">
          <section className="rounded-[28px] border border-zinc-200/55 bg-white/35 p-5 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-5">
              <BrandMark compact={false} tone="default" />

              <p className="max-w-sm text-sm leading-relaxed text-zinc-600">
                Rotina de inglês, revisão e prática competitiva em um só lugar.
              </p>

              <div className="flex flex-wrap gap-2">
                {highlightLinks.map((item) => {
                  const Icon = item.Icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      transitionTypes={navForwardTransitionTypes}
                      prefetch={false}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200/70 bg-white/45 px-3 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-emerald-700"
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>

          <nav className="grid gap-3 sm:grid-cols-3" aria-label="Links do rodapé">
            {footerSections.map((section) => {
              const SectionIcon = section.Icon

              return (
                <section
                  key={section.title}
                  className="rounded-[28px] border border-zinc-200/55 bg-white/35 p-5 shadow-[0_12px_34px_rgba(24,32,29,0.06)] backdrop-blur-sm"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-900/10">
                      <SectionIcon className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                    <h4 className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
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
                          className="group inline-flex w-full items-center justify-between gap-2 rounded-[18px] px-2.5 py-2 text-sm font-bold text-zinc-600 transition-colors hover:bg-white/55 hover:text-emerald-800"
                        >
                          <span className="truncate">{link.label}</span>
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

        <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-zinc-200/60 pt-5 sm:flex-row">
          <p className="text-xs font-semibold text-zinc-500">
            &copy; {currentYear} Kivora English. Todos os direitos reservados.
          </p>

          <Link
            href="/profile"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/45 px-3 py-1.5 text-xs font-bold text-zinc-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-emerald-800"
          >
            <User className="h-3.5 w-3.5" strokeWidth={2.3} />
            Área do estudante
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
          </Link>
        </div>
      </div>
    </m.footer>
  )
}
