'use client'

import Image from 'next/image'

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
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <Image
        aria-hidden="true"
        src="/brand/kivora-mark.png"
        alt=""
        className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
        width="40"
        height="40"
      />

      {!compact && (
        <div className="min-w-0">
          <div
            className={`truncate font-heading text-[1.08rem] font-bold ${titleTone}`}
          >
            Kivora Inglês
          </div>
          {showSubtitle && subtitle ? (
            <div
              className={`hidden sm:block truncate text-[10px] font-semibold uppercase tracking-[0.22em] ${subtitleClassName} ${subtitleTone}`}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
