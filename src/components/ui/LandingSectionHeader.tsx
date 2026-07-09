import type { ReactNode } from 'react'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingSectionIntroClass, landingSectionTitleClass } from '@/lib/landingTypography'
import { cn } from '@/lib/utils'

type LandingSectionHeaderProps = {
  badge: string
  title: ReactNode
  description?: ReactNode
  centered?: boolean
  className?: string
  badgeClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export default function LandingSectionHeader({
  badge,
  title,
  description,
  centered = false,
  className,
  badgeClassName,
  titleClassName,
  descriptionClassName,
}: LandingSectionHeaderProps) {
  return (
    <div className={cn(centered && 'text-center', className)}>
      <SectionBadge label={badge} className={cn(centered && 'mx-auto', badgeClassName)} />
      <h2 className={cn('mt-8', landingSectionTitleClass, centered && 'mx-auto', titleClassName)}>
        {title}
      </h2>
      {description ? (
        <p className={cn(descriptionClassName ?? landingSectionIntroClass, centered && 'mx-auto')}>
          {description}
        </p>
      ) : null}
    </div>
  )
}
