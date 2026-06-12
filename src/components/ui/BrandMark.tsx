'use client'

import Image from 'next/image'

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
  subtitle = 'Plataforma de aprendizado de inglês',
  subtitleClassName = '',
  tone = 'default',
}: BrandMarkProps) {
  const isLight = tone === 'light'
  const titleTone = isLight ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-text)]'
  const subtitleTone = isLight ? 'text-[var(--color-on-primary)]/70' : 'text-[var(--color-text-subtle)]'

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
            className={`truncate font-[family:var(--font-display)] text-[1.08rem] font-bold tracking-[-0.05em] ${titleTone}`}
          >
            Kivora Inglês
          </div>
          <div
            className={`hidden sm:block truncate text-[10px] font-semibold uppercase tracking-[0.22em] ${subtitleClassName} ${subtitleTone}`}
          >
            {subtitle}
          </div>
        </div>
      )}
    </div>
  )
}
