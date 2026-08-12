'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Layers3, Plus } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import {
  libraryHero,
  libraryIconBox,
  libraryPill,
  libraryPrimaryBtn,
  librarySoftBtn,
  libraryTile,
} from '@/features/profile/lib/libraryPageUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface LibraryHeaderProps {
  packCount: number
  totalCards: number
  folderCount: number
}

export default function LibraryHeader({ packCount, totalCards, folderCount }: LibraryHeaderProps) {
  const collectionLevel =
    packCount === 0 ? 'Vazia' : totalCards >= 50 ? 'Rica' : totalCards >= 15 ? 'Em crescimento' : 'Iniciante'

  return (
    <header className={`${libraryHero} p-4 sm:p-8 lg:p-10`}>
      <div className="relative z-10 mb-5">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={librarySoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Início
        </Link>
      </div>

      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Biblioteca' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge label="Arquivo pessoal" animate={false} />
            <span className={`${libraryPill} bg-brand-accent`}>{collectionLevel}</span>
          </div>

          <h1 className="mt-5 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
            Minha biblioteca
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Crie packs, organize em pastas e mantenha seus materiais privados em um só lugar — manual ou com IA. A
            contagem completa da sua coleção está logo abaixo.
          </p>

          <div className="mt-6 sm:mt-8">
            <a href="#packs" className={`${libraryPrimaryBtn} w-full sm:w-auto`}>
              <Plus className="h-4 w-4 shrink-0" />
              Criar pack
            </a>
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          className={`${libraryTile} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={libraryPill}>Coleção</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {packCount > 0
                  ? `${packCount} ${packCount === 1 ? 'pack salvo' : 'packs salvos'}`
                  : 'Nenhum pack ainda'}
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                {totalCards > 0
                  ? `${totalCards} cards distribuídos em ${folderCount} ${folderCount === 1 ? 'pasta' : 'pastas'}.`
                  : 'Comece criando um pack manual ou gere um com IA.'}
              </p>
            </div>
            <div className={`h-11 w-11 shrink-0 ${libraryIconBox}`}>
              <Layers3 className="h-5 w-5" strokeWidth={2.2} />
            </div>
          </div>

          <div
            className={`mt-4 flex min-h-[120px] items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-bg-primary p-3 sm:mt-5 sm:min-h-[140px] sm:p-4`}
          >
            <m.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="w-full max-w-[180px] sm:max-w-[200px]"
            >
              <Image
                src="/images/home/undraw-library-archive.svg"
                alt="Ilustração de arquivo e organização de conteúdo"
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
    </header>
  )
}