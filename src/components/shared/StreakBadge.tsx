import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  count: number
}

export default function StreakBadge({ count }: StreakBadgeProps) {
  if (count <= 0) return null

  return (
    <div className="badge bg-orange-50 text-orange-600 border border-orange-200 py-1.5 px-3">
      <Flame className="w-4 h-4" strokeWidth={2.5} />
      <span className="font-bold">{count} dia{count > 1 ? 's' : ''}</span>
    </div>
  )
}
