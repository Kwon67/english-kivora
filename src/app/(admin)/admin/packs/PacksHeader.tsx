'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Layers, Package } from 'lucide-react'
import { m } from 'framer-motion'
import type { ReactNode } from 'react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import { homeIconGlyph } from '@/lib/homeStyles'
import {
  adminDashboardIconBoxLg,
  adminDashboardMetricStripBar,
  adminDashboardMetricStripPct,
  adminDashboardMetricStripTrack,
} from '@/features/admin/lib/adminDashboardUi'
import {
  adminPacksCatalogStrip,
  adminPacksHero,
  adminPacksPill,
  adminPacksSoftBtn,
  adminPacksTile,
} from '@/features/admin/lib/adminPacksUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface PacksHeaderProps {
  packCount: number
  totalCards: number
  missingAudioCount: number
  publicPackCount: number
  folderCount: number
  action?: ReactNode
}

export default function PacksHeader({
  packCount,
  totalCards,
  missingAudioCount,
  publicPackCount,
  folderCount,
  action,
}: PacksHeaderProps) {
  const audioHealth = totalCards > 0 ? Math.round(((totalCards - missingAudioCount) / totalCards) * 100) : 100

  return (
    <header className={`${adminPacksHero} p-4 sm:p-8 lg:p-10`}>
      <div className="relative z-10 mb-5">
        <Link href="/admin/dashboard" transitionTypes={navBackTransitionTypes} className={adminPacksSoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Torre de Comando
        </Link>
      </div>

      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Cofre de conteúdo' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge label="Biblioteca operacional" animate={false} />
            <span className={adminPacksPill}>{packCount} packs</span>
          </div>

          <h1 className="mt-5 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
            Cofre de Conteúdo
          </h1>

          <div className={`${adminPacksCatalogStrip} mt-5 sm:mt-6`}>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                Saúde do áudio
              </p>
              <p className="mt-1 break-words font-heading text-base font-bold leading-snug text-brand-dark sm:text-lg md:text-xl">
                {missingAudioCount > 0
                  ? `${missingAudioCount} frase${missingAudioCount === 1 ? '' : 's'} sem TTS`
                  : 'Biblioteca com áudio completo'}
              </p>
            </div>
            <div className={adminDashboardMetricStripTrack}>
              <div className={adminDashboardMetricStripBar}>
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, audioHealth)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full bg-brand-dark"
                />
              </div>
              <span className={adminDashboardMetricStripPct}>{audioHealth}%</span>
            </div>
          </div>

          <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:mt-5 sm:text-base">
            Crie packs, importe frases em lote e mantenha a biblioteca com áudio, pastas e níveis CEFR prontos para o
            programa.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <a href="#biblioteca" className={`${adminPacksSoftBtn} w-full sm:w-auto`}>
              <Layers className="h-4 w-4 shrink-0" />
              Biblioteca
            </a>
            {action ? <div className="w-full sm:w-auto">{action}</div> : null}
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          className={`${adminPacksTile} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={adminPacksPill}>Inventário</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {totalCards.toLocaleString()} cards · {folderCount} pastas
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                {publicPackCount} pack{publicPackCount === 1 ? '' : 's'} público
                {publicPackCount === 1 ? '' : 's'} disponíveis para o Blitz e a biblioteca dos membros.
              </p>
            </div>
            <div className={adminDashboardIconBoxLg}>
              <Package className={homeIconGlyph} strokeWidth={2.2} />
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
                src="/images/admin/undraw-content-vault.svg"
                alt="Ilustração de arquivo e biblioteca de conteúdo"
                width={300}
                height={240}
                unoptimized
                priority
                className="mx-auto h-auto w-full object-contain select-none"
              />
            </m.div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5`}>
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Cards</p>
              <p className="mt-1 font-heading text-sm font-bold text-brand-dark">{totalCards.toLocaleString()}</p>
            </div>
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5`}>
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Sem áudio</p>
              <p className="mt-1 font-heading text-sm font-bold text-brand-dark">{missingAudioCount}</p>
            </div>
          </div>
        </m.div>
      </div>
    </header>
  )
}