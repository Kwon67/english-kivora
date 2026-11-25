'use client'


interface BrandMarkProps {
  className?: string
  compact?: boolean
  showSubtitle?: boolean
  subtitle?: string
  subtitleClassName?: string
  tone?: 'default' | 'light'
}

export default function BrandMark({
  className = '',
  compact = false,
  showSubtitle = true,
  subtitle = 'Plataforma de aprendizado de inglês',
  subtitleClassName = '',
  tone = 'default',
}: BrandMarkProps) {
  const isLight = tone === 'light'
  const titleTone = isLight ? 'text-white' : 'text-brand-dark'
  const subtitleTone = isLight ? 'text-white/70' : 'text-brand-secondary'

  return (
    <div className={`flex items-center gap-2.5 ${className}`.trim()}>
      <svg aria-hidden="true" viewBox="0 0 40 40" fill="none" className={`h-9 w-9 shrink-0 ${titleTone}`}><path d="M7 7v26m5-13L29 7M12 20l17 13" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /><circle cx="32" cy="20" r="4" fill="var(--brand-highlight)" /></svg>

      {!compact && (
        <div className="min-w-0">
          <div
            className={`truncate font-heading text-2xl font-medium tracking-[-0.06em] ${titleTone}`}
          >
            kivora<span className="text-[var(--brand-highlight)]">.</span>
          </div>
          {showSubtitle && subtitle ? (
            <div
              className={`hidden sm:block truncate text-[11px] font-medium ${subtitleClassName} ${subtitleTone}`}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
