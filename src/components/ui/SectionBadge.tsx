const softKicker =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'

const squareClass = 'inline-block h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent'
const lineClass = 'section-badge-line inline-block h-px w-8 bg-brand-dark/60'

interface SectionBadgeProps {
  label: string
  className?: string
  animate?: boolean
}

export default function SectionBadge({ label, className = '' }: SectionBadgeProps) {
  return (
    <div className={`flex w-fit items-center ${className}`}>
      <span className={squareClass} aria-hidden="true" />
      <span className={lineClass} aria-hidden="true" />
      <span className={softKicker}>{label}</span>
      <span className={lineClass} aria-hidden="true" />
      <span className={squareClass} aria-hidden="true" />
    </div>
  )
}
