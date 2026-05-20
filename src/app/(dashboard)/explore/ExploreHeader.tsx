'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Filter, Wand2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface PackRow {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
}

interface ExploreHeaderProps {
  featuredPack?: PackRow
}

export default function ExploreHeader({ featuredPack }: ExploreHeaderProps) {
  return (
    <header className="premium-card relative overflow-hidden border-[var(--color-border)]/70 p-6 sm:p-8 lg:p-10 group">
      {/* Decorative glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-light)/0.3,transparent_60%)] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[var(--color-primary)]/[0.03] rounded-full blur-3xl pointer-events-none" />
      
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="stitch-pill bg-[var(--color-primary-container)] text-[var(--color-primary)] font-black text-[10px] tracking-wider uppercase">
              Catalog
            </span>
            <p className="section-kicker">Pacotes prontos para estudar</p>
          </div>
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-[var(--color-text)] tracking-tight sm:text-5xl">
            Encontre o próximo treino certo
          </h1>
          <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-[var(--color-text-muted)]">
            Compare níveis, veja o que já está na sua rotina e adicione novos packs sem sair do fluxo de estudo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/home" className="btn-primary px-5 h-11 text-xs font-bold">
              <BookOpen className="h-4 w-4" />
              Minha rotina
            </Link>
            <a href="#packs" className="btn-ghost px-5 h-11 text-xs font-bold">
              <Filter className="h-4 w-4" />
              Ver catálogo
            </a>
          </div>
        </div>

        {/* Featured Pack Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className="relative z-10 overflow-hidden rounded-2xl border border-[var(--color-border)]/80 bg-gradient-to-br from-[var(--color-surface-container-lowest)] via-[var(--color-surface-container-low)] to-[var(--color-primary-light)]/10 p-5 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker text-[10px] uppercase font-black tracking-wider text-[var(--color-primary)]">Destaque</p>
              <h2 className="mt-2 text-xl font-black text-[var(--color-text)] sm:text-2xl leading-snug">
                {featuredPack?.name || 'Pacote em destaque'}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)] line-clamp-2">
                {featuredPack?.description || 'Pacotes com visual mais claro e ações rápidas para começar agora.'}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-sm">
              <Wand2 className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-5 rounded-xl border border-white/60 bg-white/55 dark:border-white/10 dark:bg-white/5 p-4 shadow-sm relative overflow-hidden flex items-center justify-center min-h-[140px]">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-full max-w-[200px]"
            >
              <Image
                src="/images/home/undraw-sharing-knowledge.svg"
                alt="Ilustração de descoberta de pacotes de estudo"
                width={300}
                height={240}
                unoptimized
                priority
                className="mx-auto h-auto w-full object-contain filter drop-shadow-sm select-none"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
