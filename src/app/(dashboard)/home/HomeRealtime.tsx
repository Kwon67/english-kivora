'use client'

import { useEffect, useRef, useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REFRESH_DEBOUNCE_MS = 250
const FALLBACK_REFRESH_INTERVAL_MS = 10 * 60_000
const SUBSCRIBE_TIMEOUT_MS = 15_000
const RECONNECT_BASE_DELAY_MS = 1_000
const RECONNECT_MAX_DELAY_MS = 10_000

type SyncStatus = 'connecting' | 'live' | 'offline'
type BrowserSupabaseClient = ReturnType<typeof createClient>
type BrowserRealtimeChannel = ReturnType<BrowserSupabaseClient['channel']>

export default function HomeRealtime() {
  const router = useRouter()
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const connectAttemptRef = useRef(0)
  const channelRef = useRef<BrowserRealtimeChannel | null>(null)
  const statusRef = useRef<SyncStatus>('connecting')
  const [status, setStatus] = useState<SyncStatus>('connecting')
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let isUnmounted = false

    function setConnectionStatus(nextStatus: SyncStatus) {
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
      if (document.visibilityState !== 'visible') return

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

      const existingChannel = supabase.getChannels().find((c) => c.topic === 'realtime:member-home-db-changes')
      if (existingChannel) {
        await supabase.removeChannel(existingChannel)
      }

      const channel = supabase
        .channel('member-home-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'card_reviews' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, scheduleRefresh)
        .subscribe(async (nextStatus, err) => {
          if (isUnmounted || connectAttemptRef.current !== attemptId || channelRef.current !== channel) return

          if (nextStatus === 'SUBSCRIBED') {
            reconnectAttemptsRef.current = 0
            setConnectionStatus('live')
            return
          }

          if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT' || nextStatus === 'CLOSED') {
            setConnectionStatus('offline')

            if (err) {
              console.error('[HomeRealtime]', nextStatus, err.message)
            }

            scheduleReconnect()
            return
          }

          setConnectionStatus('connecting')
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
      if (statusRef.current === 'live') return

      reconnectAttemptsRef.current = 0
      void connect()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return

      if (statusRef.current === 'live') {
        scheduleRefresh()
        return
      }

      reconnectAttemptsRef.current = 0
      void connect()
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && statusRef.current === 'live') {
        scheduleRefresh()
      }
    }, FALLBACK_REFRESH_INTERVAL_MS)

    return () => {
      isUnmounted = true
      connectAttemptRef.current += 1
      subscription.unsubscribe()
      window.clearInterval(pollInterval)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearReconnectTimer()
      cleanupChannel()
      clearRefreshTimer()
    }
  }, [router])

  return (
    <div className="flex justify-end">
      <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">
            <span
              className={`h-2 w-2 rounded-full ${
                status === 'live'
                  ? 'bg-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/10'
                  : status === 'connecting'
                    ? 'bg-[var(--color-primary-light)] ring-4 ring-[var(--color-primary-light)]/10 animate-pulse'
                    : 'bg-[var(--color-error)] ring-4 ring-[var(--color-error)]/10'
              }`}
            />
        {status === 'live' ? 'Sincronizado ao vivo' : status === 'connecting' ? 'Sincronizando' : 'Sem conexão'}
      </div>
    </div>
  )
}
