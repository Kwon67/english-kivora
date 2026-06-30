'use client'

import type { ReactNode } from 'react'
import { blitzShell } from '@/features/blitz/lib/blitzUi'

export default function BlitzShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`${blitzShell} ${className}`.trim()}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-5xl">{children}</div>
    </div>
  )
}