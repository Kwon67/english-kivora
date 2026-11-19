'use client'

import { useTransition } from 'react'
import RouteFailure from '@/components/ui/RouteFailure'

export default function HistoryError({ retry }: { retry: () => void }) {
  const [isRetrying, startTransition] = useTransition()

  function retryHistory() {
    if (isRetrying) return
    startTransition(retry)
  }

  return <RouteFailure reset={retryHistory} retryPending={isRetrying} />
}
