'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Flashcard from '@/components/game/Flashcard'
import type { Card } from '@/types/database.types'
import { Trophy, Swords, Loader2, Crown, Shield, Flame, Zap, ArrowLeft } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'

interface ArenaClientProps {
  duelId: string
  userId: string
  player1: { id: string; username: string }
  player2: { id: string; username: string }
  initialStatus: string
  winnerId: string | null
  packName: string
  cards: Card[]
}

export default function ArenaClient({
  duelId,
  userId,
  player1,
  player2,
  initialStatus,
  winnerId: initialWinnerId,
  packName,
  cards,
}: ArenaClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [winnerId, setWinnerId] = useState(initialWinnerId)

  const [myProgress, setMyProgress] = useState(0)
  const [opponentProgress, setOpponentProgress] = useState(0)

  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)

  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameChannelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const hasTriggeredConfetti = useRef(false)

  const isPlayer1 = userId === player1.id
  const me = isPlayer1 ? player1 : player2
  const opponent = isPlayer1 ? player2 : player1

  // Elapsed time counter during active game
  useEffect(() => {
    if (status === 'active' && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    if (status !== 'active' && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  // Use ref to avoid stale closure in realtime callbacks
  const statusRef = useRef(status)
  useEffect(() => { statusRef.current = status }, [status])

  // Player 1: kick off the game shortly after arriving
  useEffect(() => {
    if (!isPlayer1 || initialStatus !== 'pending') return

    const supabase = createClient()
    const timer = setTimeout(async () => {
      console.log('[Arena] Player 1 starting duel...')
      const { error } = await supabase.from('arena_duels').update({
        status: 'active',
        started_at: new Date().toISOString()
      }).eq('id', duelId).eq('status', 'pending') // only if still pending

      if (error) {
        console.error('[Arena] Failed to start duel:', error)
      } else {
        console.log('[Arena] Duel status set to active')
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [duelId, isPlayer1, initialStatus])

  // Realtime subscriptions
  useEffect(() => {
    const supabase = createClient()
    let isUnmounted = false

    async function setup() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token)
      }
      if (isUnmounted) return null

      // Subscribe to DB changes for duel status
      const dbChannel = supabase.channel(`duel_db_${duelId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'arena_duels',
            filter: `id=eq.${duelId}`
          },
          (payload) => {
            if (isUnmounted) return
            const updated = payload.new
            console.log('[Arena] Duel update received:', updated.status)

            if (updated.status === 'active' && statusRef.current === 'pending') {
              setShowCountdown(true)
              setCountdown(3)
            }
            setStatus(updated.status)
            if (updated.winner_id) setWinnerId(updated.winner_id)
          }
        )
        .subscribe((subStatus) => {
          console.log('[Arena] DB channel status:', subStatus)
        })

      // Realtime channel for game events (progress broadcasting)
      const gameChannel = supabase.channel(`duel_game_${duelId}`)
        .on('broadcast', { event: 'progress' }, (payload) => {
          if (isUnmounted) return
          if (payload.payload.userId !== userId) {
            setOpponentProgress(payload.payload.progress)
            setOpponentScore(payload.payload.score)
          }
        })
        .subscribe((subStatus) => {
          if (subStatus === 'SUBSCRIBED') {
            gameChannelRef.current = gameChannel
            console.log('[Arena] Game channel ready')
          }
        })

      return { dbChannel, gameChannel }
    }

    let channels: { dbChannel: ReturnType<typeof supabase.channel>; gameChannel: ReturnType<typeof supabase.channel> } | null = null
    setup().then(ch => { channels = ch })

    return () => {
      isUnmounted = true
      if (channels) {
        supabase.removeChannel(channels.dbChannel)
        supabase.removeChannel(channels.gameChannel)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelId, userId])

  // Countdown logic
  useEffect(() => {
    if (!showCountdown || countdown === null) return

    if (countdown <= 0) {
      setShowCountdown(false)
      setCountdown(null)
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, showCountdown])

  const broadcastProgress = useCallback(async (newProgress: number, newScore: number) => {
    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'progress',
        payload: { userId, progress: newProgress, score: newScore }
      })
    }
  }, [userId])

  const handleFinish = useCallback(async () => {
    const supabase = createClient()
    const { data: currentDuel } = await supabase.from('arena_duels').select('status, winner_id').eq('id', duelId).single()
    if (currentDuel && currentDuel.status !== 'finished') {
      await supabase.from('arena_duels').update({
        status: 'finished',
        winner_id: userId,
        finished_at: new Date().toISOString()
      }).eq('id', duelId)
    }
  }, [duelId, userId])

  const handleNext = useCallback((correct: boolean) => {
    const nextIndex = currentCardIndex + 1
    const newScore = correct ? myScore + 1 : myScore

    setMyScore(newScore)
    setMyProgress(nextIndex)
    setCurrentCardIndex(nextIndex)

    broadcastProgress(nextIndex, newScore)

    if (nextIndex >= cards.length) {
      handleFinish()
    }
  }, [currentCardIndex, myScore, cards.length, broadcastProgress, handleFinish])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const myPercent = cards.length > 0 ? (myProgress / cards.length) * 100 : 0
  const opponentPercent = cards.length > 0 ? (opponentProgress / cards.length) * 100 : 0

  // --- PENDING STATE (waiting for opponent) ---
  if (status === 'pending') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm w-full"
        >
          {/* Animated rings */}
          <div className="relative mx-auto mb-8 h-32 w-32">
            {[0, 1, 2].map(i => (
              <m.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-red-400/30"
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
                background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                boxShadow: '0 12px 30px -8px rgba(220, 38, 38, 0.2)',
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Swords className="h-12 w-12 text-red-600" />
            </m.div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Aguardando Oponente...
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Prepare-se para o duelo de <span className="font-semibold text-red-600">{packName}</span>
          </p>

          {/* Versus card */}
          <m.div
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                  {me.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400">Você</p>
                  <p className="text-sm font-bold">{me.username}</p>
                </div>
              </div>

              <m.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className="h-6 w-6 text-amber-500" fill="currentColor" />
              </m.div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Oponente</p>
                  <p className="text-sm font-bold">{opponent.username}</p>
                </div>
                <m.div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-sm"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {opponent.username.slice(0, 2).toUpperCase()}
                </m.div>
              </div>
            </div>
          </m.div>

          <m.div
            className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Conectando...
          </m.div>
        </m.div>
      </div>
    )
  }

  // --- COUNTDOWN OVERLAY ---
  if (showCountdown && countdown !== null && countdown > 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <AnimatePresence mode="wait">
          <m.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-center"
          >
            <m.span
              className="block text-[8rem] font-black leading-none"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'linear-gradient(180deg, #ffffff 30%, #fca5a5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: 'drop-shadow(0 4px 30px rgba(220, 38, 38, 0.4))',
              }}
            >
              {countdown}
            </m.span>
            <p className="mt-4 text-lg font-semibold text-white/60">Prepare-se...</p>
          </m.div>
        </AnimatePresence>
      </div>
    )
  }

  // --- FINISHED STATE ---
  if (status === 'finished') {
    const iWon = winnerId === userId

    if (iWon && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true
      import('canvas-confetti').then(({ default: confetti }) => {
        // Multiple bursts
        const fire = (angle: number, origin: { x: number; y: number }) => {
          confetti({
            particleCount: 80,
            angle,
            spread: 60,
            origin,
            colors: ['#fbbf24', '#f59e0b', '#dc2626', '#ef4444', '#ffffff'],
          })
        }
        fire(60, { x: 0, y: 0.65 })
        fire(120, { x: 1, y: 0.65 })
        setTimeout(() => {
          fire(90, { x: 0.5, y: 0.5 })
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.4 },
            colors: ['#fbbf24', '#f59e0b', '#dc2626', '#ef4444', '#ffffff'],
          })
        }, 300)
      })
    }

    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <m.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full max-w-md overflow-hidden rounded-[2rem]"
          style={{
            background: iWon
              ? 'linear-gradient(170deg, #fffbeb 0%, #fef3c7 30%, #ffffff 100%)'
              : 'linear-gradient(170deg, #f9fafb 0%, #f3f4f6 30%, #ffffff 100%)',
            boxShadow: iWon
              ? '0 0 60px -15px rgba(245, 158, 11, 0.3), 0 24px 60px -20px rgba(0,0,0,0.15)'
              : '0 24px 60px -20px rgba(0,0,0,0.15)',
            border: iWon ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {/* Top bar */}
          <div
            className="h-1.5 w-full"
            style={{
              background: iWon
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)'
                : 'linear-gradient(90deg, #9ca3af, #d1d5db, #9ca3af)',
            }}
          />

          <div className="p-8 text-center">
            {/* Icon */}
            <m.div
              className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[1.75rem] ${
                iWon
                  ? 'bg-gradient-to-br from-amber-100 to-yellow-200'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}
              style={{
                boxShadow: iWon
                  ? '0 16px 40px -10px rgba(245, 158, 11, 0.35)'
                  : '0 16px 40px -10px rgba(0,0,0,0.1)',
              }}
              animate={iWon ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {iWon ? (
                <Crown className="h-12 w-12 text-amber-600" strokeWidth={2} />
              ) : (
                <Shield className="h-12 w-12 text-gray-500" strokeWidth={2} />
              )}
            </m.div>

            <h2 className="text-3xl font-black text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {iWon ? 'Vitória!' : 'Fim do Duelo'}
            </h2>
            <p className={`text-sm mb-8 ${iWon ? 'text-amber-700' : 'text-gray-500'}`}>
              {iWon
                ? 'Você foi mais rápido! Parabéns, campeão!'
                : 'Não foi dessa vez. Continue treinando!'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="rounded-2xl bg-white/80 border border-gray-100 p-4 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Acertos</p>
                <p className="text-2xl font-black text-gray-900">{myScore}<span className="text-sm font-normal text-gray-400">/{cards.length}</span></p>
              </div>
              <div className="rounded-2xl bg-white/80 border border-gray-100 p-4 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tempo</p>
                <p className="text-2xl font-black text-gray-900">{formatTime(elapsedTime)}</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/home')}
              className="group w-full overflow-hidden rounded-2xl px-6 py-4 text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: iWon
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, var(--color-primary) 0%, #1f5f08 100%)',
                boxShadow: iWon
                  ? '0 12px 24px -8px rgba(245, 158, 11, 0.4)'
                  : '0 12px 24px -8px rgba(43, 122, 11, 0.4)',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Início
              </span>
            </button>
          </div>
        </m.div>
      </div>
    )
  }

  // --- ACTIVE GAME STATE ---
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
      {/* Battle Header */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-[1.75rem]"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: '0 20px 50px -15px rgba(15, 52, 96, 0.4)',
        }}
      >
        <div className="p-5 sm:p-6">
          {/* Top row: Pack name + Timer */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">
                {packName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-white/80 tabular-nums">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>

          {/* VS Layout */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Player - Me */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                  {me.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-emerald-400/60 font-semibold">Você</p>
                  <p className="text-sm font-bold text-white truncate">{me.username}</p>
                </div>
                <span className="ml-auto text-lg font-black text-emerald-400 tabular-nums">
                  {myProgress}<span className="text-xs text-white/30">/{cards.length}</span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <m.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                    boxShadow: myPercent > 0 ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${myPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* VS Badge */}
            <m.div
              className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(251, 146, 60, 0.2))',
                border: '1px solid rgba(220, 38, 38, 0.2)',
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Swords className="h-5 w-5 text-red-400" />
            </m.div>

            {/* Player - Opponent */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg font-black text-orange-400 tabular-nums">
                  {opponentProgress}<span className="text-xs text-white/30">/{cards.length}</span>
                </span>
                <div className="min-w-0 ml-auto text-right">
                  <p className="text-xs text-orange-400/60 font-semibold">Oponente</p>
                  <p className="text-sm font-bold text-white truncate">{opponent.username}</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 font-bold text-xs">
                  {opponent.username.slice(0, 2).toUpperCase()}
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <m.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
                    boxShadow: opponentPercent > 0 ? '0 0 12px rgba(249, 115, 22, 0.4)' : 'none',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${opponentPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Score comparison (compact) */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Score</span>
              <span className="text-sm font-black text-emerald-400">{myScore}</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-orange-400">{opponentScore}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Score</span>
            </div>
          </div>
        </div>
      </m.div>

      {/* Card area */}
      <AnimatePresence mode="wait">
        <m.div
          key={currentCardIndex}
          initial={{ opacity: 0, x: 30, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {currentCardIndex < cards.length && (
            <Flashcard
              card={cards[currentCardIndex]}
              onCorrect={() => handleNext(true)}
              onWrong={() => handleNext(false)}
            />
          )}
        </m.div>
      </AnimatePresence>

      {/* Card counter */}
      <m.div
        className="mt-6 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 rounded-full bg-white/80 border border-gray-100 px-4 py-2 shadow-sm">
          <span className="text-xs font-semibold text-gray-400">Carta</span>
          <span className="text-sm font-black text-gray-800">{Math.min(currentCardIndex + 1, cards.length)}</span>
          <span className="text-xs text-gray-300">/</span>
          <span className="text-sm font-bold text-gray-400">{cards.length}</span>
        </div>
      </m.div>
    </div>
  )
}
