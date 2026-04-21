'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MultipleChoice from '@/components/game/MultipleChoice'
import ArenaMatchingGame from '@/components/game/ArenaMatchingGame'
import Flashcard from '@/components/game/Flashcard'
import TypingMode from '@/components/game/TypingMode'
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
  gameType: string
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
  gameType,
}: ArenaClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [winnerId, setWinnerId] = useState(initialWinnerId)

  const [myProgress, setMyProgress] = useState(0)
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [myWrong, setMyWrong] = useState(0)
  const [, setOpponentWrong] = useState(0)
  const [isOpponentConnected, setIsOpponentConnected] = useState(false)
  const [isMeConnected, setIsMeConnected] = useState(false)
  const [isPlayer1Joined, setIsPlayer1Joined] = useState(!!initialPlayer1JoinedAt)
  const [isPlayer2Joined, setIsPlayer2Joined] = useState(!!initialPlayer2JoinedAt)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [opponentJoinTimeout, setOpponentJoinTimeout] = useState<number | null>(null)

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
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const opponentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isPlayer1 = userId === player1.id
  const me = isPlayer1 ? player1 : player2
  const opponent = isPlayer1 ? player2 : player1
  const hasStartedCountdown = useRef(false)
  const arenaCards = useMemo(
    () => (gameType === 'matching' ? cards.slice(0, 10) : cards),
    [cards, gameType]
  )
  const totalCards = arenaCards.length

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

  // Mark current player as joined and start heartbeat on mount
  useEffect(() => {
    if (hasJoinedMarked.current) return
    const markJoined = async () => {
      try {
        const supabase = createClient()
        const joinField = isPlayer1 ? 'player1_joined_at' : 'player2_joined_at'
        const { error } = await supabase.from('arena_duels').update({
          [joinField]: new Date().toISOString()
        }).eq('id', duelId)
        if (error) {
          console.error('[Arena] Failed to mark joined:', error)
          return
        }
        hasJoinedMarked.current = true
      } catch (err) {
        console.error('[Arena] Error marking joined:', err)
      }
    }
    markJoined()
  }, [duelId, isPlayer1])

  // Heartbeat: update playerX_joined_at every 3 seconds to maintain presence
  useEffect(() => {
    if (!hasJoinedMarked.current) return

    const supabase = createClient()
    const joinField = isPlayer1 ? 'player1_joined_at' : 'player2_joined_at'

    const sendHeartbeat = async () => {
      try {
        const { error } = await supabase.from('arena_duels').update({
          [joinField]: new Date().toISOString()
        }).eq('id', duelId)
        if (error) {
          console.error('[Arena] Failed to send heartbeat:', error)
        }
      } catch (err) {
        console.error('[Arena] Error sending heartbeat:', err)
      }
    }

    // Send heartbeat immediately, then every 3 seconds
    sendHeartbeat()
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 3000)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [duelId, isPlayer1])

  // Cleanup: mark player as left when unmounting
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          const supabase = createClient()
          const leftField = isPlayer1 ? 'player1_left_at' : 'player2_left_at'
          const { error } = await supabase.from('arena_duels').update({
            [leftField]: new Date().toISOString()
          }).eq('id', duelId)
          if (error) {
            console.error('[Arena] Failed to mark left:', error)
          }
        } catch (err) {
          console.error('[Arena] Error marking left:', err)
        }
      }
      cleanup()
    }
  }, [duelId, isPlayer1])

  // Helper: check if heartbeat is fresh (within 10 seconds)
  const isHeartbeatFresh = (heartbeat: string | null) => {
    if (!heartbeat) return false
    const now = new Date()
    const lastSeen = new Date(heartbeat)
    const diffMs = now.getTime() - lastSeen.getTime()
    return diffMs < 10000 // 10 seconds
  }

  // DB-based polling: check if both players have fresh heartbeats and duel status
  useEffect(() => {
    if (status !== 'pending' && status !== 'active') return

    const pollInterval = setInterval(async () => {
      const response = await fetch(`/api/arena/duels/${duelId}`, { cache: 'no-store' }).catch(() => null)
      const duel = response ? await response.json().catch(() => null) : null

      if (!duel || response?.ok === false) return

      // Check heartbeat freshness for real presence detection
      const p1HeartbeatFresh = isHeartbeatFresh(duel.player1_joined_at)
      const p2HeartbeatFresh = isHeartbeatFresh(duel.player2_joined_at)
      
      // Only consider player "joined" if they have fresh heartbeat
      setIsPlayer1Joined(p1HeartbeatFresh)
      setIsPlayer2Joined(p2HeartbeatFresh)
      setIsMeConnected(isPlayer1 ? p1HeartbeatFresh : p2HeartbeatFresh)
      setIsOpponentConnected(isPlayer1 ? p2HeartbeatFresh : p1HeartbeatFresh)

      // Check if duel is already active (another player started it)
      // BUT only start if both players have fresh heartbeats
      if (duel.status === 'active' && !hasStartedCountdown.current) {
        if (p1HeartbeatFresh && p2HeartbeatFresh) {
          console.log('[Arena] Polling: duel is active and both players present, starting countdown')
          hasStartedCountdown.current = true
          hasTriggeredStart.current = true
          setStatus('active')
          setShowCountdown(true)
          setCountdown(3)
        } else {
          console.log('[Arena] Duel active but waiting for both players to be present')
        }
        return
      }

      if (duel.status === 'finished') {
        setWinnerId(duel.winner_id)
        setStatus('finished')
        return
      }

      if (duel.status === 'cancelled') {
        setStatus('cancelled')
      }
    }, 1500)

    return () => clearInterval(pollInterval)
  }, [status, duelId, isPlayer1])

  // 30-second timeout: cancel duel if opponent doesn't join
  useEffect(() => {
    if (status !== 'pending' || hasTriggeredStart.current) return

    // Only start timeout if I've joined but opponent hasn't
    if (isMeConnected && !isOpponentConnected) {
      opponentTimeoutRef.current = setTimeout(async () => {
        console.log('[Arena] Opponent did not join within 30 seconds, cancelling duel')
        try {
          const supabase = createClient()
          await supabase.from('arena_duels').update({
            status: 'cancelled',
            finished_at: new Date().toISOString()
          }).eq('id', duelId).eq('status', 'pending')
          setStatus('cancelled')
        } catch (err) {
          console.error('[Arena] Error cancelling duel after timeout:', err)
        }
      }, 30000)

      // Update countdown display
      let secondsLeft = 30
      setOpponentJoinTimeout(secondsLeft)
      const countdownInterval = setInterval(() => {
        secondsLeft--
        setOpponentJoinTimeout(secondsLeft)
        if (secondsLeft <= 0) {
          clearInterval(countdownInterval)
        }
      }, 1000)

      return () => {
        if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current)
        clearInterval(countdownInterval)
      }
    } else {
      // Opponent joined, clear timeout
      if (opponentTimeoutRef.current) {
        clearTimeout(opponentTimeoutRef.current)
        opponentTimeoutRef.current = null
      }
      setOpponentJoinTimeout(null)
    }
  }, [status, isMeConnected, isOpponentConnected, duelId])

  // Start game when both players have FRESH heartbeats (real presence)
  // Only Player 1 triggers the start to avoid race conditions
  useEffect(() => {
    if (status !== 'pending' || !isPlayer1Joined || !isPlayer2Joined || hasTriggeredStart.current) return
    // Only Player 1 (or the first to detect both ready) triggers the start
    // This prevents both players from trying to update simultaneously

    hasTriggeredStart.current = true
    const supabase = createClient()
    const triggerStart = async () => {
      console.log('[Arena] Both players have fresh heartbeats! Starting duel...')
      
      // Try to update DB with status check to prevent race condition
      // Only succeeds if status is still 'pending'
      const { data: updatedDuel, error } = await supabase
        .from('arena_duels')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', duelId)
        .eq('status', 'pending') // Critical: only update if still pending
        .select('status')
        .single()

      if (error || !updatedDuel) {
        console.log('[Arena] Failed to start duel (maybe already started by other player):', error)
        // If failed, check if duel is already active
        const { data: currentDuel } = await supabase.from('arena_duels').select('status').eq('id', duelId).single()
        if (currentDuel?.status === 'active') {
          console.log('[Arena] Duel already active, starting countdown')
          if (!hasStartedCountdown.current) {
            hasStartedCountdown.current = true
            setStatus('active')
            setShowCountdown(true)
            setCountdown(3)
          }
        } else {
          // Reset flag to allow retry
          hasTriggeredStart.current = false
        }
        return
      }

      console.log('[Arena] Duel activated successfully')
      // Start countdown immediately (DB polling will catch this for other player)
      if (!hasStartedCountdown.current) {
        hasStartedCountdown.current = true
        setStatus('active')
        setShowCountdown(true)
        setCountdown(3)
      }
    }

    // Add random delay (0-500ms) to reduce chance of simultaneous updates
    const delay = Math.random() * 500
    const timer = setTimeout(triggerStart, delay)
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
              setWinnerId(payload.payload.winnerId ?? payload.payload.userId)
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

  const broadcastFinish = useCallback(async (finalWinnerId: string) => {
    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'finish_game',
        payload: { userId, winnerId: finalWinnerId, timestamp: Date.now() }
      })
    }
  }, [userId])

  const handleFinish = useCallback(async () => {
    const response = await fetch(`/api/arena/duels/${duelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'finish' }),
    }).catch(() => null)

    const finalDuel = response ? await response.json().catch(() => null) : null
    const finalWinnerId = finalDuel?.winner_id ?? userId

    await broadcastFinish(finalWinnerId)
    setWinnerId(finalWinnerId)
    setStatus('finished')
  }, [duelId, userId, broadcastFinish])

  const handleNext = useCallback((correct: boolean) => {
    if (gameType === 'matching') {
      return
    }

    setTimeout(() => {
      const nextIndex = currentCardIndex + 1
      const newScore = correct ? myScore + 1 : myScore
      const newWrong = correct ? myWrong : myWrong + 1

      setMyScore(newScore)
      setMyWrong(newWrong)
      setMyProgress(nextIndex)
      setCurrentCardIndex(nextIndex)

      broadcastProgress(nextIndex, newScore, newWrong)

      if (nextIndex >= totalCards) {
        handleFinish()
      }
    }, 800)
  }, [currentCardIndex, myScore, myWrong, totalCards, gameType, broadcastProgress, handleFinish])

  const handleMatchingCorrect = useCallback(() => {
    const newMatchedCount = myProgress + 1
    setMyScore(prev => prev + 1)
    setMyProgress(newMatchedCount)
    broadcastProgress(newMatchedCount, myScore + 1, myWrong)
  }, [myProgress, myScore, myWrong, broadcastProgress])

  const handleMatchingWrong = useCallback(() => {
    setMyWrong(prev => prev + 1)
  }, [])

  const handleMatchingFinish = useCallback(() => {
    handleFinish()
  }, [handleFinish])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const myPercent = totalCards > 0 ? (myProgress / totalCards) * 100 : 0
  const opponentPercent = totalCards > 0 ? (opponentProgress / totalCards) * 100 : 0

  if (status === 'cancelled') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="premium-card max-w-lg p-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-[var(--color-text-subtle)]" />
          <h2 className="mt-5 text-3xl font-bold text-[var(--color-text)]">Duel cancelled</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Este duelo não está mais disponível.
          </p>
          <button
            type="button"
            onClick={() => router.push('/arena')}
            className="btn-primary mt-8"
          >
            Voltar para Arena
          </button>
        </div>
      </div>
    )
  }

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
                className="absolute inset-0 rounded-full border-2 border-[rgba(70,98,89,0.25)]"
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
                background: '#ffffff',
                boxShadow: '0 12px 30px -8px rgba(70, 98, 89, 0.16)',
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Swords className="h-10 w-10 sm:h-12 sm:w-12 text-[var(--color-primary)]" />
            </m.div>
          </div>

          <h2 className="mb-2 text-xl font-bold text-[var(--color-text)] sm:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            Seeking Opponent
          </h2>
          <p className="mb-4 text-xs text-[var(--color-text-muted)] sm:mb-6 sm:text-sm">
            Searching the global registry for an academic rival matching your B2 level.
          </p>

          {/* Versus card */}
          <m.div
            className="rounded-xl border border-[rgba(193,200,196,0.3)] bg-white p-3 shadow-[0_18px_40px_rgba(27,28,24,0.08)] sm:rounded-2xl sm:p-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-text)] font-bold text-xs sm:h-10 sm:w-10 sm:text-sm">
                    {me.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white sm:h-3 sm:w-3 ${isMeConnected ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-subtle)]'}`} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-[var(--color-text-subtle)] sm:text-xs">You</p>
                  <p className="max-w-[80px] truncate text-xs font-bold text-[var(--color-text)] sm:max-w-[120px] sm:text-sm">{me.username}</p>
                </div>
              </div>

              <m.div
                animate={isOpponentConnected && isMeConnected ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className={`h-5 w-5 sm:h-6 sm:w-6 ${isOpponentConnected && isMeConnected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-subtle)]'}`} fill="currentColor" />
              </m.div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-[var(--color-text-subtle)] sm:text-xs">Opponent</p>
                  <p className="max-w-[80px] truncate text-xs font-bold text-[var(--color-text)] sm:max-w-[120px] sm:text-sm">{opponent.username}</p>
                </div>
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-text)] font-bold text-xs sm:h-10 sm:w-10 sm:text-sm">
                    {opponent.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`absolute -left-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white sm:h-3 sm:w-3 ${isOpponentConnected ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-subtle)]'}`} />
                </div>
              </div>
            </div>
          </m.div>

          <m.div
            className="mt-6 flex flex-col items-center justify-center gap-2"
          >
            {!isOpponentConnected ? (
              <>
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Waiting for rival to join...
                </div>
                {opponentJoinTimeout !== null && (
                  <div className="text-[10px] text-[var(--color-text-subtle)]">
                    Timeout em {opponentJoinTimeout}s
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)]">
                <Zap className="h-3.5 w-3.5 animate-pulse" />
                Match found. Initiating...
              </div>
            )}
            {connectionError && (
              <div className="mt-1 text-xs text-[var(--color-error)]">
                {connectionError}
              </div>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-widest text-[var(--color-text-subtle)]">
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
                background: '#ffffff',
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
        const duration = 3 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now()
          if (timeLeft <= 0) return clearInterval(interval)

          const particleCount = 50 * (timeLeft / duration)
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
        }, 250)
      })
    }

    return (
      <div className="flex min-h-[90vh] items-center justify-center p-4 sm:p-6">
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-[var(--color-surface-container-lowest)] p-8 shadow-[0_30px_80px_rgba(27,28,24,0.10)] sm:p-12"
        >
          <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl ${iWon ? 'bg-[rgba(115,88,2,0.10)]' : 'bg-[rgba(70,98,89,0.08)]'}`} />

          <div className="relative text-center">
            <m.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex justify-center"
            >
              <div className={`flex h-20 w-20 items-center justify-center rounded-3xl ${iWon ? 'bg-[rgba(115,88,2,0.08)] text-[var(--color-accent)]' : 'bg-[var(--color-surface-container-low)] text-[var(--color-primary)]'}`}>
                {iWon ? <Crown className="h-10 w-10" /> : <Shield className="h-10 w-10" />}
              </div>
            </m.div>

            <m.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className={`text-xs font-bold uppercase tracking-[0.24em] ${iWon ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-subtle)]'}`}>
                {iWon ? 'Victory secured' : 'Battle closed'}
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
                {iWon ? 'Excellent work.' : 'Good duel.'}
              </h2>
            </m.div>

            <m.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', damping: 15 }}
              className="my-12 flex items-center justify-center gap-6 sm:gap-12"
            >
              <div className="text-center">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">Você</p>
                <span className={`text-6xl font-black tabular-nums sm:text-8xl ${iWon ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{myScore}</span>
              </div>
              <div className="h-12 w-px bg-[rgba(193,200,196,0.45)] sm:h-20" />
              <div className="text-center">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">Oponente</p>
                <span className="text-6xl font-black tabular-nums text-[var(--color-text-subtle)] sm:text-8xl">{opponentScore}</span>
              </div>
            </m.div>

            <m.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mx-auto max-w-sm rounded-3xl border border-[rgba(193,200,196,0.35)] bg-[var(--color-surface-container-low)] p-6"
            >
              <div className="grid grid-cols-2 gap-8">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">Tempo total</p>
                  <p className="mt-1 text-lg font-bold text-[var(--color-text)]">{formatTime(elapsedTime)}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">Erros</p>
                  <p className="mt-1 text-lg font-bold text-[var(--color-error)]">{myWrong}</p>
                </div>
              </div>
            </m.div>

            <m.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={() => router.push('/home')}
              className="group mt-12 inline-flex items-center gap-3 rounded-full bg-[var(--color-primary)] px-10 py-5 text-sm font-bold text-white transition-all hover:bg-[var(--color-primary-container)] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Voltar ao Início
            </m.button>
          </div>
        </m.div>
      </div>
    )
  }

  // --- ACTIVE GAME STATE ---
  // BUT only show game if opponent has fresh heartbeat
  // If opponent left, show waiting screen
  if (!isOpponentConnected) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm w-full"
        >
          <div className="relative mx-auto mb-6 h-24 w-24">
            <Loader2 className="h-24 w-24 animate-spin text-[var(--color-primary)]" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[var(--color-text)]">
            Aguardando {opponent.username}
          </h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            O oponente não está mais presente. Aguardando retorno...
          </p>
          <button
            onClick={() => router.push('/arena')}
            className="btn-secondary"
          >
            Sair do Duelo
          </button>
        </m.div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-3 pb-20 sm:px-4 sm:pb-24 lg:px-6">
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 overflow-hidden rounded-2xl sm:mb-6 sm:rounded-[1.75rem] border border-red-900/30 dark:border-red-900/50"
        style={{
          background: 'var(--color-surface, rgba(255,255,255,0.95))',
          backgroundImage: 'radial-gradient(ellipse at top, rgba(220, 38, 38, 0.08) 0%, transparent 70%)',
          boxShadow: '0 18px 44px rgba(220, 38, 38, 0.15), inset 0 0 20px rgba(220, 38, 38, 0.05)',
        }}
      >
        <div className="p-4 sm:p-5 lg:p-6 relative">
          {/* Bloody glowing accents */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-600 blur-[2px] opacity-70" />
          
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Flame className="h-4 w-4 text-red-600 sm:h-5 sm:w-5 animate-pulse" />
              <span className="max-w-[140px] truncate text-[10px] font-bold uppercase tracking-[0.15em] text-red-800/80 dark:text-red-400/80 sm:max-w-none sm:text-xs drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">
                {packName}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-red-900/20 bg-red-50/50 dark:bg-red-950/30 px-2 py-0.5 sm:gap-1.5 sm:px-3 sm:py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping sm:h-2 sm:w-2" />
              <span className="text-[10px] font-bold text-red-700 dark:text-red-400 tabular-nums sm:text-xs">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2 sm:gap-4 lg:gap-6 relative z-10">
            {/* Player 1 (Me) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold text-xs sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                    {me.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <p className="text-[10px] font-semibold text-red-600/70 dark:text-red-400/70 sm:text-xs">Você</p>
                    <p className="truncate text-xs font-bold text-[var(--color-text)] sm:text-sm">{me.username}</p>
                  </div>
                </div>
                <span className="text-xl font-black text-red-600 dark:text-red-500 tabular-nums sm:text-2xl drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]">
                  {myProgress}<span className="text-xs text-red-800/50 dark:text-red-400/50 sm:text-sm">/{totalCards}</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-red-950/10 dark:bg-red-950/30 border border-red-900/10 sm:h-3">
                <m.div
                  className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${myPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-2 text-left sm:hidden">
                 <p className="truncate text-[10px] font-bold text-[var(--color-text)]">{me.username}</p>
              </div>
            </div>

            {/* VS Swords */}
            <m.div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-900/30 bg-red-50/80 dark:bg-red-950/50 sm:h-12 sm:w-12 shadow-[0_0_15px_rgba(220,38,38,0.3)] relative"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute inset-0 rounded-xl bg-red-600/20 blur-md animate-pulse" />
              <Swords className="h-5 w-5 text-red-600 dark:text-red-500 lg:h-6 lg:w-6 relative z-10" />
            </m.div>

            {/* Player 2 (Opponent) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xl font-black text-[var(--color-text-subtle)] tabular-nums sm:text-2xl opacity-80">
                  {opponentProgress}<span className="text-xs text-[var(--color-text-subtle)]/70 sm:text-sm">/{totalCards}</span>
                </span>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 hidden sm:block text-right">
                    <p className="text-[10px] font-semibold text-[var(--color-text-subtle)] sm:text-xs">Oponente</p>
                    <p className="truncate text-xs font-bold text-[var(--color-text)] sm:text-sm">{opponent.username}</p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)] font-bold text-xs sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm border border-[rgba(193,200,196,0.3)]">
                    {opponent.username.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-container)] border border-[rgba(193,200,196,0.1)] sm:h-3">
                <m.div
                  className="h-full rounded-full bg-[var(--color-text-subtle)] opacity-70"
                  initial={{ width: 0 }}
                  animate={{ width: `${opponentPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-2 text-right sm:hidden">
                 <p className="truncate text-[10px] font-bold text-[var(--color-text)]">{opponent.username}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600/80 dark:text-red-400/80 sm:text-xs">Score</span>
              <span className="text-sm font-black text-red-600 dark:text-red-500 sm:text-base drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]">{myScore}</span>
            </div>
            <div className="h-3 w-px bg-red-900/20 dark:bg-red-900/40 sm:h-4" />
            <div className="flex items-center gap-1.5 sm:gap-2 opacity-80">
              <span className="text-sm font-black text-[var(--color-text-subtle)] sm:text-base">{opponentScore}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)] sm:text-xs">Score</span>
            </div>
          </div>
        </div>
      </m.div>

      <AnimatePresence mode="wait">
        <m.div
          key={gameType === 'matching' ? 'matching' : `${gameType}-${currentCardIndex}`}
          initial={{ opacity: 0, x: 30, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {gameType === 'matching' ? (
            <ArenaMatchingGame
              cards={arenaCards}
              onCorrect={handleMatchingCorrect}
              onWrong={handleMatchingWrong}
              onFinish={handleMatchingFinish}
            />
          ) : gameType === 'flashcard' && currentCardIndex < cards.length ? (
            <Flashcard
              card={cards[currentCardIndex]}
              onCorrect={() => handleNext(true)}
              onWrong={() => handleNext(false)}
            />
          ) : gameType === 'typing' && currentCardIndex < cards.length ? (
            <TypingMode
              card={cards[currentCardIndex]}
              onCorrect={() => handleNext(true)}
              onWrong={() => handleNext(false)}
            />
          ) : currentCardIndex < cards.length && (
            <MultipleChoice
              card={cards[currentCardIndex]}
              allCards={cards}
              onCorrect={() => handleNext(true)}
              onWrong={() => handleNext(false)}
            />
          )}
        </m.div>
      </AnimatePresence>

      <m.div
        className="mt-4 sm:mt-6 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-1.5 rounded-full border border-[rgba(193,200,196,0.3)] bg-white/90 px-3 py-1.5 shadow-sm sm:gap-2 sm:px-4 sm:py-2">
          <span className="text-[10px] font-semibold text-[var(--color-text-subtle)] sm:text-xs">
            {gameType === 'matching' ? 'Pares' : 'Carta'}
          </span>
          <span className="text-xs font-black text-[var(--color-text)] sm:text-sm">
            {gameType === 'matching' ? myProgress : Math.min(currentCardIndex + 1, totalCards)}
          </span>
          <span className="text-[10px] text-[var(--color-text-subtle)]/70 sm:text-xs">/</span>
          <span className="text-xs font-bold text-[var(--color-text-subtle)] sm:text-sm">{totalCards}</span>
        </div>
      </m.div>
    </div>
  )
}
