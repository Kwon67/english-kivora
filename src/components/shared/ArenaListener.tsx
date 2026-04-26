'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { m, AnimatePresence } from 'framer-motion'
import { Swords, Zap, Timer } from 'lucide-react'

export default function ArenaListener({ userId }: { userId: string }) {
  const [duelId, setDuelId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(15)
  const router = useRouter()
  const pathname = usePathname()
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seenDuelIds = useRef<Set<string>>(new Set())
  const duelIdRef = useRef<string | null>(null)
  
  const shouldIgnoreIncomingDuel = useCallback(() => pathname.startsWith('/arena'), [pathname])
  
  const clearInvitation = useCallback(() => {
    setDuelId(null)
    setCountdown(15)
  }, [])

  const cancelInvitation = useCallback(async () => {
    const currentDuelId = duelIdRef.current

    if (!currentDuelId) {
      clearInvitation()
      return
    }

    await fetch(`/api/arena/duels/${currentDuelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'cancel' }),
    }).catch(() => null)

    clearInvitation()
  }, [clearInvitation])

  useEffect(() => {
    duelIdRef.current = duelId
  }, [duelId])

  useEffect(() => {
    const supabase = createClient()
    let channelRef: ReturnType<typeof supabase.channel> | null = null
    let mounted = true

    const initRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token)
      }

      // Nome do canal único com timestamp/random para evitar colisões entre execuções do useEffect
      const channelName = `arena-listener-${userId}-${Math.random().toString(36).slice(2, 9)}`
      
      channelRef = supabase.channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'arena_duels',
          },
          (payload) => {
            const newDuel = payload.new
            if (
              (newDuel.player1_id === userId || newDuel.player2_id === userId) &&
              newDuel.status === 'pending'
            ) {
              if (shouldIgnoreIncomingDuel()) return
              if (seenDuelIds.current.has(newDuel.id)) return
              seenDuelIds.current.add(newDuel.id)
              setDuelId(newDuel.id)
              setCountdown(15)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'arena_duels',
          },
          (payload) => {
            const updatedDuel = payload.new

            if (
              (updatedDuel.player1_id === userId || updatedDuel.player2_id === userId) &&
              duelIdRef.current === updatedDuel.id &&
              updatedDuel.status !== 'pending'
            ) {
              clearInvitation()
            }
          }
        )
        .subscribe()
    }

    initRealtime()

    return () => {
      mounted = false
      if (channelRef) {
        supabase.removeChannel(channelRef)
      }
    }
  }, [userId, clearInvitation, shouldIgnoreIncomingDuel])

  useEffect(() => {
    if (shouldIgnoreIncomingDuel()) return

    let cancelled = false

    const pollPendingDuel = async () => {
      try {
        const response = await fetch('/api/arena/pending', { cache: 'no-store' })
        const payload = (await response.json().catch(() => null)) as
          | { duelId?: string | null }
          | null

        if (cancelled) return

        const pendingDuelId = payload?.duelId ?? null

        if (!pendingDuelId) {
          return
        }

        if (seenDuelIds.current.has(pendingDuelId)) {
          return
        }

        seenDuelIds.current.add(pendingDuelId)
        setDuelId(pendingDuelId)
        setCountdown(15)
      } catch {
        // Ignore polling errors; realtime insert remains the primary signal.
      }
    }

    void pollPendingDuel()
    const interval = setInterval(() => {
      void pollPendingDuel()
    }, 3000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pathname, shouldIgnoreIncomingDuel])

  // Auto-decline countdown
  useEffect(() => {
    if (!duelId) {
      if (countdownRef.current) clearInterval(countdownRef.current)
      return
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          void cancelInvitation()
          return 15
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [duelId, cancelInvitation])

  if (!duelId) return null

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        {/* Animated background */}
        <m.div
          className="absolute inset-0"
          style={{
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2].map(i => (
            <m.div
              key={i}
              className="absolute rounded-full border-2 border-red-500/20"
              initial={{ width: 100, height: 100, opacity: 0.6 }}
              animate={{
                width: [100, 500],
                height: [100, 500],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* Card */}
        <m.div
          initial={{ scale: 0.8, y: 40, rotateX: 10 }}
          animate={{ scale: 1, y: 0, rotateX: 0 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]"
        >
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />

          <div className="p-8 text-center">
            {/* Animated sword icon */}
            <m.div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-red-600/10"
              style={{
                boxShadow: '0 12px 30px -8px rgba(220, 38, 38, 0.25)',
              }}
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, -3, 3, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Swords className="h-10 w-10 text-red-600" strokeWidth={2} />
            </m.div>

            {/* Flash effect */}
            <m.div
              className="flex items-center justify-center gap-2 mb-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Zap className="h-4 w-4 text-amber-500" fill="currentColor" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
                Duelo em tempo real
              </span>
              <Zap className="h-4 w-4 text-amber-500" fill="currentColor" />
            </m.div>

            <m.h2
              className="text-3xl font-bold text-[var(--color-text)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Desafio na Arena!
            </m.h2>

            <m.p
              className="text-sm text-[var(--color-text-muted)] mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Você foi desafiado para um duelo. Aceite o desafio e mostre suas habilidades!
            </m.p>

            {/* Countdown timer */}
            <m.div
              className="flex items-center justify-center gap-2 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Timer className="h-4 w-4 text-[var(--color-text-subtle)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--color-text-subtle)]">Expira em</span>
                <span className={`text-lg font-bold tabular-nums ${countdown <= 5 ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
                  {countdown}s
                </span>
              </div>
              {/* Progress ring */}
              <div className="relative h-6 w-6">
                <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-border)" strokeWidth="2" />
                  <circle
                    cx="12" cy="12" r="10" fill="none"
                    stroke={countdown <= 5 ? '#dc2626' : 'var(--color-text-subtle)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 10}
                    strokeDashoffset={2 * Math.PI * 10 * (1 - countdown / 15)}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
              </div>
            </m.div>

            {/* Buttons */}
            <m.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={() => {
                  const id = duelId
                  clearInvitation()
                  router.push(`/arena/${id}`)
                }}
                className="group relative w-full overflow-hidden rounded-2xl bg-red-600 px-6 py-4 text-base font-bold text-[var(--color-on-primary)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  boxShadow: '0 12px 24px -8px rgba(220, 38, 38, 0.4)',
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Swords className="h-5 w-5" />
                  Aceitar Desafio
                </span>
              </button>

              <button
                onClick={() => void cancelInvitation()}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-6 py-3.5 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-text)]"
              >
                Recusar
              </button>
            </m.div>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  )
}
