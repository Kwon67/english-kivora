'use client'

import { useEffect, useRef, useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REFRESH_DEBOUNCE_MS = 250
const SUBSCRIBE_TIMEOUT_MS = 15_000

type SyncStatus = 'connecting' | 'live' | 'offline'

export default function HomeRealtime() {
  const router = useRouter()
  const [status, setStatus] = useState<SyncStatus>('connecting')
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let isUnmounted = false

    function scheduleRefresh() {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      refreshTimeoutRef.current = setTimeout(() => {
        startTransition(() => {
          router.refresh()
        })
      }, REFRESH_DEBOUNCE_MS)
    }

    async function connect() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (isUnmounted) return null

      if (!session?.access_token) {
        setStatus('offline')
        return null
      }

      await supabase.realtime.setAuth(session.access_token)

      if (isUnmounted) return null

      return supabase
        .channel('member-home-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'card_reviews' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, scheduleRefresh)
        .subscribe((nextStatus) => {
          if (nextStatus === 'SUBSCRIBED') {
            setStatus('live')
            return
          }

          if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT' || nextStatus === 'CLOSED') {
            setStatus('offline')
            return
          }

          setStatus('connecting')
        }, SUBSCRIBE_TIMEOUT_MS)
    }

    const channelPromise = connect()

    return () => {
      isUnmounted = true
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      void channelPromise.then((channel) => {
        if (channel) {
          void supabase.removeChannel(channel)
        }
      })
    }
  }, [router])

  return (
    <div className="flex justify-end">
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
        {status === 'live' ? 'Sincronizado ao vivo' : status === 'connecting' ? 'Sincronizando' : 'Sem conexão'}
      </div>
    </div>
  )
}
