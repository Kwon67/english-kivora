'use client'

import { useMemo } from 'react'
import { getAppDateString } from '@/lib/timezone'
import {
  buildHeatmapModel,
  formatHeatmapDisplayDate,
  getHeatmapColorClass,
  HEATMAP_LEVELS,
  HEATMAP_WEEKDAY_ROW_LABELS,
  HEATMAP_WEEKS_FULL,
} from '@/features/review/lib/activityHeatmap'

interface ActivityHeatmapProps {
  activityData: Record<string, number>
}

export default function ActivityHeatmap({ activityData }: ActivityHeatmapProps) {
  const today = getAppDateString()

  const { grid, monthLabels, stats } = useMemo(
    () => buildHeatmapModel(activityData, HEATMAP_WEEKS_FULL, today),
    [activityData, today],
  )

  return (
    <div className="mt-3 min-w-0">
      <dl className="mb-4 grid grid-cols-3 gap-3 border-y border-brand-dark/15 py-3">
        <div><dt className="text-xs text-brand-secondary">Dias ativos</dt><dd className="text-lg font-semibold">{stats.activeDays}</dd></div>
        <div><dt className="text-xs text-brand-secondary">Interações</dt><dd className="text-lg font-semibold">{stats.totalInteractions}</dd></div>
        <div><dt className="text-xs text-brand-secondary">Pico</dt><dd className="text-lg font-semibold">{stats.bestCount || '—'}</dd></div>
      </dl>

      <HeatmapGrid
        weeks={HEATMAP_WEEKS_FULL}
        grid={grid}
        monthLabels={monthLabels}
        label={`Heatmap de atividade: ${stats.activeDays} dias ativos e ${stats.totalInteractions} interações nas últimas ${HEATMAP_WEEKS_FULL} semanas.`}
      />

      <div className="mt-3 flex flex-col gap-2 border-t border-brand-dark/15 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-brand-secondary">
          Últimas {HEATMAP_WEEKS_FULL} semanas
          {stats.bestDate ? (
            <>
              {' '}
              · melhor dia: <span className="font-semibold text-brand-dark">{formatHeatmapDisplayDate(stats.bestDate)}</span>
            </>
          ) : null}
        </p>
        <HeatmapLegend />
      </div>
    </div>
  )
}

type HeatmapGridProps = {
  weeks: number
  grid: ReturnType<typeof buildHeatmapModel>['grid']
  monthLabels: string[]
  label: string
  compact?: boolean
}

export function HeatmapGrid({ weeks, grid, monthLabels, label, compact = false }: HeatmapGridProps) {
  const labelWidth = compact ? '1.75rem' : '2.25rem'
  const minWidth = `calc(${labelWidth} + ${weeks * (compact ? 11 : 14)}px)`

  return (
    <div className="min-w-0 max-w-full overflow-x-auto pb-1" role="region" aria-label="Calendário de atividade" tabIndex={0}>
      <div style={{ minWidth }} role="img" aria-label={label}>
        <div
          className="mb-1.5 grid items-end gap-x-1 gap-y-0"
          style={{ gridTemplateColumns: `${labelWidth} repeat(${weeks}, minmax(0, 1fr))` }}
        >
          <div aria-hidden="true" />
          {monthLabels.map((monthLabel, index) => (
            <div
              key={`month-${index}`}
              className="truncate text-center font-heading text-[8px] font-bold uppercase tracking-wide text-brand-secondary sm:text-2xs"
            >
              {monthLabel}
            </div>
          ))}
        </div>

        <div
          className={`grid gap-x-1 gap-y-1 ${compact ? '' : 'sm:gap-y-1.5'}`}
          style={{ gridTemplateColumns: `${labelWidth} repeat(${weeks}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: 7 }, (_, weekday) => (
            <div key={`row-${weekday}`} className="contents">
              <div className="flex items-center whitespace-nowrap font-heading text-[8px] font-bold uppercase text-brand-secondary sm:text-2xs">
                {HEATMAP_WEEKDAY_ROW_LABELS[weekday] ?? ''}
              </div>

              {grid.map((column, week) => {
                const cell = column[weekday]
                const title = cell.date
                  ? `${cell.count} interação${cell.count === 1 ? '' : 'ões'} em ${formatHeatmapDisplayDate(cell.date)}`
                  : undefined

                return (
                  <div
                    key={`${week}-${weekday}`}
                    title={title}
                    className={`aspect-square w-full justify-self-center rounded-[3px] transition-colors ${
                      compact ? 'min-w-[7px] max-w-[14px]' : 'min-w-[10px] max-w-[20px] sm:max-w-none'
                    } ${getHeatmapColorClass(cell.count, cell.isFuture)}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function HeatmapLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? 'justify-center' : 'justify-between sm:justify-end sm:gap-3'}`}>
      <span className="font-heading text-[9px] font-bold uppercase tracking-widest text-brand-secondary sm:text-2xs">
        Menos
      </span>
      <div className="flex gap-1">
        {HEATMAP_LEVELS.map((levelClass, index) => (
          <div
            key={index}
            className={`rounded-[3px] ${compact ? 'h-2.5 w-2.5' : 'h-3 w-3 sm:h-3.5 sm:w-3.5'} ${levelClass}`}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="font-heading text-[9px] font-bold uppercase tracking-widest text-brand-secondary sm:text-2xs">
        Mais
      </span>
    </div>
  )
}
