'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ComponentProps, ComponentType, ReactNode } from 'react'
import SectionBadge from '@/components/ui/SectionBadge'
import { cardClass, primaryBtn } from '@/features/profile/lib/libraryUi'

type EmptyStateVariant = 'default' | 'compact' | 'glass'
type LinkTransitionTypes = ComponentProps<typeof Link>['transitionTypes']

type EmptyStateProps = {
  imageSrc: string
  imageAlt: string
  title: string
  description: string
  badge?: string
  actionHref?: string
  actionLabel?: string
  actionIcon?: ComponentType<{ className?: string; strokeWidth?: number }>
  transitionTypes?: LinkTransitionTypes
  variant?: EmptyStateVariant
  className?: string
  imageClassName?: string
  imageWrapClassName?: string
  children?: ReactNode
}

const containerClasses: Record<EmptyStateVariant, string> = {
  default: `${cardClass} overflow-hidden p-0 text-center shadow-[8px_8px_0_var(--color-brand-dark)]`,
  compact: `${cardClass} p-0 text-center shadow-[4px_4px_0_var(--color-brand-dark)]`,
  glass: `${cardClass} overflow-hidden p-0 text-center shadow-[8px_8px_0_var(--color-brand-dark)]`,
}

const imageWrapClasses: Record<EmptyStateVariant, string> = {
  default: 'border-b-2 border-brand-dark bg-bg-primary px-6 py-8 sm:px-8 sm:py-10',
  compact: 'border-b-2 border-brand-dark bg-bg-primary px-5 py-6',
  glass: 'border-b-2 border-brand-dark bg-bg-primary px-6 py-8 sm:px-8 sm:py-10',
}

const imageClasses: Record<EmptyStateVariant, string> = {
  default: 'max-w-44',
  compact: 'max-w-32',
  glass: 'max-w-40 sm:max-w-44',
}

const bodyClasses: Record<EmptyStateVariant, string> = {
  default: 'p-6 sm:p-8',
  compact: 'p-5 sm:p-6',
  glass: 'p-6 sm:p-8',
}

const titleClasses: Record<EmptyStateVariant, string> = {
  default: 'font-heading text-2xl font-bold leading-tight text-brand-dark sm:text-3xl',
  compact: 'font-heading text-xl font-bold leading-tight text-brand-dark',
  glass: 'font-heading text-2xl font-bold leading-tight text-brand-dark sm:text-3xl',
}

export default function EmptyState({
  imageSrc,
  imageAlt,
  title,
  description,
  badge,
  actionHref,
  actionLabel,
  actionIcon: ActionIcon,
  transitionTypes,
  variant = 'default',
  className = '',
  imageClassName = '',
  imageWrapClassName = '',
  children,
}: EmptyStateProps) {
  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <div className={`${imageWrapClasses[variant]} ${imageWrapClassName}`}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={849}
          height={842}
          unoptimized
          className={`mx-auto h-auto w-full object-contain ${imageClasses[variant]} ${imageClassName}`}
        />
      </div>

      <div className={bodyClasses[variant]}>
        {badge ? <SectionBadge label={badge} className="mx-auto" /> : null}
        <h3 className={`${titleClasses[variant]} ${badge ? 'mt-5' : ''}`}>{title}</h3>
        <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
          {description}
        </p>
        {(actionHref && actionLabel) || children ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {actionHref && actionLabel ? (
              <Link href={actionHref} transitionTypes={transitionTypes} className={primaryBtn}>
                {ActionIcon ? <ActionIcon className="h-4 w-4" strokeWidth={2.2} /> : null}
                {actionLabel}
              </Link>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}
