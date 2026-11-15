import type { ComponentPropsWithoutRef } from 'react'
import MotionSurface from '@/components/motion/MotionSurface'

type SectionProps = ComponentPropsWithoutRef<'section'> & { stagger?: boolean }

export function MotionSection({
  stagger,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section {...props}>
      <MotionSurface stagger={stagger} onScroll className={className}>
        {children}
      </MotionSurface>
    </section>
  )
}

export function MotionItem({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return <div className={`min-w-0 ${className ?? ''}`} {...props} />
}
