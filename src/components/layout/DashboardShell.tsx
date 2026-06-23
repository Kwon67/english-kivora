import type { ReactNode } from 'react'
import {
  dashboardBgGlow,
  dashboardBgGlowExplore,
  dashboardBgGrid,
  dashboardBgGridExplore,
  dashboardShell,
  dashboardShellExplore,
} from '@/lib/dashboardUi'

type DashboardShellVariant = 'default' | 'explore'

export default function DashboardShell({
  children,
  variant = 'default',
  className = '',
  maxWidthClass = 'max-w-6xl',
}: {
  children: ReactNode
  variant?: DashboardShellVariant
  className?: string
  maxWidthClass?: string
}) {
  const shell = variant === 'explore' ? dashboardShellExplore : dashboardShell
  const grid = variant === 'explore' ? dashboardBgGridExplore : dashboardBgGrid
  const glow = variant === 'explore' ? dashboardBgGlowExplore : dashboardBgGlow

  return (
    <div className={`${shell} ${className}`.trim()}>
      <div className={grid} />
      <div className={glow} />
      <div className={`relative z-10 mx-auto ${maxWidthClass}`}>{children}</div>
    </div>
  )
}