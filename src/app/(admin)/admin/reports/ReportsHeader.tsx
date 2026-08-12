'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BarChart3, FileText } from 'lucide-react'
import { m } from 'framer-motion'
import type { ReactNode } from 'react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import { homeIconGlyph } from '@/lib/homeStyles'
import { adminDashboardIconBoxLg } from '@/features/admin/lib/adminDashboardUi'
import {
  adminReportsHero,
  adminReportsPill,
  adminReportsSoftBtn,
  adminReportsTile,
} from '@/features/admin/lib/adminReportsUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface ReportsHeaderProps {
  action?: ReactNode
}

export default function ReportsHeader({ action }: ReportsHeaderProps) {
  return (
    <header className={`${adminReportsHero} p-4 sm:p-8 lg:p-10`}>
      <div className="relative z-10 mb-5">
        <Link href="/admin/dashboard" transitionTypes={navBackTransitionTypes} className={adminReportsSoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Torre de Comando
        </Link>
      </div>

      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Sala de inteligência' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge label="Análise consolidada" animate={false} />
            <span className={adminReportsPill}>Últimos 30 dias</span>
          </div>

          <h1 className="mt-5 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
            Sala de Inteligência
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Retenção, precisão, ranking semanal e pontos de fricção — tudo consolidado para orientar a operação do
            programa. Os números completos estão logo abaixo.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <a href="#ranking" className={`${adminReportsSoftBtn} w-full sm:w-auto`}>
              <BarChart3 className="h-4 w-4 shrink-0" />
              Ranking semanal
            </a>
            <a href="#membros" className={`${adminReportsSoftBtn} w-full sm:w-auto`}>
              <FileText className="h-4 w-4 shrink-0" />
              Resumo por membro
            </a>
            {action ? <div className="w-full sm:w-auto">{action}</div> : null}
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          className={`${adminReportsTile} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={adminReportsPill}>Snapshot</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                Sala de inteligência
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                Revisões, sessões e precisão dos últimos 30 dias, consolidados na faixa de números abaixo.
              </p>
            </div>
            <div className={adminDashboardIconBoxLg}>
              <BarChart3 className={homeIconGlyph} strokeWidth={2.2} />
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
                src="/images/admin/undraw-intel-hub.svg"
                alt="Ilustração de análise e relatórios"
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