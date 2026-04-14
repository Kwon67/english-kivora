import { useId } from 'react'

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
  subtitle = 'Daily Fluency Lab',
  subtitleClassName = '',
  tone = 'default',
}: BrandMarkProps) {
  const gradientId = useId().replace(/:/g, '')
  const clipId = useId().replace(/:/g, '')
  const isLight = tone === 'light'

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <svg
        aria-hidden="true"
        className="h-11 w-11 shrink-0 sm:h-12 sm:w-12"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2B7A0B" />
            <stop offset="0.55" stopColor="#1f5f08" />
            <stop offset="1" stopColor="#163c06" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="4" y="4" width="56" height="56" rx="18" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${gradientId})`} />
          <path
            d="M17 23.5C22.833 20.1667 28.333 18.5 33.5 18.5C39.4 18.5 44.5667 20.3333 49 24"
            stroke="white"
            strokeOpacity="0.9"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="49" cy="24" r="3.2" fill="white" fillOpacity="0.95" />
          <path
            d="M15 34.5C21.1667 31.1667 27.6667 29.5 34.5 29.5C40.6333 29.5 45.8 31.0333 50 34.1"
            stroke="white"
            strokeOpacity="0.92"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M18.5 45C23.0333 42.6667 28.0667 41.5 33.6 41.5C38.7333 41.5 43.5333 42.6333 48 44.9"
            stroke="white"
            strokeOpacity="0.82"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {!compact && (
        <div className="min-w-0">
          <div
            className={`truncate font-[family:var(--font-display)] text-[1.18rem] font-semibold tracking-[-0.04em] ${
              isLight ? 'text-white' : 'text-[var(--color-text)]'
            }`}
          >
            Kivora English
          </div>
          <div
            className={`truncate text-[10px] font-semibold uppercase tracking-[0.28em] ${subtitleClassName} ${
              isLight ? 'text-white/65' : 'text-[var(--color-text-subtle)]'
            }`}
          >
            {subtitle}
          </div>
        </div>
      )}
    </div>
  )
}
