'use client'

import { useEffect, useEffectEvent, useRef, useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REFRESH_DEBOUNCE_MS = 300

export default function AdminDashboardRealtime() {
  const router = useRouter()
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('connecting')

  const scheduleRefresh = useEffectEvent(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    refreshTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        router.refresh()
      })
    }, REFRESH_DEBOUNCE_MS)
  })

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, scheduleRefresh)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('live')
          scheduleRefresh()
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setStatus('offline')
        }
      })

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      void supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/72 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          status === 'live'
            ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]'
            : status === 'connecting'
              ? 'bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]'
              : 'bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.16)]'
        }`}
      />
      {status === 'live' ? 'Ao vivo' : status === 'connecting' ? 'Conectando' : 'Offline'}
    </div>
  )
}
