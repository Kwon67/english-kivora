'use client'

import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Radio } from 'lucide-react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import {
  adminDashboardHero,
  adminDashboardPill,
  adminDashboardSoftBtn,
} from '@/features/admin/lib/adminDashboardUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import AdminDashboardRealtime from './AdminDashboardRealtime'
import AdminLiveBadge from './AdminLiveBadge'

interface AdminDashboardHeaderProps {
  todayLabel: string
}

export default function AdminDashboardHeader({ todayLabel }: AdminDashboardHeaderProps) {
  return (
    <header className={`${adminDashboardHero} p-5 sm:p-8 lg:p-10`}>
      <AdminDashboardRealtime />

      <div className="relative z-10 mb-5">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={adminDashboardSoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Início
        </Link>
      </div>

      <div className="relative z-10 min-w-0">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Visão Geral' },
            ]}
            className="mb-3"
          />

          <div className="flex flex-wrap items-center gap-2">
            <AdminLiveBadge />
            <span className={adminDashboardPill}>{todayLabel}</span>
          </div>

          <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
            Visão Geral
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Painel em tempo real da operação: conclusão diária, desempenho dos alunos e sinais de atividade. Os
            números completos estão logo abaixo, e os dados atualizam automaticamente conforme novas sessões entram.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <a href="#desempenho" className={`${adminDashboardSoftBtn} w-full sm:w-auto`}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Desempenho
            </a>
            <a href="#acoes" className={`${adminDashboardSoftBtn} w-full sm:w-auto`}>
              <Radio className="h-4 w-4 shrink-0" />
              Ações rápidas
            </a>
          </div>
        </div>

      </div>
    </header>
  )
}