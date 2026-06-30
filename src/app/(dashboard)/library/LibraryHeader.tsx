'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, FolderOpen, Layers3, Plus } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import {
  libraryCollectionStrip,
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
  const cardsPerPack = packCount > 0 ? Math.round(totalCards / packCount) : 0
  const density = packCount > 0 ? Math.min(100, Math.round((cardsPerPack / 20) * 100)) : 0

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

          <div className={`${libraryCollectionStrip} mt-5 sm:mt-6`}>
            <div className="min-w-0">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                Densidade da coleção
              </p>
              <p className="mt-1 font-heading text-lg font-bold tabular-nums text-brand-dark sm:text-xl">
                {totalCards} cards · {packCount} {packCount === 1 ? 'pack' : 'packs'}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:max-w-xs">
              <div className="h-2 flex-1 overflow-hidden rounded-full border border-brand-dark bg-bg-card">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(packCount > 0 ? 8 : 0, density)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full bg-brand-dark"
                />
              </div>
              <span className="shrink-0 font-heading text-sm font-bold tabular-nums text-brand-dark">
                {folderCount} {folderCount === 1 ? 'pasta' : 'pastas'}
              </span>
            </div>
          </div>

          <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:mt-5 sm:text-base">
            Crie packs, organize em pastas e mantenha seus materiais privados em um só lugar — manual ou com IA.
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

          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5">
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-2.5 py-2.5 sm:px-3`}>
              <BookOpen className="h-3.5 w-3.5 text-brand-dark" strokeWidth={2.2} />
              <p className="mt-2 font-heading text-lg font-bold tabular-nums text-brand-dark">{packCount}</p>
            </div>
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-2.5 py-2.5 sm:px-3`}>
              <Layers3 className="h-3.5 w-3.5 text-brand-dark" strokeWidth={2.2} />
              <p className="mt-2 font-heading text-lg font-bold tabular-nums text-brand-dark">{totalCards}</p>
            </div>
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-2.5 py-2.5 sm:px-3`}>
              <FolderOpen className="h-3.5 w-3.5 text-brand-dark" strokeWidth={2.2} />
              <p className="mt-2 font-heading text-lg font-bold tabular-nums text-brand-dark">{folderCount}</p>
            </div>
          </div>
        </m.div>
      </div>
    </header>
  )
}