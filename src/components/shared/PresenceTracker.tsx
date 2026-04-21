'use client'

import { useEffect, useRef } from 'react'
import type { RealtimeChannel, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  resetPresenceStore,
  setPresenceOnlineUserIds,
  setPresenceStatus,
} from '@/store/presenceStore'

const PRESENCE_TOPIC = 'member-home-realtime'

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

export default function PresenceTracker() {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const trackedUserIdRef = useRef<string | null>(null)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

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
          await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', nextUserId)
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
        await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', nextUserId)
      }, 30000)
    }

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!mounted) return

      await syncPresence(session)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncPresence(session)
    })

    return () => {
      mounted = false
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
  }, [])

  return null
}
