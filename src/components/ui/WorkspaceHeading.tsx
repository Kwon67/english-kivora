import type { ReactNode } from 'react'

type Props = {
  title: string
  breadcrumb?: string
  description?: string
  actions?: ReactNode
  aside?: ReactNode
}

export default function WorkspaceHeading({
  title,
  description,
  actions,
  aside,
}: Props) {
  return (
    <header className="workspace-heading">
      <div className="min-w-0">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {actions && <div className="workspace-heading-actions">{actions}</div>}
      </div>
      {aside}
    </header>
  )
}
