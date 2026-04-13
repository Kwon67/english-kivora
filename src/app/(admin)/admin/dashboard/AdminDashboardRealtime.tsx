'use client'

import { useEffect, useRef, useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REFRESH_DEBOUNCE_MS = 300
const SUBSCRIBE_TIMEOUT_MS = 15_000
const RECONNECT_BASE_DELAY_MS = 1_000
const RECONNECT_MAX_DELAY_MS = 10_000

type RealtimeStatus = 'connecting' | 'live' | 'offline'
type BrowserSupabaseClient = ReturnType<typeof createClient>
type BrowserRealtimeChannel = ReturnType<BrowserSupabaseClient['channel']>

export default function AdminDashboardRealtime() {
  const router = useRouter()
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const connectAttemptRef = useRef(0)
  const channelRef = useRef<BrowserRealtimeChannel | null>(null)
  const statusRef = useRef<RealtimeStatus>('connecting')
  const [status, setStatus] = useState<RealtimeStatus>('connecting')

  useEffect(() => {
    const supabase = createClient()
    let isUnmounted = false

    function setConnectionStatus(nextStatus: RealtimeStatus) {
      statusRef.current = nextStatus
      setStatus(nextStatus)
    }

    function clearRefreshTimer() {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }

    function clearReconnectTimer() {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }

    function scheduleRefresh() {
      clearRefreshTimer()

      refreshTimeoutRef.current = setTimeout(() => {
        startTransition(() => {
          router.refresh()
        })
      }, REFRESH_DEBOUNCE_MS)
    }

    function cleanupChannel() {
      const currentChannel = channelRef.current
      if (!currentChannel) return

      channelRef.current = null
      void supabase.removeChannel(currentChannel)
    }

    function scheduleReconnect() {
      clearReconnectTimer()
      reconnectAttemptsRef.current += 1

      const delay = Math.min(
        RECONNECT_BASE_DELAY_MS * 2 ** (reconnectAttemptsRef.current - 1),
        RECONNECT_MAX_DELAY_MS
      )

      reconnectTimeoutRef.current = setTimeout(() => {
        void connect()
      }, delay)
    }

    async function connect() {
      if (isUnmounted) return

      const attemptId = connectAttemptRef.current + 1
      connectAttemptRef.current = attemptId

      clearReconnectTimer()
      cleanupChannel()
      setConnectionStatus('connecting')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (isUnmounted || connectAttemptRef.current !== attemptId) return

      if (!session?.access_token) {
        setConnectionStatus('offline')
        scheduleReconnect()
        return
      }

      await supabase.realtime.setAuth(session.access_token)

      if (isUnmounted || connectAttemptRef.current !== attemptId) return

      const channel = supabase
        .channel('admin-dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, scheduleRefresh)
        .subscribe((nextStatus, err) => {
          if (isUnmounted || connectAttemptRef.current !== attemptId || channelRef.current !== channel) return

          if (nextStatus === 'SUBSCRIBED') {
            reconnectAttemptsRef.current = 0
            setConnectionStatus('live')
            scheduleRefresh()
            return
          }

          if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT' || nextStatus === 'CLOSED') {
            setConnectionStatus('offline')

            if (err) {
              console.error('[AdminDashboardRealtime]', nextStatus, err.message)
            }

            scheduleReconnect()
          }
        }, SUBSCRIBE_TIMEOUT_MS)

      if (isUnmounted || connectAttemptRef.current !== attemptId) {
        void supabase.removeChannel(channel)
        return
      }

      channelRef.current = channel
    }

    void connect()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isUnmounted) return

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        void supabase.realtime.setAuth(session?.access_token ?? null)

        if (statusRef.current !== 'live') {
          reconnectAttemptsRef.current = 0
          void connect()
        }

        return
      }

      if (event === 'SIGNED_OUT') {
        connectAttemptRef.current += 1
        clearReconnectTimer()
        cleanupChannel()
        setConnectionStatus('offline')
      }
    })

    const handleOnline = () => {
      reconnectAttemptsRef.current = 0
      void connect()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && statusRef.current !== 'live') {
        reconnectAttemptsRef.current = 0
        void connect()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isUnmounted = true
      connectAttemptRef.current += 1
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearReconnectTimer()
      cleanupChannel()
      clearRefreshTimer()
    }
  }, [router])

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/72 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          status === 'live'
            ? 'bg-[var(--color-primary)] shadow-[0_0_0_4px_rgba(43,122,11,0.16)]'
            : status === 'connecting'
              ? 'bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]'
              : 'bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.16)]'
        }`}
      />
      {status === 'live' ? 'Ao vivo' : status === 'connecting' ? 'Conectando' : 'Offline'}
    </div>
  )
}
