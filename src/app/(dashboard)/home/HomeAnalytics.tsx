'use client'

import { useEffect, useRef } from 'react'
import { ANALYTICS_EVENT, trackEvent } from '@/lib/analytics'

/**
 * Home is a server component, so streak state cannot emit an event from where it is computed.
 * This carries it across the boundary and fires once per mount, guarded so a re-render or a
 * realtime refresh does not inflate the count.
 */
export default function HomeAnalytics({
  streakStatus,
  longestStreak,
}: {
  streakStatus: 'normal' | 'risk' | 'lost'
  longestStreak: number
}) {
  const emitted = useRef(false)

  useEffect(() => {
    if (emitted.current || streakStatus !== 'lost') return
    emitted.current = true
    trackEvent(ANALYTICS_EVENT.STREAK_BROKEN, { longestStreak })
  }, [streakStatus, longestStreak])

  return null
}
