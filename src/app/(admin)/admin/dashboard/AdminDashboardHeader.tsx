'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, LayoutDashboard, TrendingUp, Users } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import {
  AdminBadge,
  accentBadge,
  ghostBtn,
  glassTile,
} from '@/features/admin/lib/adminUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import AdminDashboardRealtime from './AdminDashboardRealtime'

interface AdminDashboardHeaderProps {
  completionRate: number
  todayCompleted: number
  todayTotal: number
  totalCorrect: number
  memberCount: number
  todayLabel: string
}

export default function AdminDashboardHeader({
  completionRate,
  todayCompleted,
  todayTotal,
  totalCorrect,
  memberCount,
  todayLabel,
}: AdminDashboardHeaderProps) {
  return (
    <header className={`${glassTile} relative overflow-hidden p-6 sm:p-8 lg:p-10 group`}>
      <AdminDashboardRealtime />

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
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Centro Operacional' },
            ]}
            className="mb-4"
          />
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <AdminBadge label="Visão operacional" />
            <span className={accentBadge}>{todayLabel}</span>
          </div>
          <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight tracking-tight text-brand-dark sm:text-5xl">
            Centro Operacional
          </h1>
          <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Acompanhe conclusão diária, desempenho dos alunos e acertos recentes em tempo real. Use como leitura rápida da operação do programa.
          </p>

          <div className="mt-8">
            <a href="#desempenho" className={ghostBtn}>
              <LayoutDashboard className="h-4 w-4" />
              Ver desempenho
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
              <span className={accentBadge}>Resumo de hoje</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {completionRate}% de conclusão
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
                {todayTotal > 0
                  ? `${todayCompleted} de ${todayTotal} tarefas concluídas hoje.`
                  : 'Nenhuma tarefa atribuída para hoje ainda.'}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>

          <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <TrendingUp className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{completionRate}%</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">conclusão hoje</p>
            </div>
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <BookOpen className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{totalCorrect.toLocaleString()}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">acertos (30 dias)</p>
            </div>
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Users className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{memberCount}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">membros ativos</p>
            </div>
          </div>

          <div className="relative mt-5 flex min-h-[120px] items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[4px_4px_0_var(--color-brand-dark)]">
            <m.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-full max-w-[180px]"
            >
              <Image
                src="/images/ranking/undraw-metrics.svg"
                alt="Ilustração de métricas operacionais"
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