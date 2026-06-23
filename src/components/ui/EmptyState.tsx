'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ComponentProps, ComponentType, ReactNode } from 'react'
import { glassTile } from '@/lib/dashboardUi'

type EmptyStateVariant = 'default' | 'compact' | 'glass'
type LinkTransitionTypes = ComponentProps<typeof Link>['transitionTypes']

type EmptyStateProps = {
  imageSrc: string
  imageAlt: string
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  actionIcon?: ComponentType<{ className?: string; strokeWidth?: number }>
  transitionTypes?: LinkTransitionTypes
  variant?: EmptyStateVariant
  className?: string
  imageClassName?: string
  children?: ReactNode
}

const containerClasses: Record<EmptyStateVariant, string> = {
  default:
    'rounded-[32px] border border-border bg-card p-8 text-center shadow-[0_24px_70px_rgba(24,32,29,0.12)] sm:p-10',
  compact: 'rounded-[28px] bg-[var(--color-surface-container-low)] p-6 text-center',
  glass: `${glassTile} border-dashed p-6 text-center sm:p-8`,
}

const imageClasses: Record<EmptyStateVariant, string> = {
  default: 'max-w-44',
  compact: 'max-w-32',
  glass: 'max-w-36',
}

const titleClasses: Record<EmptyStateVariant, string> = {
  default: 'mt-5 text-2xl font-bold text-text sm:text-3xl',
  compact: 'mt-4 text-lg font-bold text-text',
  glass: 'mt-4 text-lg font-bold text-text sm:text-xl',
}

export default function EmptyState({
  imageSrc,
  imageAlt,
  title,
  description,
  actionHref,
  actionLabel,
  actionIcon: ActionIcon,
  transitionTypes,
  variant = 'default',
  className = '',
  imageClassName = '',
  children,
}: EmptyStateProps) {
  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={849}
        height={842}
        unoptimized
        className={`mx-auto h-auto w-full object-contain ${imageClasses[variant]} ${imageClassName}`}
      />
      <h3 className={titleClasses[variant]}>{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
        {description}
      </p>
      {(actionHref && actionLabel) || children ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionHref && actionLabel ? (
            <Link href={actionHref} transitionTypes={transitionTypes} className="btn-primary">
              {ActionIcon ? <ActionIcon className="h-4 w-4" strokeWidth={2.2} /> : null}
              {actionLabel}
            </Link>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  )
}