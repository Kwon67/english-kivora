'use client'

import { useMemo } from 'react'

interface ActivityHeatmapProps {
  // Map of YYYY-MM-DD strings to activity counts
  activityData: Record<string, number>
}

export default function ActivityHeatmap({ activityData }: ActivityHeatmapProps) {
  // Generate last 84 days (12 weeks * 7 days)
  const days = useMemo(() => {
    const arr = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Find the nearest upcoming Saturday (or today if it's Saturday)
    // To align the grid nicely with 7-day columns ending on Saturday/Sunday
    const offset = 84 - 1 // 12 weeks of data
    
    for (let i = offset; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      arr.push({
        date: dateStr,
        count: activityData[dateStr] || 0
      })
    }
    return arr
  }, [activityData])

  // Group into columns of 7
  const columns = useMemo(() => {
    const cols = []
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7))
    }
    return cols
  }, [days])

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-[var(--color-surface-container)] dark:bg-[var(--color-surface-variant)]'
    if (count <= 20) return 'bg-[#a3c9b7] dark:bg-[#1f4a3e]'
    if (count <= 50) return 'bg-[#73a890] dark:bg-[#2b6b59]'
    if (count <= 100) return 'bg-[#466259] dark:bg-[#388d75]'
    return 'bg-[var(--color-primary)] dark:bg-[#4bc2a2]'
  }

  return (
    <div className="w-full overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="min-w-max flex gap-[3px]">
        {columns.map((col, cIdx) => (
          <div key={`col-${cIdx}`} className="flex flex-col gap-[3px]">
            {col.map((day) => (
              <div 
                key={day.date} 
                title={`${day.count} interações em ${day.date.split('-').reverse().join('/')}`}
                className={`w-[11px] h-[11px] rounded-[2px] transition-colors ${getColorClass(day.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
        <span>Menos</span>
        <div className="flex gap-[3px]">
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[var(--color-surface-container)] dark:bg-[var(--color-surface-variant)]" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#a3c9b7] dark:bg-[#1f4a3e]" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#73a890] dark:bg-[#2b6b59]" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[#466259] dark:bg-[#388d75]" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-[var(--color-primary)] dark:bg-[#4bc2a2]" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  )
}
