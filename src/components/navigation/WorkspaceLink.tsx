'use client'

import Link, { useLinkStatus } from 'next/link'
import type { ComponentProps } from 'react'

function PendingIndicator() {
  const { pending } = useLinkStatus()
  return pending ? <span className="workspace-link-pending" role="status"><span className="sr-only">Abrindo área</span></span> : null
}

/** Keeps route navigation in the App Router and supplies immediate local feedback. */
export default function WorkspaceLink({ children, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props}>{children}<PendingIndicator /></Link>
}
