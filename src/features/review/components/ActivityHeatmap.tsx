'use client'

import { useMemo } from 'react'

interface ActivityHeatmapProps {
  activityData: Record<string, number>
}

const HEATMAP_LEVELS = [
  'bg-[var(--color-surface-container)]',
  'bg-[#a3c9b7] dark:bg-primary/18',
  'bg-[#73a890] dark:bg-primary/32',
  'bg-[#466259] dark:bg-primary/52',
  'bg-primary',
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
    const arr = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const offset = 84 - 1

    for (let i = offset; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
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
      <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted">
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