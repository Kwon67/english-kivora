'use client'

import { useEffect, useRef } from 'react'
import type { RealtimeChannel, Session } from '@supabase/supabase-js'
import {
  resetPresenceStore,
  setPresenceOnlineUserIds,
  setPresenceStatus,
} from '@/store/presenceStore'

const PRESENCE_TOPIC = 'member-home-realtime'

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  cancelIdleCallback?: (handle: number) => void
}

function scheduleAfterInitialPaint(callback: () => void) {
  const win = window as WindowWithIdleCallback
  let cancelled = false
  let idleHandle: number | null = null
  let timeoutHandle: number | null = null

  const run = () => {
    if (cancelled) return

    if (win.requestIdleCallback) {
      idleHandle = win.requestIdleCallback(() => {
        if (!cancelled) callback()
      }, { timeout: 2500 })
      return
    }

    timeoutHandle = window.setTimeout(() => {
      if (!cancelled) callback()
    }, 900)
  }

  if (document.readyState === 'complete') {
    run()
  } else {
    window.addEventListener('load', run, { once: true })
  }

  return () => {
    cancelled = true
    window.removeEventListener('load', run)

    if (idleHandle !== null && win.cancelIdleCallback) {
      win.cancelIdleCallback(idleHandle)
    }

    if (timeoutHandle !== null) {
      window.clearTimeout(timeoutHandle)
    }
  }
}

function extractOnlineUserIds(state: Record<string, { user_id?: string }[]>) {
  const onlineUserIds = new Set<string>()

  for (const presences of Object.values(state)) {
    for (const presence of presences) {
      if (presence.user_id) {
        onlineUserIds.add(presence.user_id)
      }
    }
  }

  return Array.from(onlineUserIds)
}

function syncLastSeen() {
  return fetch('/api/presence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '{}',
    keepalive: true,
  }).catch(() => null)
}

export default function PresenceTracker() {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const trackedUserIdRef = useRef<string | null>(null)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let mounted = true
    let cleanupClient: (() => void) | null = null

    const cancelScheduledStart = scheduleAfterInitialPaint(() => {
      void (async () => {
        const { createClient } = await import('@/lib/supabase/client')
        if (!mounted) return

        const supabase = createClient()
        cleanupClient = () => {
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current)
            heartbeatIntervalRef.current = null
          }

          const currentChannel = channelRef.current
          channelRef.current = null
          trackedUserIdRef.current = null
          resetPresenceStore()

          if (currentChannel) {
            void supabase.removeChannel(currentChannel)
          }
        }

        async function cleanupChannel() {
          const currentChannel = channelRef.current
          channelRef.current = null
          trackedUserIdRef.current = null
          setPresenceOnlineUserIds([])

          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current)
            heartbeatIntervalRef.current = null
          }

          if (currentChannel) {
            await supabase.removeChannel(currentChannel)
          }
        }

        async function syncPresence(session: Session | null) {
          const nextUserId = session?.user.id ?? null

          await supabase.realtime.setAuth(session?.access_token ?? null)
          if (!mounted) return

          if (!nextUserId) {
            await cleanupChannel()
            resetPresenceStore('signed_out')
            return
          }

          if (channelRef.current && trackedUserIdRef.current === nextUserId) {
            return
          }

          await cleanupChannel()
          if (!mounted) return

          setPresenceStatus('connecting')
          trackedUserIdRef.current = nextUserId

          const channel = supabase.channel(PRESENCE_TOPIC, {
            config: { presence: { key: nextUserId } },
          })
          channelRef.current = channel

          channel.on('presence', { event: 'sync' }, () => {
            if (!mounted || channelRef.current !== channel) return

            setPresenceOnlineUserIds(
              extractOnlineUserIds(
                channel.presenceState() as Record<string, { user_id?: string }[]>
              )
            )
            setPresenceStatus('live')
          })

          channel.subscribe(async (status) => {
            if (!mounted || channelRef.current !== channel) return

            if (status === 'SUBSCRIBED') {
              const response = await channel.track({ user_id: nextUserId })
              if (response !== 'ok') {
                setPresenceStatus('connecting')
              }
              // Update last_seen_at in profiles to mark user as online
              await syncLastSeen()
              return
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setPresenceStatus('connecting')
              return
            }

            if (status === 'CLOSED') {
              setPresenceOnlineUserIds([])
              setPresenceStatus('connecting')
            }
          })

          // Periodic heartbeat to keep last_seen_at fresh (every 30 seconds)
          heartbeatIntervalRef.current = setInterval(async () => {
            if (!mounted || channelRef.current !== channel) return
            if (document.visibilityState !== 'visible') return
            await syncLastSeen()
          }, 30000)
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!mounted) return

        await syncPresence(session)
        if (!mounted) return

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          void syncPresence(session)
        })

        cleanupClient = () => {
          subscription.unsubscribe()
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current)
            heartbeatIntervalRef.current = null
          }

          const currentChannel = channelRef.current
          channelRef.current = null
          trackedUserIdRef.current = null
          resetPresenceStore()

          if (currentChannel) {
            void supabase.removeChannel(currentChannel)
          }
        }
      })()
    })

    return () => {
      mounted = false
      cancelScheduledStart()
      cleanupClient?.()
    }
  }, [])

  return null
}
