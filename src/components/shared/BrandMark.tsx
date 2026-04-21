'use client'

interface BrandMarkProps {
  className?: string
  compact?: boolean
  subtitle?: string
  subtitleClassName?: string
  tone?: 'default' | 'light'
}

export default function BrandMark({
  className = '',
  compact = false,
  subtitle = 'English Learning Platform',
  subtitleClassName = '',
  tone = 'default',
}: BrandMarkProps) {
  const isLight = tone === 'light'
  const iconBackground = isLight ? 'rgba(255,255,255,0.14)' : '#eef2ec'
  const iconStroke = isLight ? '#f8faf6' : '#466259'
  const iconAccent = isLight ? '#ffdf96' : '#735802'
  const titleTone = isLight ? 'text-white' : 'text-[var(--color-text)]'
  const subtitleTone = isLight ? 'text-white/70' : 'text-[var(--color-text-subtle)]'

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <svg
        aria-hidden="true"
        className="h-10 w-10 shrink-0 sm:h-11 sm:w-11"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '40px', height: '40px' }}
      >
        <circle cx="32" cy="32" r="28" fill={iconBackground} />
        <path d="M22 17V47" stroke={iconStroke} strokeWidth="5" strokeLinecap="round" />
        <path d="M25.5 32L41.5 17.5" stroke={iconStroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M25.5 32L42 46.5" stroke={iconStroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="46.5" cy="18" r="3.2" fill={iconAccent} />
      </svg>

      {!compact && (
        <div className="min-w-0">
          <div
            className={`truncate font-[family:var(--font-display)] text-[1.08rem] font-bold tracking-[-0.05em] ${titleTone}`}
          >
            Kivora English
          </div>
          <div
            className={`truncate text-[10px] font-semibold uppercase tracking-[0.22em] ${subtitleClassName} ${subtitleTone}`}
          >
            {subtitle}
          </div>
        </div>
      )}
    </div>
  )
}
