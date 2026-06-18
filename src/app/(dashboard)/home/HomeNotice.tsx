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

    const message = HOME_NOTICE_MESSAGES[notice]
    if (message) {
      notify.error(message)
    }

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('notice')
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `/home?${nextQuery}` : '/home', { scroll: false })
  }, [router, searchParams])

  return null
}