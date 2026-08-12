'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BarChart3, BookOpen, LineChart } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import {
  historyHero,
  historyIconBox,
  historyPill,
  historySoftBtn,
  historyTile,
} from '@/features/history/lib/historyUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface HistoryHeaderProps {
  totalSessions: number
  averageAccuracy: number
  filterDate?: string
}

export default function HistoryHeader({
  totalSessions,
  averageAccuracy,
  filterDate,
}: HistoryHeaderProps) {
  const formattedFilterDate = filterDate ? filterDate.split('-').reverse().join('/') : null
  const accuracyTier =
    averageAccuracy >= 85 ? 'Excelente' : averageAccuracy >= 70 ? 'Sólido' : averageAccuracy > 0 ? 'Em evolução' : 'Sem dados'

  return (
    <header className={`${historyHero} p-4 sm:p-8 lg:p-10`}>
      <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={historySoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Início
        </Link>
        {formattedFilterDate ? (
          <span className={`${historyPill} bg-brand-accent`}>Filtro: {formattedFilterDate}</span>
        ) : null}
      </div>

      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Histórico' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge label="Arquivo de evolução" animate={false} />
            <span className={`${historyPill} bg-brand-accent`}>{accuracyTier}</span>
          </div>

          <h1 className="mt-5 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
            Seu histórico
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Seu arquivo de evolução: precisão, retenção e consistência. Os números completos estão logo abaixo, e os
            gráficos detalham onde focar.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <a href="#graficos" className={`${historySoftBtn} w-full sm:w-auto`}>
              <BarChart3 className="h-4 w-4 shrink-0" />
              Ver gráficos
            </a>
            <a href="#sessoes" className={`${historySoftBtn} w-full sm:w-auto`}>
              <BookOpen className="h-4 w-4 shrink-0" />
              Ver sessões
            </a>
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          className={`${historyTile} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={historyPill}>Resumo</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                Seu progresso
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                {totalSessions > 0
                  ? `${totalSessions} ${totalSessions === 1 ? 'sessão registrada' : 'sessões registradas'} até agora.`
                  : 'Complete uma lição para abrir seu arquivo de evolução.'}
              </p>
            </div>
            <div className={`h-11 w-11 shrink-0 ${historyIconBox}`}>
              <LineChart className="h-5 w-5" strokeWidth={2.2} />
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
                src="/images/home/undraw-growth-analytics.svg"
                alt="Ilustração de análise de crescimento e métricas"
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