'use client'

import { BarChart3, FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import {
  adminReportsHero,
  adminReportsPill,
  adminReportsSoftBtn,
} from '@/features/admin/lib/adminReportsUi'

interface ReportsHeaderProps {
  action?: ReactNode
}

export default function ReportsHeader({ action }: ReportsHeaderProps) {
  return (
    <header className={`${adminReportsHero} p-5 sm:p-8 lg:p-10`}>
      <div className="relative z-10 min-w-0">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Relatórios' },
            ]}
            className="mb-3"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className={adminReportsPill}>Últimos 30 dias</span>
          </div>

          <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
            Relatórios
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

      </div>
    </header>
  )
}