'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, Radio, TrendingUp } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import { homeIconGlyph } from '@/lib/homeStyles'
import {
  adminDashboardHero,
  adminDashboardIconBoxLg,
  adminDashboardPill,
  adminDashboardSoftBtn,
  adminDashboardTile,
} from '@/features/admin/lib/adminDashboardUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import AdminDashboardRealtime from './AdminDashboardRealtime'
import AdminLiveBadge from './AdminLiveBadge'

interface AdminDashboardHeaderProps {
  todayLabel: string
}

export default function AdminDashboardHeader({ todayLabel }: AdminDashboardHeaderProps) {
  return (
    <header className={`${adminDashboardHero} p-4 sm:p-8 lg:p-10`}>
      <AdminDashboardRealtime />

      <div className="relative z-10 mb-5">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={adminDashboardSoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Início
        </Link>
      </div>

      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Torre de Comando' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge label="Operações" animate={false} />
            <AdminLiveBadge />
            <span className={adminDashboardPill}>{todayLabel}</span>
          </div>

          <h1 className="mt-5 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
            Torre de Comando
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

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          className={`${adminDashboardTile} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={adminDashboardPill}>Radar do dia</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                Painel operacional
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                Conclusão, tarefas, acertos e atividade da equipe, tudo na faixa de números abaixo.
              </p>
            </div>
            <div className={adminDashboardIconBoxLg}>
              <TrendingUp className={homeIconGlyph} strokeWidth={2.2} />
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
                src="/images/admin/undraw-ops-analytics.svg"
                alt="Ilustração de análise operacional"
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