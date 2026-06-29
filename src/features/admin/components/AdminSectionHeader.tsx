'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import {
  AdminBadge,
  accentBadge,
  ghostBtn,
  glassTile,
} from '@/features/admin/lib/adminUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

type BreadcrumbItem = {
  label: string
  href?: string
}

interface AdminSectionHeaderProps {
  breadcrumb: BreadcrumbItem[]
  badge: string
  accentLabel?: string
  title: string
  description: string
  action?: ReactNode
  anchorHref?: string
  anchorLabel?: string
  anchorIcon?: LucideIcon
}

export default function AdminSectionHeader({
  breadcrumb,
  badge,
  accentLabel,
  title,
  description,
  action,
  anchorHref,
  anchorLabel,
  anchorIcon: AnchorIcon,
}: AdminSectionHeaderProps) {
  return (
    <header className={`${glassTile} p-6 sm:p-8 lg:p-10`}>
      <div className="mb-5">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={`${ghostBtn} min-h-10`}>
          Início
        </Link>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <StudyBreadcrumb items={breadcrumb} className="mb-4" />
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <AdminBadge label={badge} />
            {accentLabel ? <span className={accentBadge}>{accentLabel}</span> : null}
          </div>
          <h1 className="max-w-2xl font-heading text-3xl font-bold leading-tight tracking-tight text-brand-dark sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            {description}
          </p>
          {anchorHref && anchorLabel ? (
            <div className="mt-6">
              <a href={anchorHref} className={ghostBtn}>
                {AnchorIcon ? <AnchorIcon className="h-4 w-4" /> : null}
                {anchorLabel}
              </a>
            </div>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  )
}