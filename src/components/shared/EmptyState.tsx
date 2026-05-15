'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ComponentProps, ComponentType, ReactNode } from 'react'

type EmptyStateVariant = 'default' | 'compact' | 'arena'
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
  default: 'premium-card p-8 text-center sm:p-10',
  compact: 'rounded-[0.85rem] bg-[var(--color-surface-container-low)] p-6 text-center',
  arena:
    'rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-6 text-center',
}

const imageClasses: Record<EmptyStateVariant, string> = {
  default: 'max-w-44',
  compact: 'max-w-32',
  arena: 'max-w-40',
}

const titleClasses: Record<EmptyStateVariant, string> = {
  default: 'mt-5 text-2xl font-bold text-[var(--color-text)] sm:text-3xl',
  compact: 'mt-4 text-lg font-bold text-[var(--color-text)]',
  arena: 'mt-5 text-xl font-black text-[var(--color-text)]',
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
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
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
