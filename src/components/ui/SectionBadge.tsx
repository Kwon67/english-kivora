interface SectionBadgeProps {
  label: string
  className?: string
  animate?: boolean
}

export default function SectionBadge({
  label,
  className = '',
}: SectionBadgeProps) {
  return (
    <div className={`premium-eyebrow ${className}`}>
      {label}
    </div>
  )
}
