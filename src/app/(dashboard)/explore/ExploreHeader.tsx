'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Filter, Wand2 } from 'lucide-react'
import { m } from 'framer-motion'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import {
  homeHeroCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePrimaryButton,
  homeSecondaryButton,
  homeSmallPillClass,
} from '@/lib/homeStyles'

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
    <section className={homeHeroCardClass}>
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-10">
        <div>
          <SectionBadge label="Catálogo" />
          <p className={`mt-4 ${homeSmallPillClass} bg-brand-accent`}>Pacotes prontos para estudar</p>
          <h1 className="mt-6 max-w-2xl font-heading text-4xl font-bold leading-[1.1] text-brand-dark sm:text-5xl">
            Encontre o próximo treino certo
          </h1>
          <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Os pacotes estão organizados em pastas — como PEC, vocabulário ou temas livres. Compare níveis, veja o que já está na sua rotina e adicione novos treinos sem sair do fluxo de estudo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/study" className={homePrimaryButton}>
              <BookOpen className="h-4 w-4" />
              Minha rotina
            </Link>
            <a href="#packs" className={homeSecondaryButton}>
              <Filter className="h-4 w-4" />
              Ver catálogo
            </a>
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className={`${homeNestedCardClass} p-5 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={homeSmallPillClass}>Destaque</p>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {featuredPack?.name || 'Pacote em destaque'}
              </h2>
              <p className="mt-2 line-clamp-2 font-body text-xs leading-relaxed text-brand-secondary">
                {featuredPack?.description || 'Pacotes com visual mais claro e ações rápidas para começar agora.'}
              </p>
            </div>
            <div className={`h-11 w-11 shrink-0 ${homeIconBox}`}>
              <Wand2 className="h-5 w-5" strokeWidth={2.2} />
            </div>
          </div>

          <div className={`mt-5 flex min-h-[140px] items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-bg-primary p-4`}>
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
                className="mx-auto h-auto w-full object-contain select-none"
              />
            </m.div>
          </div>
        </m.div>
      </div>
    </section>
  )
}