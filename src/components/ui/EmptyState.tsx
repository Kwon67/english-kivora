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

const stateSpacing: Record<EmptyStateVariant, string> = {
  default: 'p-6 sm:p-8',
  compact: 'p-4 sm:p-5',
  glass: 'p-6 sm:p-8',
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
  const approvedScene = /^\/images\/mindmarket\/(discovery|memory|conversation)\.png$/.test(imageSrc)
  return (
    <div
      className={`${cardClass} refined-empty-state flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left ${stateSpacing[variant]} ${className}`}
    >
      <div
        className={`grid w-28 shrink-0 place-items-center rounded-2xl bg-bg-primary p-3 sm:w-32 ${imageWrapClassName}`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={approvedScene ? 1536 : 849}
          height={approvedScene ? 1024 : 842}
          unoptimized
          className={`mx-auto h-auto w-full object-contain max-h-24 ${imageClassName}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        {badge ? (
          <SectionBadge label={badge} className="mx-auto sm:mx-0" />
        ) : null}
        <h3
          className={`text-xl font-medium leading-tight text-brand-dark sm:text-2xl ${badge ? 'mt-2' : ''}`}
        >
          {title}
        </h3>
        <p className="mx-auto mt-2 max-w-md sm:mx-0 font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
          {description}
        </p>
        {(actionHref && actionLabel) || children ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {actionHref && actionLabel ? (
              <Link
                href={actionHref}
                transitionTypes={transitionTypes}
                className={primaryBtn}
              >
                {ActionIcon ? (
                  <ActionIcon className="h-4 w-4" strokeWidth={1.75} />
                ) : null}
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
