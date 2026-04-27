'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Swords, Loader2 } from 'lucide-react'
import { m } from 'framer-motion'

const WAITING_TIMEOUT_SECONDS = 90

interface ArenaWaitingScreenProps {
  duelId: string
  opponentName: string
}

export default function ArenaWaitingScreen({ duelId, opponentName }: ArenaWaitingScreenProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(WAITING_TIMEOUT_SECONDS)
  // const [status, setStatus] = useState('pending')

  useEffect(() => {
    const supabase = createClient()

    const sendHeartbeat = async () => {
      await supabase.from('arena_duels').update({
        player1_joined_at: new Date().toISOString(),
      }).eq('id', duelId).eq('status', 'pending')
    }

    void sendHeartbeat()
    const heartbeatInterval = setInterval(() => {
      void sendHeartbeat()
    }, 3000)

    // Poll for duel status changes
    const pollInterval = setInterval(async () => {
      const { data: duel } = await supabase
        .from('arena_duels')
        .select('status, player1_joined_at, player2_joined_at')
        .eq('id', duelId)
        .single()

      if (!duel) return

      // setStatus(duel.status)

      // If opponent joined (has joined_at), refresh to enter arena
      if (duel.player2_joined_at) {
        router.refresh()
        return
      }

      // If duel was cancelled, go back to arena
      if (duel.status === 'cancelled') {
        router.push('/arena')
      }
    }, 2000)

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Keep this longer than the invitation popup so slow mobile clients can still accept.
          supabase.from('arena_duels').update({
            status: 'cancelled',
            finished_at: new Date().toISOString()
          }).eq('id', duelId).eq('status', 'pending')
          
          router.push('/arena')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(heartbeatInterval)
      clearInterval(pollInterval)
      clearInterval(countdownInterval)
    }
  }, [duelId, router])

  async function cancelAndLeave() {
    const supabase = createClient()
    await supabase.from('arena_duels').update({
      status: 'cancelled',
      finished_at: new Date().toISOString(),
    }).eq('id', duelId).eq('status', 'pending')
    router.push('/arena')
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[linear-gradient(180deg,rgba(127,29,29,0.12),transparent_55%)] p-4">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-[2rem] border border-red-950/25 bg-[linear-gradient(180deg,var(--color-card),rgba(127,29,29,0.10))] p-7 text-center shadow-[0_24px_70px_rgba(127,29,29,0.18)]"
      >
        {/* Animated rings */}
        <div className="relative mx-auto mb-6 sm:mb-8 h-24 w-24 sm:h-32 sm:w-32">
          {[0, 1, 2].map(i => (
            <m.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-red-700/25"
              animate={{
                scale: [1, 1.5 + i * 0.3],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}
          <m.div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{
              background: '#450a0a',
              boxShadow: '0 18px 44px -10px rgba(185, 28, 28, 0.55)',
            }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Swords className="h-10 w-10 text-red-100 sm:h-12 sm:w-12" />
          </m.div>
        </div>

        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-red-700">
          Convite sangrento enviado
        </p>
        <h2 className="mb-2 text-xl font-black text-[var(--color-text)] sm:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
          Esperando {opponentName}
        </h2>
        <p className="mb-4 text-xs text-[var(--color-text-muted)] sm:mb-6 sm:text-sm">
          O rival recebeu o chamado. Se entrar, a arena fecha e o duelo começa.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-red-700" />
            Aguardando resposta...
          </div>
          <div className="text-[10px] text-[var(--color-text-subtle)]">
            Expira em {countdown}s
          </div>
        </div>

        <button
          onClick={() => void cancelAndLeave()}
          className="mt-8 rounded-[1.1rem] border border-red-950/20 bg-red-950/10 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-950/15"
        >
          Cancelar e Voltar
        </button>
      </m.div>
    </div>
  )
}
