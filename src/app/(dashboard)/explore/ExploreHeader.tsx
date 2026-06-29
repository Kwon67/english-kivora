'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Filter, Wand2 } from 'lucide-react'
import { m } from 'framer-motion'

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

const cardClass =
  'relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)]'
const softKicker =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
const primaryBtn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-5 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition hover:translate-x-[1px] hover:translate-y-[1px]'
const ghostBtn =
  'group inline-flex w-fit items-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-2 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white'

function HeaderBadge({ label }: { label: string }) {
  return (
    <div className="flex w-fit items-center">
      <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
      <span className="h-px w-8 bg-brand-dark/60" />
      <span className={softKicker}>{label}</span>
      <span className="h-px w-8 bg-brand-dark/60" />
      <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
    </div>
  )
}

export default function ExploreHeader({ featuredPack }: ExploreHeaderProps) {
  return (
    <header className={`${cardClass} p-6 sm:p-8 lg:p-10 group`}>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
        <div>
          <HeaderBadge label="Catálogo" />
          <p className="mt-4 w-fit rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
            Pacotes prontos para estudar
          </p>
          <h1 className="mt-6 max-w-2xl font-heading text-4xl font-bold leading-tight text-brand-dark sm:text-5xl">
            Encontre o próximo treino certo
          </h1>
          <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Os pacotes estão organizados em pastas — como PEC, vocabulário ou temas livres. Compare níveis, veja o que já está na sua rotina e adicione novos treinos sem sair do fluxo de estudo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/study" className={primaryBtn}>
              <BookOpen className="h-4 w-4" />
              Minha rotina
            </Link>
            <a href="#packs" className={ghostBtn}>
              <Filter className="h-4 w-4" />
              Ver catálogo
            </a>
          </div>
        </div>

        {/* Featured Pack Card */}
        <m.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className="relative z-10 overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card p-5 shadow-[6px_6px_0_var(--color-brand-dark)] transition-transform hover:-translate-y-1 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <p className={softKicker}>Destaque</p>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {featuredPack?.name || 'Pacote em destaque'}
              </h2>
              <p className="mt-2 line-clamp-2 font-body text-xs leading-relaxed text-brand-secondary">
                {featuredPack?.description || 'Pacotes com visual mais claro e ações rápidas para começar agora.'}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Wand2 className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-5 flex min-h-[140px] items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[4px_4px_0_var(--color-brand-dark)]">
            <m.div
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
            </m.div>
          </div>
        </m.div>
      </div>
    </header>
  )
}
