'use client'

import type { ReactNode } from 'react'
import { blitzBgGlow, blitzBgGrid, blitzShell } from '@/features/blitz/lib/blitzUi'

export default function BlitzShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`${blitzShell} ${className}`.trim()}>
      {blitzBgGrid ? <div className={blitzBgGrid} /> : null}
      {blitzBgGlow ? <div className={blitzBgGlow} /> : null}
      <div className="relative z-10 mx-auto max-w-5xl">{children}</div>
    </div>
  )
}
