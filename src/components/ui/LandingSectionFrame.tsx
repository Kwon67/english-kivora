import type { HTMLAttributes, ReactNode } from 'react'

type LandingSectionFrameProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  className?: string
  innerClassName?: string
  band?: 'default' | 'soft' | 'plain'
}

export default function LandingSectionFrame({
  children,
  className = '',
  innerClassName = '',
  band = 'default',
  ...props
}: LandingSectionFrameProps) {
  const bandBgClass =
    band === 'soft'
      ? 'bg-bg-card/72'
      : band === 'plain'
        ? ''
        : 'bg-bg-primary/72'

  return (
    <section className={`landing-section-frame relative px-4 py-16 sm:px-6 lg:px-8 ${className}`} {...props}>
      {bandBgClass ? (
        <div aria-hidden className={`pointer-events-none absolute inset-0 z-0 ${bandBgClass}`} />
      ) : null}
      <div className={`relative z-10 mx-auto max-w-6xl ${innerClassName}`}>{children}</div>
    </section>
  )
}
