'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MultipleChoice from '@/components/game/MultipleChoice'
import type { Card } from '@/types/database.types'
import { Swords, Loader2, Crown, Shield, Flame, Zap, ArrowLeft } from 'lucide-react'
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
  player1JoinedAt: string | null
  player2JoinedAt: string | null
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
  player1JoinedAt: initialPlayer1JoinedAt,
  player2JoinedAt: initialPlayer2JoinedAt,
}: ArenaClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [winnerId] = useState(initialWinnerId)

  const [myProgress, setMyProgress] = useState(0)
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [myWrong, setMyWrong] = useState(0)
  const [opponentWrong, setOpponentWrong] = useState(0)
  const [isOpponentConnected, setIsOpponentConnected] = useState(false)
  const [isMeConnected, setIsMeConnected] = useState(false)
  const [isPlayer1Joined, setIsPlayer1Joined] = useState(!!initialPlayer1JoinedAt)
  const [isPlayer2Joined, setIsPlayer2Joined] = useState(!!initialPlayer2JoinedAt)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameChannelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const hasTriggeredConfetti = useRef(false)
  const hasTriggeredStart = useRef(false)
  const hasJoinedMarked = useRef(false)

  const isPlayer1 = userId === player1.id
  const me = isPlayer1 ? player1 : player2
  const opponent = isPlayer1 ? player2 : player1
  const hasStartedCountdown = useRef(false)

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

  // Mark current player as joined on mount (in case server update failed)
  useEffect(() => {
    if (hasJoinedMarked.current) return
    const markJoined = async () => {
      const supabase = createClient()
      const joinField = isPlayer1 ? 'player1_joined_at' : 'player2_joined_at'
      await supabase.from('arena_duels').update({
        [joinField]: new Date().toISOString()
      }).eq('id', duelId)
      hasJoinedMarked.current = true
    }
    markJoined()
  }, [duelId, isPlayer1])

  // DB-based polling: check if both players have joined and duel status
  useEffect(() => {
    if (status !== 'pending') return

    const supabase = createClient()
    const pollInterval = setInterval(async () => {
      const { data: duel } = await supabase
        .from('arena_duels')
        .select('status, player1_joined_at, player2_joined_at')
        .eq('id', duelId)
        .single()

      if (!duel) return

      // Update joined status from DB
      const p1Joined = !!duel.player1_joined_at
      const p2Joined = !!duel.player2_joined_at
      setIsPlayer1Joined(p1Joined)
      setIsPlayer2Joined(p2Joined)
      setIsMeConnected(isPlayer1 ? p1Joined : p2Joined)
      setIsOpponentConnected(isPlayer1 ? p2Joined : p1Joined)

      // Check if duel is already active (another player started it)
      if (duel.status === 'active' && !hasStartedCountdown.current) {
        console.log('[Arena] Polling: duel is active, starting countdown')
        hasStartedCountdown.current = true
        hasTriggeredStart.current = true
        setStatus('active')
        setShowCountdown(true)
        setCountdown(3)
      }
    }, 1500)

    return () => clearInterval(pollInterval)
  }, [status, duelId, isPlayer1])

  // Start game when both players have joined (DB-based, not Presence)
  useEffect(() => {
    if (status !== 'pending' || !isPlayer1Joined || !isPlayer2Joined || hasTriggeredStart.current) return

    hasTriggeredStart.current = true
    const supabase = createClient()
    const triggerStart = async () => {
      console.log('[Arena] Both players joined! Starting duel...')
      
      // Update DB (the "source of truth")
      const { error } = await supabase.from('arena_duels').update({
        status: 'active',
        started_at: new Date().toISOString()
      }).eq('id', duelId).eq('status', 'pending')

      if (error) {
        console.error('[Arena] Failed to start duel in DB:', error)
        hasTriggeredStart.current = false
        return
      }

      // Start countdown immediately (DB polling will catch this for other player)
      if (!hasStartedCountdown.current) {
        hasStartedCountdown.current = true
        setStatus('active')
        setShowCountdown(true)
        setCountdown(3)
      }
    }

    const timer = setTimeout(triggerStart, 1000)
    return () => clearTimeout(timer)
  }, [duelId, status, isPlayer1Joined, isPlayer2Joined])

  // Realtime subscriptions: only for progress broadcasting during active game
  useEffect(() => {
    if (status !== 'active') return
    
    const supabase = createClient()
    let isUnmounted = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    async function setup() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          await supabase.realtime.setAuth(session.access_token)
        }
        if (isUnmounted) return null

        // Game channel for progress broadcasting only
        const gameChannel = supabase.channel(`duel_game_${duelId}`, {
          config: {
            broadcast: { self: true }
          }
        })
          .on('broadcast', { event: 'progress' }, (payload) => {
            if (isUnmounted) return
            if (payload.payload.userId !== userId) {
              setOpponentProgress(payload.payload.progress)
              setOpponentScore(payload.payload.score)
              if (payload.payload.wrong !== undefined) {
                setOpponentWrong(payload.payload.wrong)
              }
            }
          })
          .on('broadcast', { event: 'finish_game' }, (payload) => {
            if (isUnmounted) return
            if (payload.payload.userId !== userId) {
              console.log('[Arena] Other player finished, updating status')
              setStatus('finished')
            }
          })
          .subscribe((subStatus) => {
            console.log('[Arena] Game channel status:', subStatus)
            if (subStatus === 'SUBSCRIBED') {
              gameChannelRef.current = gameChannel
              setConnectionError(null)
              retryCountRef.current = 0
            } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
              console.error('[Arena] Game channel error:', subStatus)
              setConnectionError(`Canal de jogo falhou: ${subStatus}`)
              // Retry connection
              if (retryCountRef.current < maxRetries && !isUnmounted) {
                retryCountRef.current++
                console.log(`[Arena] Retrying connection (${retryCountRef.current}/${maxRetries})...`)
                retryTimer = setTimeout(() => {
                  if (!isUnmounted) setup()
                }, 2000 * retryCountRef.current)
              }
            }
          })

        return { gameChannel }
      } catch (err) {
        console.error('[Arena] Setup error:', err)
        setConnectionError('Erro ao configurar conexão')
        return null
      }
    }

    let channels: { gameChannel: ReturnType<typeof supabase.channel> } | null = null
    setup().then(ch => { channels = ch })

    return () => {
      isUnmounted = true
      if (retryTimer) clearTimeout(retryTimer)
      if (channels) {
        supabase.removeChannel(channels.gameChannel)
      }
    }
  }, [duelId, userId, status])


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

  const broadcastProgress = useCallback(async (newProgress: number, newScore: number, newWrong: number) => {
    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'progress',
        payload: { userId, progress: newProgress, score: newScore, wrong: newWrong }
      })
    }
  }, [userId])

  const broadcastFinish = useCallback(async () => {
    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'finish_game',
        payload: { userId, timestamp: Date.now() }
      })
    }
  }, [userId])

  const handleFinish = useCallback(async () => {
    const supabase = createClient()
    // Broadcast immediately to other player
    await broadcastFinish()
    // Update DB
    const { data: currentDuel } = await supabase.from('arena_duels').select('status, winner_id').eq('id', duelId).single()
    if (currentDuel && currentDuel.status !== 'finished') {
      await supabase.from('arena_duels').update({
        status: 'finished',
        winner_id: userId,
        finished_at: new Date().toISOString()
      }).eq('id', duelId)
    }
    // Force status update locally
    setStatus('finished')
  }, [duelId, userId, broadcastFinish])

  const handleNext = useCallback((correct: boolean) => {
    // We add a small delay so the user can see the feedback in the MultipleChoice component
    setTimeout(() => {
      const nextIndex = currentCardIndex + 1
      const newScore = correct ? myScore + 1 : myScore
      const newWrong = correct ? myWrong : myWrong + 1

      setMyScore(newScore)
      setMyWrong(newWrong)
      setMyProgress(nextIndex)
      setCurrentCardIndex(nextIndex)

      broadcastProgress(nextIndex, newScore, newWrong)

      if (nextIndex >= cards.length) {
        handleFinish()
      }
    }, 800) // Reduced delay for faster game flow
  }, [currentCardIndex, myScore, myWrong, cards.length, broadcastProgress, handleFinish])

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
      <div className="flex min-h-[80vh] items-center justify-center p-3 sm:p-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm w-full"
        >
          {/* Animated rings */}
          <div className="relative mx-auto mb-6 sm:mb-8 h-24 w-24 sm:h-32 sm:w-32">
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
              <Swords className="h-10 w-10 sm:h-12 sm:w-12 text-red-600" />
            </m.div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Aguardando Oponente...
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
            Prepare-se para o duelo de <span className="font-semibold text-red-600">{packName}</span>
          </p>

          {/* Versus card */}
          <m.div
            className="rounded-xl sm:rounded-2xl border border-gray-100 bg-white p-3 sm:p-5 shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm">
                    {me.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white ${isMeConnected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] sm:text-xs text-gray-400">Você</p>
                  <p className="text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-[120px]">{me.username}</p>
                </div>
              </div>

              <m.div
                animate={isOpponentConnected && isMeConnected ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className={`h-5 w-5 sm:h-6 sm:w-6 ${isOpponentConnected && isMeConnected ? 'text-amber-500' : 'text-gray-300'}`} fill="currentColor" />
              </m.div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right">
                  <p className="text-[10px] sm:text-xs text-gray-400">Oponente</p>
                  <p className="text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-[120px]">{opponent.username}</p>
                </div>
                <div className="relative">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-xs sm:text-sm">
                    {opponent.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`absolute -left-0.5 -bottom-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white ${isOpponentConnected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
              </div>
            </div>
          </m.div>

          <m.div
            className="mt-6 flex flex-col items-center justify-center gap-2"
          >
            {!isOpponentConnected ? (
              <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Aguardando oponente entrar...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                <Zap className="h-3.5 w-3.5 animate-pulse" />
                Tudo pronto! Iniciando...
              </div>
            )}
            {connectionError && (
              <div className="text-xs text-red-500 mt-1">
                ⚠️ {connectionError}
              </div>
            )}
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-2">
              Status: {status}
            </p>
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
              className="block text-[5rem] sm:text-[6rem] md:text-[8rem] font-black leading-none"
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
            <p className="mt-4 text-base sm:text-lg font-semibold text-white/60">Prepare-se...</p>
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
      <div className="flex min-h-[80vh] items-center justify-center p-3 sm:p-4">
        <m.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full max-w-md overflow-hidden rounded-2xl sm:rounded-[2rem]"
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
            className="h-1 w-full sm:h-1.5"
            style={{
              background: iWon
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)'
                : 'linear-gradient(90deg, #9ca3af, #d1d5db, #9ca3af)',
            }}
          />

          <div className="p-4 sm:p-6 lg:p-8 text-center">
            {/* Icon */}
            <m.div
              className={`mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-2xl sm:rounded-[1.75rem] ${
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
                <Crown className="h-8 w-8 sm:h-12 sm:w-12 text-amber-600" strokeWidth={2} />
              ) : (
                <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-gray-500" strokeWidth={2} />
              )}
            </m.div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {iWon ? 'Vitória!' : 'Fim do Duelo'}
            </h2>
            <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${iWon ? 'text-amber-700' : 'text-gray-500'}`}>
              {iWon
                ? 'Você foi mais rápido! Parabéns, campeão!'
                : 'Não foi dessa vez. Continue treinando!'}
            </p>

            {/* My Stats */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Seu Desempenho</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl sm:rounded-2xl bg-emerald-50/80 border border-emerald-100 p-2 sm:p-3 text-center">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">Acertos</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-700">{myScore}</p>
                </div>
                <div className="rounded-xl sm:rounded-2xl bg-red-50/80 border border-red-100 p-2 sm:p-3 text-center">
                  <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-0.5">Erros</p>
                  <p className="text-xl sm:text-2xl font-black text-red-700">{myWrong}</p>
                </div>
                <div className="rounded-xl sm:rounded-2xl bg-blue-50/80 border border-blue-100 p-2 sm:p-3 text-center">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Tempo</p>
                  <p className="text-lg sm:text-xl font-black text-blue-700">{formatTime(elapsedTime)}</p>
                </div>
              </div>
            </div>

            {/* Opponent Stats (comparison) */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Oponente</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl sm:rounded-2xl bg-gray-50/80 border border-gray-100 p-2 sm:p-3 text-center">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Acertos</p>
                  <p className="text-lg sm:text-xl font-black text-gray-700">{opponentScore}</p>
                </div>
                <div className="rounded-xl sm:rounded-2xl bg-gray-50/80 border border-gray-100 p-2 sm:p-3 text-center">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Erros</p>
                  <p className="text-lg sm:text-xl font-black text-gray-700">{opponentWrong}</p>
                </div>
                <div className="rounded-xl sm:rounded-2xl bg-gray-50/80 border border-gray-100 p-2 sm:p-3 text-center">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Progresso</p>
                  <p className="text-sm sm:text-base font-black text-gray-700">{opponentProgress}/{cards.length}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/home')}
              className="group w-full overflow-hidden rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
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
    <div className="max-w-4xl mx-auto p-2 sm:p-4 lg:p-6 pb-20 sm:pb-24">
      {/* Battle Header */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 sm:mb-6 overflow-hidden rounded-2xl sm:rounded-[1.75rem]"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: '0 20px 50px -15px rgba(15, 52, 96, 0.4)',
        }}
      >
        <div className="p-3 sm:p-5 lg:p-6">
          {/* Top row: Pack name + Timer */}
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-white/50 truncate max-w-[100px] sm:max-w-none">
                {packName}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/10 px-2 sm:px-3 py-0.5 sm:py-1">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-white/80 tabular-nums">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>

          {/* VS Layout - Mobile: Stacked, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 lg:gap-5">
            {/* Player - Me */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-[10px] sm:text-xs">
                  {me.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-emerald-400/60 font-semibold">Você</p>
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{me.username}</p>
                </div>
                <span className="ml-auto text-base sm:text-lg font-black text-emerald-400 tabular-nums">
                  {myProgress}<span className="text-[10px] sm:text-xs text-white/30">/{cards.length}</span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 sm:h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
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
              className="hidden sm:flex shrink-0 h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-xl lg:rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(251, 146, 60, 0.2))',
                border: '1px solid rgba(220, 38, 38, 0.2)',
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Swords className="h-4 w-4 lg:h-5 lg:w-5 text-red-400" />
            </m.div>

            {/* Player - Opponent */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <span className="text-base sm:text-lg font-black text-orange-400 tabular-nums">
                  {opponentProgress}<span className="text-[10px] sm:text-xs text-white/30">/{cards.length}</span>
                </span>
                <div className="min-w-0 ml-auto text-right">
                  <p className="text-[10px] sm:text-xs text-orange-400/60 font-semibold">Oponente</p>
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{opponent.username}</p>
                </div>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-500/20 text-orange-400 font-bold text-[10px] sm:text-xs">
                  {opponent.username.slice(0, 2).toUpperCase()}
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 sm:h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
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
          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/30">Score</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400">{myScore}</span>
            </div>
            <div className="h-2.5 sm:h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-xs sm:text-sm font-black text-orange-400">{opponentScore}</span>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/30">Score</span>
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
            <MultipleChoice
              card={cards[currentCardIndex]}
              allCards={cards}
              onCorrect={() => handleNext(true)}
              onWrong={() => handleNext(false)}
            />
          )}
        </m.div>
      </AnimatePresence>

      {/* Card counter */}
      <m.div
        className="mt-4 sm:mt-6 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/80 border border-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold text-gray-400">Carta</span>
          <span className="text-xs sm:text-sm font-black text-gray-800">{Math.min(currentCardIndex + 1, cards.length)}</span>
          <span className="text-[10px] sm:text-xs text-gray-300">/</span>
          <span className="text-xs sm:text-sm font-bold text-gray-400">{cards.length}</span>
        </div>
      </m.div>
    </div>
  )
}
