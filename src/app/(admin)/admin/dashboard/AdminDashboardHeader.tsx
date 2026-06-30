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
  adminDashboardMetricStripBar,
  adminDashboardMetricStripPct,
  adminDashboardMetricStripTrack,
  adminDashboardOpsStrip,
  adminDashboardPill,
  adminDashboardSoftBtn,
  adminDashboardTile,
} from '@/features/admin/lib/adminDashboardUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import AdminDashboardRealtime from './AdminDashboardRealtime'
import AdminLiveBadge from './AdminLiveBadge'

interface AdminDashboardHeaderProps {
  completionRate: number
  todayCompleted: number
  todayTotal: number
  totalCorrect: number
  memberCount: number
  activeToday: number
  todayLabel: string
}

export default function AdminDashboardHeader({
  completionRate,
  todayCompleted,
  todayTotal,
  totalCorrect,
  memberCount,
  activeToday,
  todayLabel,
}: AdminDashboardHeaderProps) {
  const opsHealth = Math.round((completionRate * 0.55) + (activeToday / Math.max(memberCount, 1)) * 45)

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

          <div className={`${adminDashboardOpsStrip} mt-5 sm:mt-6`}>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                Saúde operacional
              </p>
              <p className="mt-1 break-words font-heading text-base font-bold leading-snug text-brand-dark sm:text-lg md:text-xl">
                {completionRate}% de conclusão hoje
              </p>
            </div>
            <div className={adminDashboardMetricStripTrack}>
              <div className={adminDashboardMetricStripBar}>
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, opsHealth)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full bg-brand-dark"
                />
              </div>
              <span className={adminDashboardMetricStripPct}>{opsHealth}%</span>
            </div>
          </div>

          <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:mt-5 sm:text-base">
            Painel em tempo real da operação: conclusão diária, desempenho dos alunos e sinais de atividade.
            Os dados atualizam automaticamente conforme novas sessões entram.
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
                {todayTotal > 0 ? `${todayCompleted}/${todayTotal} tarefas` : 'Sem tarefas hoje'}
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                {activeToday > 0
                  ? `${activeToday} membro${activeToday === 1 ? '' : 's'} com atividade registrada hoje.`
                  : 'Nenhuma atividade registrada ainda hoje.'}
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

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5`}>
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Acertos</p>
              <p className="mt-1 font-heading text-sm font-bold text-brand-dark">{totalCorrect.toLocaleString()}</p>
            </div>
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5`}>
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Membros</p>
              <p className="mt-1 font-heading text-sm font-bold text-brand-dark">{memberCount}</p>
            </div>
          </div>
        </m.div>
      </div>
    </header>
  )
}