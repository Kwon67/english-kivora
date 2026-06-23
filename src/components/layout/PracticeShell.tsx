import type { ReactNode } from 'react'
import { practiceBgGlow, practiceBgGrid, practiceShell } from '@/lib/practiceUi'

export default function PracticeShell({
  children,
  className = '',
  maxWidthClass = 'max-w-5xl',
}: {
  children: ReactNode
  className?: string
  maxWidthClass?: string
}) {
  return (
    <div className={`${practiceShell} ${className}`.trim()}>
      <div className={practiceBgGrid} />
      <div className={practiceBgGlow} />
      <div className={`relative z-10 mx-auto ${maxWidthClass}`}>{children}</div>
    </div>
  )
}