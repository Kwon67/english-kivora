'use client'

import { m } from 'framer-motion'
import { Brain, Lightbulb, BookOpen } from 'lucide-react'

interface HomeBottomCardsProps {
  totalDue: number
  cardsMasteredThisWeek: number
  focusRank: string
}

// 🎧 Animated headphones component with audio waves
function AnimatedHeadphones() {
  const headphoneVariants = {
    initial: { rotate: 0 },
    hover: {
      rotate: [0, -8, 8, -8, 8, 0],
      transition: {
        duration: 1.2,
        ease: 'easeInOut' as const,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  }

  const waveVariants = {
    initial: { scaleY: 0.3 },
    hover: (i: number) => ({
      scaleY: [0.3, 1, 0.3],
      transition: {
        duration: 0.7,
        repeat: Infinity,
        delay: i * 0.15,
        ease: 'easeInOut' as const,
      },
    }),
  }

  return (
    <div className="relative flex items-center justify-center h-16 w-20 select-none">
      {/* Soundwaves container */}
      <div className="absolute bottom-1 flex gap-[3px] items-end justify-center w-full h-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <m.span
            key={i}
            custom={i}
            variants={waveVariants}
            initial="initial"
            className="w-[3px] h-full rounded-full bg-[var(--color-primary)] origin-bottom opacity-70"
          />
        ))}
      </div>

      {/* Headphones SVG */}
      <m.div variants={headphoneVariants} initial="initial" className="absolute top-1 text-[var(--color-primary)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 28"
          className="w-10 h-10 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2z" />
          <path d="M3 19a2 2 0 0 0 2-2h1a2 2 0 0 0 2 2v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2z" />
        </svg>
      </m.div>
    </div>
  )
}

// 🔤 Animated ABC component with letters floating
function AnimatedABC() {
  const containerVariants = {
    initial: {},
    hover: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  }

  const letterVariants = {
    initial: { y: 0, scale: 1 },
    hover: {
      y: [-2, -8, -2],
      scale: [1, 1.15, 1],
      transition: {
        duration: 1.6,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  }

  return (
    <m.div
      variants={containerVariants}
      className="relative flex items-center justify-center h-16 w-20 select-none font-[family:var(--font-display)] font-extrabold text-[var(--color-primary)]"
    >
      <div className="flex gap-1.5 items-end">
        <m.span variants={letterVariants} className="text-xl text-[var(--color-primary)] opacity-70">
          A
        </m.span>
        <m.span variants={letterVariants} className="text-base text-[var(--color-accent)] opacity-80 mb-2">
          B
        </m.span>
        <m.span variants={letterVariants} className="text-lg text-[var(--color-primary)] opacity-60">
          C
        </m.span>
      </div>
    </m.div>
  )
}

// 💡 Animated Lightbulb component with rays and glows
function AnimatedLightbulb() {
  const glowVariants = {
    initial: { opacity: 0, scale: 0.8 },
    hover: {
      opacity: [0.15, 0.4, 0.15],
      scale: [0.8, 1.3, 0.8],
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  }

  const rayVariants = (i: number) => ({
    initial: { opacity: 0.2, scale: 0.9 },
    hover: {
      opacity: [0.2, 0.8, 0.2],
      scale: [0.9, 1.15, 0.9],
      transition: {
        duration: 1.4,
        repeat: Infinity,
        delay: i * 0.25,
        ease: 'easeInOut' as const,
      },
    },
  })

  return (
    <div className="relative flex items-center justify-center h-16 w-20 select-none text-[var(--color-accent)]">
      {/* Glow aura */}
      <m.div
        variants={glowVariants}
        className="absolute w-12 h-12 rounded-full bg-[var(--color-accent)] filter blur-md pointer-events-none"
      />

      {/* Decorative Rays */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3].map((i) => {
          const rotation = i * 45 + 45
          return (
            <m.div
              key={i}
              custom={i}
              variants={rayVariants(i)}
              style={{ transform: `rotate(${rotation}deg)` }}
              className="absolute w-1 h-8 flex justify-between"
            >
              <div className="w-[2px] h-[4px] bg-[var(--color-accent)] rounded-full" />
              <div className="w-[2px] h-[4px] bg-[var(--color-accent)] rounded-full" />
            </m.div>
          )
        })}
      </div>

      {/* Lightbulb SVG */}
      <m.div
        variants={{
          initial: { rotate: 0 },
          hover: {
            rotate: [0, -5, 5, -5, 0],
            transition: { duration: 0.6, ease: 'easeInOut' as const },
          },
        }}
        className="relative z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-9 h-9 pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
      </m.div>
    </div>
  )
}

export default function HomeBottomCards({
  totalDue,
  cardsMasteredThisWeek,
  focusRank,
}: HomeBottomCardsProps) {
  const cardVariants = {
    initial: { y: 0, filter: 'brightness(1)' },
    hover: {
      y: -6,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Card 1: Revisão Pendente */}
      <m.article
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        className="stitch-panel relative overflow-hidden p-6 cursor-pointer flex flex-col justify-between h-[156px] transition-all hover:border-[var(--color-primary)] hover:shadow-lg bg-linear-to-b from-[var(--color-surface-container)] to-[var(--color-surface-container-low)]"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="section-kicker">Revisão pendente</p>
            <p className="mt-3.5 text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              {totalDue}
            </p>
          </div>
          <AnimatedHeadphones />
        </div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mt-auto flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-[var(--color-primary)] opacity-70" />
          Cards aguardando estudo hoje.
        </p>
      </m.article>

      {/* Card 2: Cards Dominados */}
      <m.article
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        className="stitch-panel relative overflow-hidden p-6 cursor-pointer flex flex-col justify-between h-[156px] transition-all hover:border-[var(--color-primary)] hover:shadow-lg bg-linear-to-b from-[var(--color-surface-container)] to-[var(--color-surface-container-low)]"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="section-kicker">Cards dominados</p>
            <p className="mt-3.5 text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              {cardsMasteredThisWeek}
            </p>
          </div>
          <AnimatedABC />
        </div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mt-auto flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-[var(--color-primary)] opacity-70" />
          Consolidados nesta semana.
        </p>
      </m.article>

      {/* Card 3: Nível de Foco */}
      <m.article
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        className="stitch-panel relative overflow-hidden p-6 cursor-pointer flex flex-col justify-between h-[156px] transition-all hover:border-[var(--color-accent)] hover:shadow-lg bg-linear-to-b from-[var(--color-surface-container)] to-[var(--color-surface-container-low)]"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="section-kicker">Nível de foco</p>
            <p className="mt-3.5 text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">
              {focusRank}
            </p>
          </div>
          <AnimatedLightbulb />
        </div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mt-auto flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-[var(--color-accent)] opacity-70" />
          Seu nível no foco semanal.
        </p>
      </m.article>
    </section>
  )
}
