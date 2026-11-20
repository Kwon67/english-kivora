import type { ReactNode } from 'react'
import SpotIllustration, { type SpotMotif } from '@/components/illustrations/SpotIllustration'

type Props = {
  title: string
  breadcrumb?: string
  description?: string
  actions?: ReactNode
  aside?: ReactNode
  ornament?: SpotMotif
}

export default function WorkspaceHeading({
  title,
  description,
  actions,
  aside,
  ornament,
}: Props) {
  return (
    <header className="workspace-heading">
      <div className="min-w-0">
        <h1>
          {title}
          {ornament && <SpotIllustration motif={ornament} className="ml-3 inline-block size-8 align-middle sm:size-10" />}
        </h1>
        {description && <p>{description}</p>}
        {actions && <div className="workspace-heading-actions">{actions}</div>}
      </div>
      {aside}
    </header>
  )
}
