import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { ghostBtn } from '@/features/admin/lib/adminUi'

type BreadcrumbItem = { label: string; href?: string }
interface AdminSectionHeaderProps {
  breadcrumb: BreadcrumbItem[]
  accentLabel?: string
  title: string
  description: string
  illustration?: 'review' | 'conversation'
  action?: ReactNode
  metadata?: ReactNode
  links?: ReactNode
  anchorHref?: string
  anchorLabel?: string
  anchorIcon?: LucideIcon
}

export default function AdminSectionHeader({
  breadcrumb,
  accentLabel,
  title,
  description,
  illustration,
  action,
  metadata,
  links,
  anchorHref,
  anchorLabel,
  anchorIcon: AnchorIcon,
}: AdminSectionHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-header-context">
        <StudyBreadcrumb items={breadcrumb} />
      </div>
      <div className="admin-page-header-row">
        <div className="admin-header-story">
          <div className="min-w-0">
            <h1>{title}</h1>
            <p className="admin-page-description">{description}</p>
          </div>
          {illustration && <Image
            src={`/images/workspace/${illustration}.webp`}
            alt=""
            width={768}
            height={512}
            className="admin-header-illustration"
          />}
        </div>
        {action ? <div className="admin-page-action">{action}</div> : null}
      </div>
      {accentLabel || metadata || links || (anchorHref && anchorLabel) ? (
        <div className="admin-page-toolbar">
          <div className="flex flex-wrap items-center gap-2">
            {accentLabel ? (
              <span className="admin-context-pill">{accentLabel}</span>
            ) : null}
            {metadata}
          </div>
          <div className="admin-toolbar-actions">
            {anchorHref && anchorLabel ? (
              <a href={anchorHref} className={ghostBtn}>
                {AnchorIcon ? <AnchorIcon className="h-4 w-4" /> : null}
                {anchorLabel}
              </a>
            ) : null}
            {links}
          </div>
        </div>
      ) : null}
    </header>
  )
}
