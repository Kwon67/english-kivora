'use client'

import { useEffect } from 'react'
import { identifyUser, initAnalytics, isAnalyticsEnabled, resetAnalytics } from '@/lib/analytics'

/**
 * Boots analytics and keeps the identified user in sync with the Supabase session.
 *
 * Identification is by user id only — the auth listener deliberately passes no email or
 * username, so the analytics backend never holds a way to name a learner.
 */
export default function AnalyticsProvider() {
  useEffect(() => {
    if (!isAnalyticsEnabled()) return
    initAnalytics()

    let disposed = false
    let unsubscribe: (() => void) | undefined
    let authRevision = 0
    let identifiedUser: string | undefined

    const identify = (id: string) => {
      if (identifiedUser === id) return
      identifiedUser = id
      identifyUser(id)
    }

    void import('@/lib/supabase/client').then(({ createClient }) => {
      if (disposed) return
      const supabase = createClient()

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          authRevision++
          identifiedUser = undefined
          resetAnalytics()
        } else if (session?.user) {
          authRevision++
          identify(session.user.id)
        }
      })
      unsubscribe = () => subscription.unsubscribe()

      const revision = authRevision
      return supabase.auth.getUser().then(({ data }) => {
        if (!disposed && revision === authRevision && data.user) identify(data.user.id)
      })
    }).catch(() => {
      // Analytics must not block the application if the optional client cannot load.
    })

    return () => {
      disposed = true
      unsubscribe?.()
    }
  }, [])

  return null
}
