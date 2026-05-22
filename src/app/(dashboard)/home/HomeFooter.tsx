'use client'

import { m } from 'framer-motion'
import Link from 'next/link'
import BrandMark from '@/components/ui/BrandMark'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { Globe, Heart, BookOpen, Star, Compass, Award } from 'lucide-react'

// Floating background SVG ornaments
const floatingItems = [
  {
    Icon: BookOpen,
    colorClass: 'text-[var(--color-primary)]',
    x: '6%',
    y: '22%',
    scale: 0.75,
    duration: 8,
  },
  {
    Icon: Globe,
    colorClass: 'text-[var(--color-secondary)]',
    x: '82%',
    y: '18%',
    scale: 0.85,
    duration: 9,
  },
  {
    Icon: Star,
    colorClass: 'text-[var(--color-accent)]',
    x: '76%',
    y: '68%',
    scale: 0.65,
    duration: 6,
  },
  {
    Icon: Compass,
    colorClass: 'text-[var(--color-primary)]',
    x: '45%',
    y: '78%',
    scale: 0.8,
    duration: 7,
  },
  {
    Icon: Award,
    colorClass: 'text-[var(--color-accent)]',
    x: '22%',
    y: '60%',
    scale: 0.7,
    duration: 10,
  },
]

export default function HomeFooter() {
  const containerVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  }

  const linkHoverVariants = {
    hover: {
      x: 3,
      color: 'var(--color-primary)',
      transition: { duration: 0.2, ease: 'easeOut' as const },
    },
  }

  const wavePath = 'M0,64 C120,96 240,96 360,64 C480,32 600,0 720,0 C840,0 960,32 1080,64 C1200,96 1320,96 1440,64 L1440,320 L0,320 Z'

  return (
    <m.footer
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-40px' }}
      className="relative mt-12 overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] shadow-sm"
    >
      {/* Decorative Wave Header */}
      <div className="absolute top-0 left-0 w-full h-8 overflow-hidden pointer-events-none opacity-4">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-full fill-[var(--color-primary)]"
          preserveAspectRatio="none"
        >
          <path d={wavePath} />
        </svg>
      </div>

      {/* Floating background SVGs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {floatingItems.map((item, idx) => {
          const { Icon, colorClass, x, y, scale, duration } = item
          return (
            <m.div
              key={idx}
              className={`absolute ${colorClass} opacity-8 dark:opacity-4`}
              style={{ left: x, top: y }}
              animate={{
                y: [0, -18, 0],
                x: [0, 10, 0],
                rotate: [0, 15, -15, 0],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: 'easeInOut' as const,
                delay: idx * 0.5,
              }}
            >
              <Icon
                className="w-10 h-10"
                style={{ transform: `scale(${scale})` }}
                strokeWidth={1.8}
              />
            </m.div>
          )
        })}
      </div>

      {/* Footer Content */}
      <div className="relative z-10 mx-auto px-6 py-10 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand/Slogan column */}
          <div className="space-y-4">
            <BrandMark compact={false} tone="default" />
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)] max-w-sm">
              Plataforma inteligente para acelerar sua fluência no inglês com o método de repetição espaçada e conteúdos personalizados.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-container-high)] border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              <span className="flex h-2 w-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              Consistência diária
            </div>
          </div>

          {/* Links columns */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)] mb-4">
              Estudar
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/home', label: 'Página Inicial' },
                { href: '/explore', label: 'Explorar Packs' },
                { href: '/history', label: 'Histórico' },
              ].map((link, idx) => (
                <li key={idx}>
                  <m.div whileHover="hover" className="inline-block">
                    <Link
                      href={link.href}
                      transitionTypes={navForwardTransitionTypes}
                      className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <m.span variants={linkHoverVariants} className="inline-block">
                        {link.label}
                      </m.span>
                    </Link>
                  </m.div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)] mb-4">
              Praticar
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/arena', label: 'Arena de Prática' },
                { href: '/review', label: 'Sessão de Revisão' },
                { href: '/tutor', label: 'Tutor de IA' },
              ].map((link, idx) => (
                <li key={idx}>
                  <m.div whileHover="hover" className="inline-block">
                    <Link
                      href={link.href}
                      transitionTypes={navForwardTransitionTypes}
                      className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <m.span variants={linkHoverVariants} className="inline-block">
                        {link.label}
                      </m.span>
                    </Link>
                  </m.div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-text-subtle)] mb-4">
              Progresso
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/profile', label: 'Meu Perfil' },
                { href: '/ranking', label: 'Ranking Semanal' },
                { href: '/problem-words', label: 'Dificuldades' },
              ].map((link, idx) => (
                <li key={idx}>
                  <m.div whileHover="hover" className="inline-block">
                    <Link
                      href={link.href}
                      transitionTypes={navForwardTransitionTypes}
                      className="text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <m.span variants={linkHoverVariants} className="inline-block">
                        {link.label}
                      </m.span>
                    </Link>
                  </m.div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-subtle)] font-medium">
            &copy; {new Date().getFullYear()} Kivora English. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)] font-semibold bg-[var(--color-surface-container-high)]/60 px-3 py-1.5 rounded-full border border-[var(--color-border)]/40">
            <span>Feito com</span>
            <m.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const }}
              className="text-rose-500 inline-block"
            >
              <Heart className="h-3 w-3 fill-current" />
            </m.span>
            <span>para estudantes de inglês. ✨</span>
          </div>
        </div>
      </div>
    </m.footer>
  )
}
