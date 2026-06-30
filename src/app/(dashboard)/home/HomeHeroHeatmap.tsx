'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { landingRadius } from '@/lib/landingStyles'
import { homeNestedCardClass } from '@/lib/homeStyles'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { getAppDateString } from '@/lib/timezone'
import { HeatmapGrid, HeatmapLegend } from '@/features/review/components/ActivityHeatmap'
import {
  buildHeatmapModel,
  HEATMAP_WEEKS_COMPACT,
} from '@/features/review/lib/activityHeatmap'

type HomeHeroHeatmapProps = {
  activityData: Record<string, number>
  completionRate: number
  reviewDue: number
  pendingCount: number
  doneCount: number
  completedDailyWork: number
  totalDailyWork: number
}

export default function HomeHeroHeatmap({
  activityData,
  completionRate,
  reviewDue,
  pendingCount,
  doneCount,
  completedDailyWork,
  totalDailyWork,
}: HomeHeroHeatmapProps) {
  const today = getAppDateString()

  const { grid, monthLabels, stats } = useMemo(
    () => buildHeatmapModel(activityData, HEATMAP_WEEKS_COMPACT, today),
    [activityData, today],
  )

  return (
    <Link
      href="/history"
      transitionTypes={navForwardTransitionTypes}
      prefetch={false}
      aria-label="Ver histórico de consistência e atividade"
      className={`home-hero-visual group relative z-10 mx-auto block w-full max-w-[20rem] ${landingRadius} border border-brand-dark bg-bg-primary p-4 transition-transform hover:-translate-y-0.5`}
    >
      <div className="flex items-center justify-between border-b border-brand-dark pb-2.5">
        <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
          Consistência
        </span>
        <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
          {completionRate}% hoje
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: 'Revisar', value: reviewDue },
          { label: 'Pendentes', value: pendingCount },
          { label: 'Concluídos', value: doneCount },
        ].map((item) => (
          <div key={item.label} className={`${homeNestedCardClass} px-2 py-2 text-center`}>
            <p className="font-heading text-[9px] font-bold uppercase tracking-wide text-brand-secondary">{item.label}</p>
            <p className="mt-1 font-heading text-base font-bold text-brand-dark">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <HeatmapGrid
          compact
          weeks={HEATMAP_WEEKS_COMPACT}
          grid={grid}
          monthLabels={monthLabels}
          label={`Atividade recente: ${stats.activeDays} dias ativos nas últimas ${HEATMAP_WEEKS_COMPACT} semanas.`}
        />
      </div>

      <div className="mt-3 border-t border-brand-dark/15 pt-3">
        <div className="flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
          <span>Carga de estudo</span>
          <span>
            {completedDailyWork}/{totalDailyWork}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-border">
          <div
            className="h-full rounded-full bg-brand-accent transition-all duration-500"
            style={{ width: `${Math.max(12, Math.min(100, completionRate))}%` }}
          />
        </div>
        <div className="mt-3">
          <HeatmapLegend compact />
        </div>
        <p className="mt-2 text-center font-body text-[10px] font-semibold text-brand-secondary transition-colors group-hover:text-brand-dark">
          Ver histórico completo
        </p>
      </div>
    </Link>
  )
}