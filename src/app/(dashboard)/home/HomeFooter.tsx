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
} from '@/lib/homeStyles'

/**
 * Mapa do rodapé.
 *
 * Os rótulos são os MESMOS da navegação, de propósito: aqui se lia "Explorar packs", "Sessão de
 * Revisão", "Tutor de IA", "Minha Rotina", "Minha Biblioteca" e "Configurações" para lugares que
 * o menu chama de Explorar, Revisar, Tutor IA, Rotina, Biblioteca e Conta. Dois nomes para o
 * mesmo destino fazem o leitor achar que são páginas diferentes.
 *
 * Cada destino aparece UMA vez. Antes /explore, /review, /tutor e /library apareciam duas vezes
 * cada — uma na fileira de atalhos, outra na coluna —, somando oito rótulos para quatro lugares.
 * A fileira de atalhos saiu daqui; ela continua no rodapé compacto do celular, onde não há colunas
 * para repetir.
 *
 * "Início" também saiu: este rodapé só existe na Home, então era um link para a página atual.
 */
const footerSections = [
  {
    title: 'Estudar',
    Icon: BookOpen,
    links: [
      { href: '/study', label: 'Rotina' },
      { href: '/explore', label: 'Explorar' },
      { href: '/review', label: 'Revisar' },
    ],
  },
  {
    title: 'Praticar',
    Icon: Zap,
    links: [
      { href: '/blitz', label: 'Blitz' },
      { href: '/tutor', label: 'Tutor IA' },
      { href: '/problem-words', label: 'Dificuldades' },
    ],
  },
  {
    title: 'Conta',
    Icon: Trophy,
    links: [
      { href: '/history', label: 'Histórico' },
      { href: '/library', label: 'Biblioteca' },
      { href: '/settings', label: 'Conta' },
    ],
  },
]

/** Só o rodapé compacto do celular usa isto — lá não há colunas, então não duplica nada. */
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
        className={`content-visibility-section render-contained relative mt-10 hidden max-w-full overflow-hidden p-6 sm:mt-12 sm:block sm:p-8 lg:p-10 ${homeFooterCardClass}`}
      >
        <div className="relative z-10 min-w-0">
          <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[1.1fr_1.55fr] lg:gap-12">
            <section className="min-w-0 p-0">
              <div className="flex min-w-0 flex-col gap-5">
                <div className="flex items-center justify-between">
                  <BrandMark compact={false} tone="default" />
                </div>

                <p className="max-w-sm font-body text-sm leading-relaxed text-brand-secondary [overflow-wrap:anywhere]">
                  Rotina de inglês, revisão e desafios rápidos em um só lugar.
                </p>
              </div>
            </section>

            <nav
              className="grid min-w-0 content-start gap-6 sm:grid-cols-3 sm:gap-8"
              aria-label="Links do rodapé"
            >
              {footerSections.map((section) => {
                const SectionIcon = section.Icon

                // Sem borda: eram três cartões dentro de um cartão, e com o raio de 20px em
                // todos o rodapé virava caixa dentro de caixa. Um título e uma lista bastam.
                return (
                  <section key={section.title} className="min-w-0">
                    <div className="mb-2 flex min-w-0 items-center gap-2 border-b border-brand-dark/15 pb-2">
                      <SectionIcon className="h-3.5 w-3.5 shrink-0 text-brand-dark" strokeWidth={2.4} />
                      <h4 className="min-w-0 font-heading text-[11px] font-bold uppercase tracking-widest text-brand-dark">
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
                            className="group inline-flex min-h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[13px] px-2 py-1.5 font-body text-sm leading-tight text-brand-secondary transition-colors hover:bg-bg-primary hover:text-brand-dark"
                          >
                            <span className="flex-1 truncate">{link.label}</span>
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

          {/* O botão "Biblioteca do estudante" saiu: era um terceiro caminho para /library, que
              já está na coluna Conta como "Biblioteca". */}
          <div className="mt-8 border-t border-brand-dark/15 pt-5">
            <p className="font-body text-xs font-semibold leading-relaxed text-brand-secondary">
              &copy; {currentYear} Kivora English. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </m.footer>
    </>
  )
}
