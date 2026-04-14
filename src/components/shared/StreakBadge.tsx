import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  count: number
}

export default function StreakBadge({ count }: StreakBadgeProps) {
  if (count <= 0) return null

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(249,115,22,0.26)] bg-[linear-gradient(135deg,#f97316,#ea580c)] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_36px_-22px_rgba(249,115,22,0.72)]">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.18)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.26)]">
        <Flame className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] uppercase tracking-[0.2em] text-white/85">Streak</span>
        <span className="font-bold text-white">
          {count} dia{count > 1 ? 's' : ''}
        </span>
      </span>
    </div>
  )
}
