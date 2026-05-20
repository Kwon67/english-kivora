'use client'

import { m } from 'framer-motion'
import { Brain, Lightbulb, BookOpen, Headphones } from 'lucide-react'

interface HomeBottomCardsProps {
  totalDue: number
  cardsMasteredThisWeek: number
  focusRank: string
}

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
      <div className="absolute bottom-1 flex gap-[3.5px] items-end justify-center w-full h-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <m.span
            key={i}
            custom={i}
            variants={waveVariants}
            initial="initial"
            className="w-[3.5px] h-full rounded-full bg-[var(--color-primary)] origin-bottom opacity-70"
          />
        ))}
      </div>

      {/* Headphones (Feather Icon style via Lucide) */}
      <m.div variants={headphoneVariants} initial="initial" className="absolute top-0.5 text-[var(--color-primary)] flex items-center justify-center">
        <Headphones className="w-9 h-9 pointer-events-none" strokeWidth={2.2} />
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
    hover: (i: number) => ({
      y: [0, -8, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.4,
        repeat: Infinity,
        delay: i * 0.25,
        ease: 'easeInOut' as const,
      },
    }),
  }

  return (
    <m.div
      variants={containerVariants}
      className="relative flex items-center justify-center h-16 w-20 select-none font-[family:var(--font-display)] font-extrabold"
    >
      <div className="flex gap-1.5 items-end justify-center">
        {[
          { char: 'A', size: 'text-xl', color: 'text-[var(--color-primary)]', opacity: 'opacity-70', mb: '' },
          { char: 'B', size: 'text-base', color: 'text-[var(--color-accent)]', opacity: 'opacity-85', mb: 'mb-1.5' },
          { char: 'C', size: 'text-lg', color: 'text-[var(--color-primary)]', opacity: 'opacity-60', mb: '' },
        ].map((item, idx) => (
          <m.span
            key={idx}
            custom={idx}
            variants={letterVariants}
            className={`${item.size} ${item.color} ${item.opacity} ${item.mb} font-extrabold select-none`}
          >
            {item.char}
          </m.span>
        ))}
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

      {/* Lightbulb (Feather Icon style via Lucide) */}
      <m.div
        variants={{
          initial: { rotate: 0 },
          hover: {
            rotate: [0, -5, 5, -5, 0],
            transition: { duration: 0.6, ease: 'easeInOut' as const },
          },
        }}
        className="relative z-10 flex items-center justify-center"
      >
        <Lightbulb className="w-8.5 h-8.5 pointer-events-none" strokeWidth={2.2} />
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
