'use client'

import { useMemo } from 'react'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

interface ActivityHeatmapProps {
  activityData: Record<string, number>
}

const HEATMAP_LEVELS = [
  'bg-bg-card border border-brand-border',
  'bg-brand-border',
  'bg-brand-secondary',
  'bg-brand-dark/75',
  'bg-brand-dark',
] as const

function getColorClass(count: number) {
  if (count === 0) return HEATMAP_LEVELS[0]
  if (count <= 20) return HEATMAP_LEVELS[1]
  if (count <= 50) return HEATMAP_LEVELS[2]
  if (count <= 100) return HEATMAP_LEVELS[3]
  return HEATMAP_LEVELS[4]
}

export default function ActivityHeatmap({ activityData }: ActivityHeatmapProps) {
  const days = useMemo(() => {
    const today = getAppDateString()
    const arr = []

    for (let i = 83; i >= 0; i--) {
      const dateStr = shiftAppDate(today, -i)
      arr.push({
        date: dateStr,
        count: activityData[dateStr] || 0,
      })
    }
    return arr
  }, [activityData])

  const columns = useMemo(() => {
    const cols = []
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7))
    }
    return cols
  }, [days])

  return (
    <div className="w-full overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max gap-[3px]">
        {columns.map((col, columnIndex) => (
          <div key={`col-${columnIndex}`} className="flex flex-col gap-[3px]">
            {col.map((day) => (
              <div
                key={day.date}
                title={`${day.count} interações em ${day.date.split('-').reverse().join('/')}`}
                className={`h-[11px] w-[11px] rounded-[2px] transition-colors ${getColorClass(day.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
        <span>Menos</span>
        <div className="flex gap-[3px]">
          {HEATMAP_LEVELS.map((levelClass, index) => (
            <div key={index} className={`h-[11px] w-[11px] rounded-[2px] ${levelClass}`} />
          ))}
        </div>
        <span>Mais</span>
      </div>
    </div>
  )
}
