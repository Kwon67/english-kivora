'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { HOME_NOTICE_MESSAGES, HOME_RESYNC_SEARCH_PARAMS } from '@/lib/homeNotices'
import { notify } from '@/lib/toast'

export default function HomeNotice() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const notice = searchParams.get('notice')
    const hasResyncParam = HOME_RESYNC_SEARCH_PARAMS.some((key) => searchParams.get(key))

    if (notice) {
      const entry = HOME_NOTICE_MESSAGES[notice]
      if (entry) {
        if (entry.type === 'success') {
          notify.success(entry.message)
        } else {
          notify.error(entry.message)
        }
      }
    }

    if (!notice && !hasResyncParam) return

    // history.replaceState instead of router.replace: navigating to `/home` would
    // restore the client cache from before the lesson, and the current path node
    // would snap back. This only cleans the one-shot query string.
    const url = new URL(window.location.href)
    url.searchParams.delete('notice')
    for (const key of HOME_RESYNC_SEARCH_PARAMS) url.searchParams.delete(key)
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [searchParams])

  return null
}
