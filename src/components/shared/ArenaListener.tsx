'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { m, AnimatePresence } from 'framer-motion'
import { Swords, Zap, Timer } from 'lucide-react'

export default function ArenaListener({ userId }: { userId: string }) {
  const [duelId, setDuelId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(15)
  const router = useRouter()
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function setupChannel() {
      // Set auth token for realtime
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token)
      }

      const channel = supabase.channel('arena-listener-' + userId)
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
              setDuelId(newDuel.id)
              setCountdown(15)
            }
          }
        )
        .subscribe()

      return channel
    }

    let channelRef: ReturnType<typeof supabase.channel> | null = null
    setupChannel().then(ch => { channelRef = ch })

    return () => {
      if (channelRef) supabase.removeChannel(channelRef)
    }
  }, [userId])

  // Auto-decline countdown
  useEffect(() => {
    if (!duelId) {
      if (countdownRef.current) clearInterval(countdownRef.current)
      return
    }

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setDuelId(null)
          return 15
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [duelId])

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
            background: 'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.15) 0%, rgba(0,0,0,0.7) 100%)',
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
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-[2rem]"
          style={{
            background: 'linear-gradient(170deg, #ffffff 0%, #fef2f2 50%, #ffffff 100%)',
            boxShadow: '0 0 80px -20px rgba(220, 38, 38, 0.3), 0 24px 60px -20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600" />

          <div className="p-8 text-center">
            {/* Animated sword icon */}
            <m.div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem]"
              style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
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
              className="text-3xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Desafio na Arena!
            </m.h2>

            <m.p
              className="text-sm text-gray-500 mb-6"
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
              <Timer className="h-4 w-4 text-gray-400" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Expira em</span>
                <span className={`text-lg font-bold tabular-nums ${countdown <= 5 ? 'text-red-600' : 'text-gray-700'}`}>
                  {countdown}s
                </span>
              </div>
              {/* Progress ring */}
              <div className="relative h-6 w-6">
                <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                  <circle
                    cx="12" cy="12" r="10" fill="none"
                    stroke={countdown <= 5 ? '#dc2626' : '#6b7280'}
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
                  setDuelId(null)
                  router.push(`/arena/${id}`)
                }}
                className="group relative w-full overflow-hidden rounded-2xl px-6 py-4 text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  boxShadow: '0 12px 24px -8px rgba(220, 38, 38, 0.4)',
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Swords className="h-5 w-5" />
                  Aceitar Desafio
                </span>
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s linear infinite',
                  }}
                />
              </button>

              <button
                onClick={() => setDuelId(null)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
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
