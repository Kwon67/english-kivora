'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, FolderOpen, Layers3 } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { LibraryBadge, accentBadge, ghostBtn } from '@/features/profile/lib/libraryUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface LibraryHeaderProps {
  packCount: number
  totalCards: number
  folderCount: number
}

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)] transition-all duration-300'
export default function LibraryHeader({ packCount, totalCards, folderCount }: LibraryHeaderProps) {
  return (
    <header className={`${glassTile} relative overflow-hidden p-6 sm:p-8 lg:p-10 group`}>
      <div className="mb-5 relative z-10">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={`${ghostBtn} min-h-10`}>
          <ArrowLeft className="h-4 w-4" />
          Início
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
        <div>
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Biblioteca' },
            ]}
            className="mb-4"
          />
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <LibraryBadge label="Conteúdo pessoal" />
            <span className={accentBadge}>Privados por padrão</span>
          </div>
          <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight tracking-tight text-brand-dark sm:text-5xl">
            Minha biblioteca
          </h1>
          <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Crie packs, organize conteúdos em pastas e mantenha seus materiais pessoais em um único lugar.
          </p>

          <div className="mt-8">
            <a href="#packs" className={ghostBtn}>
              <BookOpen className="h-4 w-4" />
              Criar pack
            </a>
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className={`${glassTile} relative z-10 overflow-hidden p-5 hover:-translate-y-1 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className={accentBadge}>Resumo</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {packCount} {packCount === 1 ? 'pack' : 'packs'} na conta
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
                {totalCards > 0
                  ? `${totalCards} cards no total, distribuídos em ${folderCount} ${folderCount === 1 ? 'pasta' : 'pastas'}.`
                  : 'Comece criando um pack manual ou com IA.'}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Layers3 className="h-5 w-5" />
            </span>
          </div>

          <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <BookOpen className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{packCount}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">packs</p>
            </div>
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Layers3 className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{totalCards}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">cards</p>
            </div>
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <FolderOpen className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{folderCount}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">pastas</p>
            </div>
          </div>

          <div className="relative mt-5 flex min-h-[120px] items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[4px_4px_0_var(--color-brand-dark)]">
            <m.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-full max-w-[180px]"
            >
              <Image
                src="/images/home/undraw-sharing-knowledge.svg"
                alt="Ilustração de biblioteca de estudo"
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
