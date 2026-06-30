import type { HTMLAttributes, ReactNode } from 'react'

type LandingSectionFrameProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  className?: string
  innerClassName?: string
  band?: 'default' | 'soft' | 'plain'
  connector?: boolean
}

export default function LandingSectionFrame({
  children,
  className = '',
  innerClassName = '',
  band = 'default',
  connector = false,
  ...props
}: LandingSectionFrameProps) {
  const bandClass =
    band === 'soft'
      ? 'bg-bg-card/72'
      : band === 'plain'
        ? 'bg-transparent'
        : 'bg-bg-primary/72'

  return (
    <section className={`landing-section-frame relative px-4 py-16 sm:px-6 lg:px-8 ${bandClass} ${className}`} {...props}>
      {connector && <Connector />}
      <div className={`relative z-10 mx-auto max-w-6xl ${innerClassName}`}>{children}</div>
    </section>
  )
}

export function Connector() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 z-0 hidden h-10 -translate-x-1/2 sm:block">
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-brand-dark/12" />
      <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-[2px] border border-brand-dark bg-brand-accent" />
    </div>
  )
}
