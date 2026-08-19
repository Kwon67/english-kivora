'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { identifyUser, initAnalytics, resetAnalytics } from '@/lib/analytics'

/**
 * Boots analytics and keeps the identified user in sync with the Supabase session.
 *
 * Identification is by user id only — the auth listener deliberately passes no email or
 * username, so the analytics backend never holds a way to name a learner.
 */
export default function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics()

    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) identifyUser(data.user.id)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Otherwise the next person on a shared device inherits the previous distinct_id.
        resetAnalytics()
        return
      }
      if (session?.user) identifyUser(session.user.id)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  return null
}
