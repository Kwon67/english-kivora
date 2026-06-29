type SectionBadgeProps = {
  label: string
  className?: string
}

export default function SectionBadge({ label, className = '' }: SectionBadgeProps) {
  return (
    <div className={`mx-auto flex w-fit items-center ${className}`}>
      <span className="h-2 w-2 rounded-[2px] border border-brand-dark bg-brand-accent" />
      <span className="h-px w-10 bg-brand-dark/55" />
      <span className="rounded-full border border-brand-border bg-bg-primary px-4 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
        {label}
      </span>
      <span className="h-px w-10 bg-brand-dark/55" />
      <span className="h-2 w-2 rounded-[2px] border border-brand-dark bg-brand-accent" />
    </div>
  )
}
