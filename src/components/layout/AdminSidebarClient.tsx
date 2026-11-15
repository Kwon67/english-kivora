'use client'

import WorkspaceNavigation from '@/components/navigation/WorkspaceNavigation'

/** Rendered only after AdminChrome's existing server-side role check. */
export default function AdminSidebarClient({ username }: { username: string }) {
  return <WorkspaceNavigation username={username} isAdmin workspace="admin" />
}
