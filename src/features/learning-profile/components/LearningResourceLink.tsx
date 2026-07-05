'use client'

import Link from 'next/link'
import { useTransition, type ReactNode } from 'react'
import { recordLearningResourceEvent } from '@/app/learning-resource-actions'
import type { LearningFocus, LearningProfileRecommendation } from '@/features/learning-profile/lib/learningProfile'
import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

type LearningResourceLinkProps = {
  resource: LearningProfileRecommendation
  stage: LearningFocus
  level: LearnerCefrLevel | null
  className: string
  children: ReactNode
}

export default function LearningResourceLink({
  resource,
  stage,
  level,
  className,
  children,
}: LearningResourceLinkProps) {
  const [, startTransition] = useTransition()

  function trackOpen() {
    startTransition(() => {
      void recordLearningResourceEvent({
        resourceId: resource.id,
        eventType: 'open',
        stage,
        level: resource.level ?? level,
        resourceKind: resource.kind ?? null,
        resourceTitle: resource.title,
        resourceUrl: resource.href,
      })
    })
  }

  if (resource.external) {
    return (
      <a
        href={resource.href}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={trackOpen}
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      href={resource.href}
      transitionTypes={navForwardTransitionTypes}
      prefetch={false}
      className={className}
      onClick={trackOpen}
    >
      {children}
    </Link>
  )
}
