'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HOME_NOTICE_MESSAGES } from '@/lib/homeNotices'
import { notify } from '@/lib/toast'

export default function HomeNotice() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const notice = searchParams.get('notice')
    if (!notice) return

    const entry = HOME_NOTICE_MESSAGES[notice]
    if (entry) {
      if (entry.type === 'success') {
        notify.success(entry.message)
      } else {
        notify.error(entry.message)
      }
    }

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('notice')
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `/home?${nextQuery}` : '/home', { scroll: false })
  }, [router, searchParams])

  return null
}