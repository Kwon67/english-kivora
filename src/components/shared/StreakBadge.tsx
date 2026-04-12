import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  count: number
}

export default function StreakBadge({ count }: StreakBadgeProps) {
  if (count <= 0) return null

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.82))] px-4 py-2 text-sm font-semibold text-orange-700 shadow-[0_18px_36px_-28px_rgba(234,88,12,0.55)]">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
        <Flame className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] uppercase tracking-[0.2em] text-orange-500">Streak</span>
        <span className="font-bold text-orange-700">
          {count} dia{count > 1 ? 's' : ''}
        </span>
      </span>
    </div>
  )
}
