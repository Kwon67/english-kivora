import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  count: number
}

export default function StreakBadge({ count }: StreakBadgeProps) {
  if (count <= 0) return null

  return (
    <div className="animate-pop-in inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm text-indigo-500">
        <Flame className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <div className="leading-tight">
        <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Streak</p>
        <p className="font-bold">
          {count} dia{count > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
