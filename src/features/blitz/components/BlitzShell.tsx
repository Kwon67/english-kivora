'use client'

import type { ReactNode } from 'react'
import PracticeShell from '@/components/layout/PracticeShell'

export default function BlitzShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <PracticeShell className={className}>{children}</PracticeShell>
}