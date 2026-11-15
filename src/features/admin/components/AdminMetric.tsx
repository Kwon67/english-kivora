import { Card } from '@/components/shadcn/card'
import type { LucideIcon } from 'lucide-react'
import type { LearningTone, StatusTone } from '@/lib/learningTones'

export default function AdminMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone: LearningTone | StatusTone
}) {
  return (
    <Card unstyled className="admin-metric-cell" data-tone={tone}>
      <span className="tone-icon" aria-hidden="true">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="admin-metric-label">{label}</p>
        <p className="admin-metric-value">{value}</p>
      </div>
    </Card>
  )
}
