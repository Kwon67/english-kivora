'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MultipleChoice from '@/components/game/MultipleChoice'
import ArenaMatchingGame from '@/components/game/ArenaMatchingGame'
import Flashcard from '@/components/game/Flashcard'
import TypingMode from '@/components/game/TypingMode'
import ListeningMode from '@/components/game/ListeningMode'
import SpeakingMode from '@/components/game/SpeakingMode'
import type { Card } from '@/types/database.types'
import { Swords, Loader2, Crown, Shield, Flame, Zap, ArrowLeft, Worm } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'

const OPPONENT_JOIN_TIMEOUT_SECONDS = 90
const ARENA_TIME_LIMIT_SECONDS = 5 * 60
const SNAKE_POWER_STREAK_TARGET = 3
const SNAKE_POWER_BLOCK_SECONDS = 20

function countArenaEvents(events: unknown) {
  return Array.isArray(events) ? events.length : 0
}

function getTrailingCorrectStreak(events: Array<{ correct: boolean }>) {
  let streak = 0

  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (!events[index]?.correct) break
    streak += 1
  }

  return streak
}

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
  player1Events?: Array<{ timeMs: number, correct: boolean }> | null
  player2Events?: Array<{ timeMs: number, correct: boolean }> | null
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
  // initialPlayer1JoinedAt,
  // initialPlayer2JoinedAt,
  gameType,
  player1Events,
  player2Events
  }: ArenaClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [winnerId, setWinnerId] = useState(initialWinnerId)

  const [myProgress, setMyProgress] = useState(0)
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [myWrong, setMyWrong] = useState(0)
  const [opponentWrong, setOpponentWrong] = useState(0)
  const [correctStreak, setCorrectStreak] = useState(0)
  const [snakePowerUsed, setSnakePowerUsed] = useState(false)
  const [snakeBlockRemaining, setSnakeBlockRemaining] = useState(0)
  const [snakeBlockStartedAt, setSnakeBlockStartedAt] = useState(0)
  const [isOpponentConnected, setIsOpponentConnected] = useState(false)
  const [isMeConnected, setIsMeConnected] = useState(false)
  // const [isPlayer1Joined, setIsPlayer1Joined] = useState(!!initialPlayer1JoinedAt)
  // const [isPlayer2Joined, setIsPlayer2Joined] = useState(!!initialPlayer2JoinedAt)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [opponentJoinTimeout, setOpponentJoinTimeout] = useState<number | null>(null)

  const [myEvents, setMyEvents] = useState<{ timeMs: number; correct: boolean }[]>([])
  const [ghostReplayMode, setGhostReplayMode] = useState(false)

  // Queue system for spaced repetition: stores indices of cards yet to be completed
  const [cardQueue, setCardQueue] = useState<number[]>([])
  // Set of card indices that have been answered correctly
  const [completedCards, setCompletedCards] = useState<Set<number>>(new Set())

  const [countdown, setCountdown] = useState<number | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [gameStartedAt, setGameStartedAt] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameChannelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const finishRetryCountRef = useRef(0)
  const MAX_FINISH_RETRIES = 3
  const hasTriggeredConfetti = useRef(false)
  const hasTriggeredStart = useRef(false)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const opponentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFinishingRef = useRef(false)
  const scoreRef = useRef(0)
  const wrongRef = useRef(0)
  const progressRef = useRef(0)
  const snakeBlockUntilRef = useRef<number | null>(null)
  const eventsRef = useRef<{ timeMs: number; correct: boolean }[]>([])
  const reportedCardRef = useRef<{ index: number; score: number; wrong: number } | null>(null)
  const cardQueueRef = useRef<number[]>([])
  const completedCardsRef = useRef<Set<number>>(new Set())

  const isPlayer1 = userId === player1.id
  const me = isPlayer1 ? player1 : player2
  const opponent = isPlayer1 ? player2 : player1
  const hasStartedCountdown = useRef(false)
  const arenaCards = useMemo(
    () => cards.slice(0, 10),
    [cards]
  )
  const totalCards = arenaCards.length

  // Initialize queue on first mount or when arenaCards changes
  useEffect(() => {
    if (arenaCards.length > 0 && cardQueue.length === 0 && completedCards.size === 0) {
      const initialQueue = Array.from({ length: arenaCards.length }, (_, i) => i)
      setCardQueue(initialQueue)
      cardQueueRef.current = initialQueue
    }
  }, [arenaCards, cardQueue.length, completedCards.size])

  const normalizedGameType = gameType.toLowerCase()
  const snakePowerEnabled = ['listening', 'speaking', 'escuta', 'fala'].includes(normalizedGameType)
  const snakePowerReady = snakePowerEnabled && correctStreak >= SNAKE_POWER_STREAK_TARGET && !snakePowerUsed
  const isSnakeBlocked = snakeBlockRemaining > 0

  useEffect(() => {
    if (!snakePowerEnabled) return

    setSnakePowerUsed(localStorage.getItem(`arena-snake-used:${duelId}:${userId}`) === '1')
  }, [duelId, snakePowerEnabled, userId])

  useEffect(() => {
    if (status !== 'active' || snakeBlockStartedAt === 0 || snakeBlockUntilRef.current === null) {
      setSnakeBlockRemaining(0)
      return
    }

    const updateRemaining = () => {
      if (snakeBlockUntilRef.current === null) {
        setSnakeBlockRemaining(0)
        return
      }

      const remaining = Math.max(0, Math.ceil((snakeBlockUntilRef.current - Date.now()) / 1000))
      setSnakeBlockRemaining(remaining)

      if (remaining <= 0) {
        snakeBlockUntilRef.current = null
      }
    }

    updateRemaining()
    const interval = setInterval(updateRemaining, 250)
    return () => clearInterval(interval)
  }, [snakeBlockStartedAt, status])

  // Elapsed time counter during active game
  useEffect(() => {
    if (status === 'active' && gameStartedAt !== null && !timerRef.current) {
      timerRef.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - gameStartedAt) / 1000)
        setElapsedTime(Math.min(seconds, ARENA_TIME_LIMIT_SECONDS))
      }, 250)
    }
    if ((status !== 'active' || gameStartedAt === null) && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameStartedAt, status])

  // Use ref to avoid stale closure in realtime callbacks
  const statusRef = useRef(status)
  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { scoreRef.current = myScore }, [myScore])
  useEffect(() => { wrongRef.current = myWrong }, [myWrong])
  useEffect(() => { progressRef.current = myProgress }, [myProgress])
  useEffect(() => { eventsRef.current = myEvents }, [myEvents])
  useEffect(() => { cardQueueRef.current = cardQueue }, [cardQueue])
  useEffect(() => { completedCardsRef.current = completedCards }, [completedCards])

  // Mark current player as joined and start heartbeat on mount
  useEffect(() => {
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

    // Send heartbeat immediately to mark as joined
    sendHeartbeat()

    // Then every 3 seconds to maintain presence
    const intervalId = setInterval(sendHeartbeat, 3000)
    heartbeatIntervalRef.current = intervalId

    return () => {
      clearInterval(intervalId)
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

    // If opponent has already played (ghost events exist), start game immediately in ghost mode
    const opponentEventsRaw = isPlayer1 ? player2Events : player1Events
    const opponentHasGhost = Array.isArray(opponentEventsRaw) && opponentEventsRaw.length > 0

    if (opponentHasGhost) {
      setIsOpponentConnected(true)
      setGhostReplayMode(true)
      
      if (status === 'pending' && !hasTriggeredStart.current) {
        hasTriggeredStart.current = true
        console.log('[Arena] Opponent ghost found (pending), starting countdown...')
        const supabase = createClient()
        supabase.from('arena_duels').update({
          status: 'active',
          started_at: new Date().toISOString()
        }).eq('id', duelId).eq('status', 'pending')
        
        setStatus('active')
        setShowCountdown(true)
        setCountdown(3)
      }
      // Ghost duel created with status='active': start countdown directly
      if (status === 'active' && !hasStartedCountdown.current) {
        hasStartedCountdown.current = true
        hasTriggeredStart.current = true
        console.log('[Arena] Opponent ghost found (active), starting countdown...')
        setShowCountdown(true)
        setCountdown(3)
      }
      // Skip polling when ghost is active
      if (status === 'active') return
    }

    const pollInterval = setInterval(async () => {
      if (opponentHasGhost) return // No need to poll if ghost is active

      const response = await fetch(`/api/arena/duels/${duelId}`, { cache: 'no-store' }).catch(() => null)
      const duel = response ? await response.json().catch(() => null) : null

      if (!duel || response?.ok === false) return

      // Check heartbeat freshness for real presence detection
      const p1HeartbeatFresh = isHeartbeatFresh(duel.player1_joined_at)
      const p2HeartbeatFresh = isHeartbeatFresh(duel.player2_joined_at)
      
  // Only consider player "joined" if they have fresh heartbeat
      // setIsPlayer1Joined(p1HeartbeatFresh)
      // setIsPlayer2Joined(p2HeartbeatFresh)
      setIsMeConnected(isPlayer1 ? p1HeartbeatFresh : p2HeartbeatFresh)
      setIsOpponentConnected(isPlayer1 ? p2HeartbeatFresh : p1HeartbeatFresh)

      // Check if duel is pending and both players have fresh heartbeats
      // We trigger an update to 'active'. Only the first update succeeds due to the pending check.
      if (duel.status === 'pending' && p1HeartbeatFresh && p2HeartbeatFresh && !hasTriggeredStart.current) {
        hasTriggeredStart.current = true
        console.log('[Arena] Both players present, activating duel in DB...')
        const supabase = createClient()
        supabase.from('arena_duels').update({
          status: 'active',
          started_at: new Date().toISOString()
        }).eq('id', duelId).eq('status', 'pending').then(({ error }) => {
          if (error) {
            console.error('[Arena] Failed to activate duel:', error)
            hasTriggeredStart.current = false // allow retry if it wasn't already active
          }
        })
        return
      }

      // Check if duel is active and both players have fresh heartbeats
      // BOTH conditions must be true to start the game
      if (duel.status === 'active' && p1HeartbeatFresh && p2HeartbeatFresh && !hasStartedCountdown.current) {
        console.log('[Arena] Polling: duel active + both players present -> starting countdown')
        hasStartedCountdown.current = true
        hasTriggeredStart.current = true
        setStatus('active')
        setShowCountdown(true)
        setCountdown(3)
        return
      }
      
      // If duel is active but one player doesn't have fresh heartbeat, wait
      if (duel.status === 'active' && !hasStartedCountdown.current) {
        console.log('[Arena] Duel active but waiting for both heartbeats fresh')
        // Don't start countdown yet
        return
      }

      if (duel.status === 'finished') {
        setWinnerId(duel.winner_id)
        setMyScore(isPlayer1 ? duel.player1_score : duel.player2_score)
        setOpponentScore(isPlayer1 ? duel.player2_score : duel.player1_score)
        setMyWrong(isPlayer1 ? duel.player1_wrong : duel.player2_wrong)
        setOpponentWrong(isPlayer1 ? duel.player2_wrong : duel.player1_wrong)
        setMyProgress(isPlayer1 ? countArenaEvents(duel.player1_events) : countArenaEvents(duel.player2_events))
        setOpponentProgress(isPlayer1 ? countArenaEvents(duel.player2_events) : countArenaEvents(duel.player1_events))
        setStatus('finished')
        return
      }

      if (duel.status === 'cancelled') {
        setStatus('cancelled')
      }
    }, 1500)

    return () => clearInterval(pollInterval)
  }, [status, duelId, isPlayer1, player1Events, player2Events])

  // Timeout: cancel duel if one player enters but the opponent never arrives.
  useEffect(() => {
    if (status !== 'pending' || hasTriggeredStart.current) return

    // Only start timeout if I've joined but opponent hasn't
    if (isMeConnected && !isOpponentConnected) {
      opponentTimeoutRef.current = setTimeout(async () => {
        console.log('[Arena] Opponent did not join before timeout, cancelling duel')
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
      }, OPPONENT_JOIN_TIMEOUT_SECONDS * 1000)

      // Update countdown display
      let secondsLeft = OPPONENT_JOIN_TIMEOUT_SECONDS
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

  // REMOVED: Simplified game start logic
  // Game start is now controlled ONLY by the polling useEffect above
  // This ensures both players see the same state based on DB status
  // Both players send heartbeat, but only when BOTH have fresh heartbeat AND status='active'
  // the countdown starts (simultaneously for both)

  // Ghost Replay Logic: update opponent progress based on recorded events as time elapses
  useEffect(() => {
    if (status !== 'active' || !ghostReplayMode) return
    
    const opponentEventsRaw = isPlayer1 ? player2Events : player1Events
    if (!Array.isArray(opponentEventsRaw) || opponentEventsRaw.length === 0) return

    const currentTimeMs = elapsedTime * 1000
    
    // Find how many events have happened up to this point
    const pastEvents = opponentEventsRaw.filter(e => e.timeMs <= currentTimeMs)
    const newProgress = (pastEvents.length / totalCards) * 100
    
    // Simple score estimation for ghost: 10 points per correct answer
    const newScore = pastEvents.reduce((acc, e) => acc + (e.correct ? 10 : 0), 0)
    const newWrong = pastEvents.filter(e => !e.correct).length

    setOpponentProgress(newProgress)
    setOpponentScore(newScore)
    setOpponentWrong(newWrong)

    // If ghost finished all cards, and I haven't, don't auto-finish for me, 
    // but the opponent bar will be at 100%
  }, [elapsedTime, status, ghostReplayMode, isPlayer1, player1Events, player2Events, totalCards])

  // Realtime subscriptions: only for progress broadcasting during active game
  useEffect(() => {
    if (status !== 'active' || ghostReplayMode) return
    
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
          .on('broadcast', { event: 'snake_block' }, (payload) => {
            if (isUnmounted) return
            if (payload.payload.targetUserId === userId && statusRef.current === 'active') {
              snakeBlockUntilRef.current = Date.now() + SNAKE_POWER_BLOCK_SECONDS * 1000
              setSnakeBlockRemaining(SNAKE_POWER_BLOCK_SECONDS)
              setSnakeBlockStartedAt(Date.now())
            }
          })
          .on('broadcast', { event: 'finish_game' }, (payload) => {
            if (isUnmounted) return
            if (payload.payload.userId !== userId) {
              console.log('[Arena] Other player finished, updating status')
              setWinnerId(typeof payload.payload.winnerId === 'string' ? payload.payload.winnerId : null)
              if (typeof payload.payload.score === 'number') {
                setOpponentScore(payload.payload.score)
              }
              if (typeof payload.payload.wrong === 'number') {
                setOpponentWrong(payload.payload.wrong)
              }
              if (typeof payload.payload.progress === 'number') {
                setOpponentProgress(payload.payload.progress)
              }
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
  }, [duelId, userId, status, ghostReplayMode])


  const gameStartTimeRef = useRef<number | null>(null)
  const ghostNextEventIndexRef = useRef(0)

  // Countdown logic
  useEffect(() => {
    if (!showCountdown || countdown === null) return

    if (countdown <= 0) {
      setShowCountdown(false)
      setCountdown(null)
      const startedAt = Date.now()
      gameStartTimeRef.current = startedAt
      setGameStartedAt(startedAt)
      setElapsedTime(0)
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, showCountdown])

  // Ghost Replay logic
  useEffect(() => {
    if (!ghostReplayMode || status !== 'active' || !gameStartTimeRef.current) return

    const opponentEventsRaw = isPlayer1 ? player2Events : player1Events
    if (!Array.isArray(opponentEventsRaw)) return

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - gameStartTimeRef.current!
      
      // Process any events that should have happened by now
      let updated = false
      let newOpponentProgress = opponentProgress
      let newOpponentScore = opponentScore
      let newOpponentWrong = opponentWrong

      while (ghostNextEventIndexRef.current < opponentEventsRaw.length) {
        const nextEvent = opponentEventsRaw[ghostNextEventIndexRef.current]
        if (nextEvent && typeof nextEvent.timeMs === 'number' && nextEvent.timeMs <= elapsedMs) {
          // Apply event
          updated = true
          if (nextEvent.correct) {
            newOpponentScore++
          } else {
            newOpponentWrong++
          }
          if (gameType !== 'matching') {
            newOpponentProgress++
          } else if (nextEvent.correct) {
            newOpponentProgress++
          }
          ghostNextEventIndexRef.current++
        } else {
          break
        }
      }

      if (updated) {
        setOpponentProgress(newOpponentProgress)
        setOpponentScore(newOpponentScore)
        setOpponentWrong(newOpponentWrong)
      }

    }, 100)

    return () => clearInterval(interval)
  }, [ghostReplayMode, status, opponentProgress, opponentScore, opponentWrong, gameType, totalCards, isPlayer1, player1Events, player2Events])


  const broadcastProgress = useCallback(async (
    newProgress: number,
    newScore: number,
    newWrong: number,
    persistScore = true
  ) => {
    // Speaking mode scores are server-authoritative (a DB trigger blocks client-side score updates).
    // Only persist scores for non-speaking game types.
    if (persistScore && gameType !== 'speaking') {
      const supabase = createClient()
      const scoreField = isPlayer1 ? 'player1_score' : 'player2_score'
      const wrongField = isPlayer1 ? 'player1_wrong' : 'player2_wrong'

      supabase
        .from('arena_duels')
        .update({ [scoreField]: newScore, [wrongField]: newWrong })
        .eq('id', duelId)
        .then(({ error }) => {
          if (error) console.error('[Arena] Failed to persist score:', error)
        })
    }

    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'progress',
        payload: { userId, progress: newProgress, score: newScore, wrong: newWrong }
      })
    }
  }, [duelId, isPlayer1, userId, gameType])

  const broadcastFinish = useCallback(async (
    finalWinnerId: string | null,
    finalScore: number,
    finalWrong: number,
    finalProgress: number
  ) => {
    if (gameChannelRef.current) {
      await gameChannelRef.current.send({
        type: 'broadcast',
        event: 'finish_game',
        payload: {
          userId,
          winnerId: finalWinnerId,
          score: finalScore,
          wrong: finalWrong,
          progress: finalProgress,
          timestamp: Date.now(),
        }
      })
    }
  }, [userId])

  const handleSnakePower = useCallback(async () => {
    if (!snakePowerReady || !gameChannelRef.current || ghostReplayMode) return

    setSnakePowerUsed(true)
    localStorage.setItem(`arena-snake-used:${duelId}:${userId}`, '1')

    await gameChannelRef.current.send({
      type: 'broadcast',
      event: 'snake_block',
      payload: {
        userId,
        targetUserId: opponent.id,
        durationSeconds: SNAKE_POWER_BLOCK_SECONDS,
        timestamp: Date.now(),
      },
    })
  }, [duelId, ghostReplayMode, opponent.id, snakePowerReady, userId])

  const handleFinishSuccess = useCallback(async (
    finalDuel: { winner_id?: string | null; player1_events?: unknown; player2_events?: unknown },
    finalScore: number,
    finalWrong: number,
    finalProgress: number
  ) => {
    const finalWinnerId = typeof finalDuel?.winner_id === 'string' ? finalDuel.winner_id : null

    await broadcastFinish(finalWinnerId, finalScore, finalWrong, finalProgress)
    setMyScore(finalScore)
    setMyWrong(finalWrong)
    setMyProgress(isPlayer1 ? Math.max(finalProgress, countArenaEvents(finalDuel.player1_events)) : countArenaEvents(finalDuel.player2_events))
    setOpponentProgress(isPlayer1 ? countArenaEvents(finalDuel.player2_events) : countArenaEvents(finalDuel.player1_events))
    setWinnerId(finalWinnerId)
    setStatus('finished')
    return true
  }, [broadcastFinish, isPlayer1])

  const handleFinish = useCallback(async (
    finalScore = scoreRef.current,
    finalWrong = wrongRef.current,
    finalProgress = progressRef.current
  ) => {
    if (isFinishingRef.current || statusRef.current === 'finished' || statusRef.current === 'cancelled') return

    isFinishingRef.current = true
    finishRetryCountRef.current = 0

    const attemptFinish = async (): Promise<boolean> => {
      const response = await fetch(`/api/arena/duels/${duelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'finish', 
          score: finalScore, 
          wrong: finalWrong,
          progress: finalProgress,
          opponentScore,
          opponentWrong,
          opponentProgress,
          events: eventsRef.current
        }),
      }).catch(() => null)

      const finalDuel = response ? await response.json().catch(() => null) : null

      if (!response?.ok || !finalDuel || finalDuel.status !== 'finished') {
        console.error(`[Arena] Failed to finish duel (attempt ${finishRetryCountRef.current + 1}/${MAX_FINISH_RETRIES}):`, finalDuel)

        finishRetryCountRef.current++
        if (finishRetryCountRef.current < MAX_FINISH_RETRIES) {
          // Wait before retrying (exponential backoff: 1s, 2s, 4s)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, finishRetryCountRef.current - 1)))
          return attemptFinish()
        }

        // All retries exhausted — force transition to finished state so the player isn't stuck
        console.warn('[Arena] All finish retries exhausted, forcing finished state on client')
        setConnectionError(null)
        setMyScore(finalScore)
        setMyWrong(finalWrong)
        setWinnerId(null) // Cannot determine winner without server confirmation
        setStatus('finished')
        isFinishingRef.current = false
        return false
      }

      return handleFinishSuccess(finalDuel, finalScore, finalWrong, finalProgress)
    }

    await attemptFinish()
  }, [duelId, opponentProgress, opponentScore, opponentWrong, handleFinishSuccess])

  useEffect(() => {
    if (
      status !== 'active' ||
      gameStartedAt === null ||
      showCountdown ||
      elapsedTime < ARENA_TIME_LIMIT_SECONDS ||
      isFinishingRef.current
    ) {
      return
    }

    handleFinish(scoreRef.current, wrongRef.current, progressRef.current)
  }, [elapsedTime, gameStartedAt, handleFinish, showCountdown, status])

  const handleNext = useCallback((correct: boolean, mode: 'report' | 'move' | 'both' = 'both') => {
    if (
      gameType === 'matching' ||
      statusRef.current !== 'active' ||
      isFinishingRef.current ||
      isSnakeBlocked ||
      elapsedTime >= ARENA_TIME_LIMIT_SECONDS ||
      cardQueueRef.current.length === 0
    ) {
      return
    }

    const currentCardIndex = cardQueueRef.current[0]
    let reportedResult = reportedCardRef.current?.index === currentCardIndex
      ? reportedCardRef.current
      : null

    if (mode === 'report' || mode === 'both') {
      if (!reportedResult) {
        const newScore = correct ? myScore + 1 : myScore
        const newWrong = correct ? myWrong : myWrong + 1
        const timeMs = gameStartTimeRef.current ? Date.now() - gameStartTimeRef.current : 0
        const newEvent = { timeMs, correct }
        const nextEvents = [...eventsRef.current, newEvent]

        reportedResult = { index: currentCardIndex, score: newScore, wrong: newWrong }
        reportedCardRef.current = reportedResult
        scoreRef.current = newScore
        wrongRef.current = newWrong
        eventsRef.current = nextEvents

        setMyScore(newScore)
        setMyWrong(newWrong)
        setMyEvents(nextEvents)
        if (snakePowerEnabled) {
          setCorrectStreak(getTrailingCorrectStreak(nextEvents))
        }

        broadcastProgress(currentCardIndex, newScore, newWrong)
      }
    }

    if (mode === 'move' || mode === 'both') {
      setTimeout(() => {
        if (
          statusRef.current !== 'active' ||
          isFinishingRef.current ||
          (snakeBlockUntilRef.current !== null && snakeBlockUntilRef.current > Date.now()) ||
          elapsedTime >= ARENA_TIME_LIMIT_SECONDS ||
          cardQueueRef.current.length === 0
        ) {
          return
        }

        const currentIdx = cardQueueRef.current[0]
        const currentQueue = [...cardQueueRef.current]
        const currentCompleted = new Set(completedCardsRef.current)
        
        // Remove the current card from the front of the queue
        currentQueue.shift()

        if (correct) {
          // Card completed correctly
          currentCompleted.add(currentIdx)
        } else {
          // Card wrong/skipped: Re-insert it into the queue
          // Insert it ~3 positions ahead, or at the end if the queue is shorter
          const insertPos = Math.min(3, currentQueue.length)
          currentQueue.splice(insertPos, 0, currentIdx)
        }

        const newProgress = currentCompleted.size
        
        progressRef.current = newProgress
        setMyProgress(newProgress)
        setCardQueue(currentQueue)
        setCompletedCards(currentCompleted)
        
        const finalScore = reportedResult?.score ?? myScore
        const finalWrong = reportedResult?.wrong ?? myWrong
        reportedCardRef.current = null
        
        broadcastProgress(newProgress, finalScore, finalWrong)

        if (newProgress >= totalCards) {
          handleFinish(finalScore, finalWrong, newProgress)
        }
      }, 800)
    }
  }, [elapsedTime, isSnakeBlocked, myScore, myWrong, snakePowerEnabled, totalCards, gameType, broadcastProgress, handleFinish])

  const handleMatchingCorrect = useCallback(() => {
    if (statusRef.current !== 'active' || isFinishingRef.current || elapsedTime >= ARENA_TIME_LIMIT_SECONDS) return

    const newMatchedCount = myProgress + 1
    setMyScore(prev => prev + 1)
    scoreRef.current = myScore + 1
    progressRef.current = newMatchedCount
    setMyProgress(newMatchedCount)
    const timeMs = gameStartTimeRef.current ? Date.now() - gameStartTimeRef.current : 0
    eventsRef.current = [...eventsRef.current, { timeMs, correct: true }]
    setMyEvents(eventsRef.current)
    broadcastProgress(newMatchedCount, myScore + 1, myWrong)
  }, [elapsedTime, myProgress, myScore, myWrong, broadcastProgress])

  const handleMatchingWrong = useCallback(() => {
    if (statusRef.current !== 'active' || isFinishingRef.current || elapsedTime >= ARENA_TIME_LIMIT_SECONDS) return

    setMyWrong(prev => {
      const newWrong = prev + 1
      const timeMs = gameStartTimeRef.current ? Date.now() - gameStartTimeRef.current : 0
      wrongRef.current = newWrong
      eventsRef.current = [...eventsRef.current, { timeMs, correct: false }]
      setMyEvents(eventsRef.current)
      broadcastProgress(myProgress, myScore, newWrong)
      return newWrong
    })
  }, [broadcastProgress, elapsedTime, myProgress, myScore])

  const handleMatchingFinish = useCallback(() => {
    handleFinish(scoreRef.current, wrongRef.current, progressRef.current)
  }, [handleFinish])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const myPercent = totalCards > 0 ? (myProgress / totalCards) * 100 : 0
  const opponentPercent = totalCards > 0 ? (opponentProgress / totalCards) * 100 : 0
  const remainingTime = Math.max(0, ARENA_TIME_LIMIT_SECONDS - elapsedTime)
  const timePercent = (remainingTime / ARENA_TIME_LIMIT_SECONDS) * 100
  const isFinalMinute = remainingTime <= 60
  const scoreDelta = myScore - opponentScore
  const currentRoundLabel = gameType === 'matching' ? 'Pares' : 'Concluídas'
  const currentRoundValue = gameType === 'matching' ? myProgress : completedCards.size
  const remainingCards = Math.max(0, totalCards - currentRoundValue)

  if (status === 'cancelled') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[linear-gradient(180deg,rgba(127,29,29,0.10),transparent_58%)] p-4">
        <div className="max-w-lg rounded-[2rem] border border-red-950/20 bg-[linear-gradient(180deg,var(--color-card),rgba(127,29,29,0.08))] p-8 text-center shadow-[0_22px_60px_rgba(127,29,29,0.12)]">
          <Shield className="mx-auto h-10 w-10 text-red-700" />
          <h2 className="mt-5 text-3xl font-black text-[var(--color-text)]">Duelo cancelado</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Este duelo não está mais disponível.
          </p>
          <button
            type="button"
            onClick={() => router.push('/arena')}
            className="mt-8 rounded-[1.1rem] bg-red-700 px-6 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(185,28,28,0.24)] hover:bg-red-600"
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
      <div className="flex min-h-[80vh] items-center justify-center bg-[linear-gradient(180deg,rgba(127,29,29,0.12),transparent_56%)] p-3 sm:p-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-[2rem] border border-red-950/25 bg-[linear-gradient(180deg,var(--color-card),rgba(127,29,29,0.10))] p-6 text-center shadow-[0_24px_70px_rgba(127,29,29,0.18)]"
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
            Arena travando alvo
          </p>
          <h2 className="mb-2 text-xl font-black text-[var(--color-text)] sm:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            Caçando Oponente
          </h2>
          <p className="mb-4 text-xs text-[var(--color-text-muted)] sm:mb-6 sm:text-sm">
            Esperando o rival atravessar o portão para iniciar o confronto.
          </p>

          {/* Versus card */}
          <m.div
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-3 shadow-[var(--shadow-lg)] sm:rounded-2xl sm:p-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-950/10 text-red-700 font-bold text-xs sm:h-10 sm:w-10 sm:text-sm">
                    {me.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface)] sm:h-3 sm:w-3 ${isMeConnected ? 'bg-red-600' : 'bg-[var(--color-text-subtle)]'}`} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-[var(--color-text-subtle)] sm:text-xs">Você</p>
                  <p className="max-w-[80px] truncate text-xs font-bold text-[var(--color-text)] sm:max-w-[120px] sm:text-sm">{me.username}</p>
                </div>
              </div>

              <m.div
                animate={isOpponentConnected && isMeConnected ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className={`h-5 w-5 sm:h-6 sm:w-6 ${isOpponentConnected && isMeConnected ? 'text-red-600' : 'text-[var(--color-text-subtle)]'}`} fill="currentColor" />
              </m.div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-[var(--color-text-subtle)] sm:text-xs">Oponente</p>
                  <div className="flex items-center gap-2">
                    <p className="max-w-[80px] truncate text-xs font-bold text-[var(--color-text)] sm:max-w-[120px] sm:text-sm">{opponent.username}</p>
                    {ghostReplayMode && (
                      <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-amber-600 border border-amber-500/20">
                        Fantasma
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-950/10 text-red-700 font-bold text-xs sm:h-10 sm:w-10 sm:text-sm">
                    {opponent.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`absolute -left-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface)] sm:h-3 sm:w-3 ${isOpponentConnected ? 'bg-red-600' : 'bg-[var(--color-text-subtle)]'}`} />
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-red-700" />
                  Aguardando rival entrar...
                </div>
                {opponentJoinTimeout !== null && (
                  <div className="text-[10px] text-[var(--color-text-subtle)]">
                    Tempo limite em {opponentJoinTimeout}s
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                <Zap className="h-3.5 w-3.5 animate-pulse" />
                Rival encontrado. Fechando portões...
              </div>
            )}
            {connectionError && (
              <div className="mt-1 text-xs text-[var(--color-error)]">
                {connectionError}
              </div>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-widest text-[var(--color-text-subtle)]">
              Estado: {status === 'pending' ? 'aguardando' : status === 'active' ? 'ativo' : status}
            </p>
          </m.div>
        </m.div>
      </div>
    )
  }

  // --- COUNTDOWN OVERLAY ---
  if (showCountdown && countdown !== null && countdown > 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[radial-gradient(circle_at_center,#450a0a_0%,#090202_58%,#000_100%)] backdrop-blur-md">
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
                background: '#ef4444',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: 'drop-shadow(0 8px 36px rgba(248, 113, 113, 0.72))',
              }}
            >
              {countdown}
            </m.span>
            <p className="mt-4 text-base font-black uppercase tracking-[0.2em] text-red-100/70 sm:text-lg">Sem piedade...</p>
          </m.div>
        </AnimatePresence>
      </div>
    )
  }

  // --- FINISHED STATE ---
  if (status === 'finished') {
    const iWon = winnerId === userId
    const isDraw = winnerId === null
    const winnerName = winnerId === userId ? me.username : winnerId === opponent.id ? opponent.username : null
    const resultKicker = isDraw ? 'Empate técnico' : iWon ? 'Vitória confirmada' : 'Duelo encerrado'
    const resultTitle = isDraw
      ? 'Ninguém levou a arena.'
      : iWon
        ? 'Você dominou a arena.'
        : `${winnerName ?? opponent.username} levou a arena.`
    const resultReason =
      myScore !== opponentScore
        ? `${winnerName ?? 'O vencedor'} ganhou por fazer mais pontos no placar.`
        : myProgress !== opponentProgress
          ? `Mesmo com placar ${myScore} x ${opponentScore}, ${winnerName ?? 'o vencedor'} ganhou no desempate por concluir mais frases: ${winnerId === userId ? myProgress : opponentProgress} contra ${winnerId === userId ? opponentProgress : myProgress}.`
          : myWrong !== opponentWrong
            ? `Mesmo com placar ${myScore} x ${opponentScore}, ${winnerName ?? 'o vencedor'} ganhou no desempate por cometer menos erros: ${winnerId === userId ? myWrong : opponentWrong} contra ${winnerId === userId ? opponentWrong : myWrong}.`
            : 'O placar, o avanço e os erros ficaram iguais. O duelo terminou empatado.'

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
      <div className="flex min-h-[90vh] items-center justify-center bg-[linear-gradient(180deg,rgba(127,29,29,0.14),transparent_62%)] p-4 sm:p-6">
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-red-950/25 bg-[linear-gradient(180deg,var(--color-surface-container-lowest),rgba(127,29,29,0.10))] p-8 shadow-[0_30px_90px_rgba(127,29,29,0.20)] sm:p-12"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,#991b1b,#ef4444,#991b1b,transparent)]" />

          <div className="relative text-center">
            <m.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex justify-center"
            >
              <div className={`flex h-20 w-20 items-center justify-center rounded-3xl ${iWon ? 'bg-red-950/10 text-red-700 shadow-[0_0_32px_rgba(220,38,38,0.20)]' : 'bg-[var(--color-surface-container-low)] text-[var(--color-primary)]'}`}>
                {iWon ? <Crown className="h-10 w-10" /> : <Shield className="h-10 w-10" />}
              </div>
            </m.div>

            <m.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className={`text-xs font-black uppercase tracking-[0.24em] ${iWon ? 'text-red-700' : 'text-[var(--color-text-subtle)]'}`}>
                {resultKicker}
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
                {resultTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm font-semibold leading-relaxed text-[var(--color-text-muted)]">
                {resultReason}
              </p>
            </m.div>

            <m.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', damping: 15 }}
              className="my-12 flex items-center justify-center gap-6 sm:gap-12"
            >
              <div className="text-center">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-subtle)]">Você</p>
                <span className={`text-6xl font-black tabular-nums sm:text-8xl ${iWon ? 'text-red-700 drop-shadow-[0_0_14px_rgba(220,38,38,0.24)]' : 'text-[var(--color-text)]'}`}>{myScore}</span>
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
              onClick={() => router.push('/arena')}
              className="group mt-12 inline-flex items-center gap-3 rounded-full bg-red-700 px-10 py-5 text-sm font-black text-white shadow-[0_18px_42px_rgba(185,28,28,0.28)] transition-all hover:bg-red-600 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Voltar para Arena
            </m.button>
          </div>
        </m.div>
      </div>
    )
  }

  // --- ACTIVE GAME STATE ---
  // Only block the game if opponent disconnected BEFORE the game actually started.
  // Once the game is running (gameStartedAt is set), let the player continue and finish normally
  // even if the opponent disconnects (they may have finished and left, or had network issues).
  if (!isOpponentConnected && !gameStartedAt && !ghostReplayMode) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[linear-gradient(180deg,rgba(127,29,29,0.10),transparent_58%)] p-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm w-full"
        >
          <div className="relative mx-auto mb-6 h-24 w-24">
            <Loader2 className="h-24 w-24 animate-spin text-red-700" />
          </div>
          <h2 className="mb-2 text-xl font-black text-[var(--color-text)]">
            {opponent.username} fugiu da arena
          </h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            O oponente não está mais presente. Aguardando retorno...
          </p>
          <button
            onClick={() => router.push('/arena')}
            className="rounded-[1.1rem] border border-red-950/20 bg-red-950/10 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-950/15"
          >
            Sair do Duelo
          </button>
        </m.div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto max-w-5xl px-3 pb-20 sm:px-4 sm:pb-24 lg:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden">
        <div className="absolute left-1/2 top-6 h-48 w-[min(720px,92vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(185,28,28,0.18),rgba(245,158,11,0.08)_42%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.62),rgba(127,29,29,0.08)_42%,transparent_70%)]" />
      </div>
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 overflow-hidden rounded-[1.35rem] border border-red-950/25 bg-[linear-gradient(145deg,rgba(69,10,10,0.98),rgba(24,24,27,0.96)_48%,rgba(127,29,29,0.94))] shadow-[0_22px_70px_rgba(127,29,29,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] dark:border-slate-700/60 dark:bg-[linear-gradient(145deg,rgba(3,7,18,0.98),rgba(9,9,11,0.98)_48%,rgba(30,41,59,0.94))] dark:shadow-[0_22px_70px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.06)] sm:mb-6 sm:rounded-[1.75rem]"
      >
        <div className="relative p-4 text-white sm:p-5 lg:p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(252,211,77,0.85),rgba(248,113,113,0.9),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(148,163,184,0.55),rgba(127,29,29,0.35),transparent)]" />
          <div className="absolute left-0 top-0 h-full w-20 bg-[linear-gradient(90deg,rgba(248,113,113,0.16),transparent)] dark:bg-[linear-gradient(90deg,rgba(15,23,42,0.72),transparent)]" />
          <div className="absolute right-0 top-0 h-full w-20 bg-[linear-gradient(270deg,rgba(245,158,11,0.12),transparent)] dark:bg-[linear-gradient(270deg,rgba(30,41,59,0.55),transparent)]" />
          
          <div className="relative z-10 mb-4 grid gap-3 sm:mb-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border border-red-300/15 bg-red-500/15 text-red-100 shadow-[0_0_24px_rgba(248,113,113,0.22)]">
                <Flame className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-200/70">Arena ao vivo</p>
                <p className="truncate text-xs font-black uppercase tracking-[0.08em] text-red-50 sm:text-sm">
                  {packName}
                </p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[260px] rounded-[1rem] border border-white/10 bg-black/24 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:w-[260px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-red-100/58">Tempo</span>
                <span className={`text-lg font-black tabular-nums leading-none ${isFinalMinute ? 'text-amber-200 drop-shadow-[0_0_14px_rgba(251,191,36,0.45)]' : 'text-white'}`}>
                  {formatTime(remainingTime)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <m.div
                  className={`h-full rounded-full ${isFinalMinute ? 'bg-[linear-gradient(90deg,#f97316,#facc15)]' : 'bg-[linear-gradient(90deg,#ef4444,#f59e0b)]'}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${timePercent}%` }}
                  transition={{ duration: 0.25, ease: 'linear' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <span className="rounded-[0.8rem] border border-white/10 bg-white/8 px-3 py-2 text-center">
                <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/48">{currentRoundLabel}</span>
                <span className="text-sm font-black tabular-nums text-white">{currentRoundValue}/{totalCards}</span>
              </span>
              <span className={`rounded-[0.8rem] border px-3 py-2 text-center ${scoreDelta >= 0 ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100' : 'border-amber-300/20 bg-amber-400/10 text-amber-100'}`}>
                <span className="block text-[9px] font-black uppercase tracking-[0.18em] opacity-70">Saldo</span>
                <span className="text-sm font-black tabular-nums">{scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4 lg:gap-6">
            <div className="min-w-0 rounded-[1.1rem] border border-red-200/12 bg-[linear-gradient(145deg,rgba(248,113,113,0.18),rgba(255,255,255,0.06))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] dark:border-slate-600/35 dark:bg-[linear-gradient(145deg,rgba(30,41,59,0.68),rgba(15,23,42,0.42))] sm:rounded-[1.35rem] sm:p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-red-200/20 bg-red-500/20 text-sm font-black text-red-50 shadow-[0_0_18px_rgba(248,113,113,0.22)] dark:border-slate-500/35 dark:bg-slate-700/45 dark:shadow-none sm:h-12 sm:w-12">
                    {me.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-100/58">Você</p>
                    <p className="truncate text-sm font-black text-white sm:text-base">{me.username}</p>
                  </div>
                </div>
                <span className="text-3xl font-black leading-none tabular-nums text-red-100 drop-shadow-[0_0_14px_rgba(248,113,113,0.28)] dark:text-slate-100 dark:drop-shadow-none sm:text-4xl">
                  {myScore}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-red-100/58">
                <span>Avanço</span>
                <span>{myProgress}/{totalCards}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full border border-red-200/10 bg-black/22">
                <m.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#b91c1c,#ef4444,#f97316)] shadow-[0_0_18px_rgba(248,113,113,0.65)] dark:bg-[linear-gradient(90deg,#475569,#64748b,#94a3b8)] dark:shadow-none"
                  initial={{ width: 0 }}
                  animate={{ width: `${myPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-red-50/58">
                <span>Erros: {myWrong}</span>
                <span>{Math.round(myPercent)}%</span>
              </div>
            </div>

            <m.div
              className="relative flex w-12 shrink-0 items-center justify-center sm:w-16"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute h-full w-px bg-[linear-gradient(180deg,transparent,rgba(252,211,77,0.7),transparent)]" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-[1rem] border border-amber-200/22 bg-black/35 text-amber-100 shadow-[0_0_26px_rgba(245,158,11,0.22)] dark:border-slate-500/35 dark:bg-slate-950/70 dark:text-slate-200 dark:shadow-none sm:h-14 sm:w-14">
                <div className="absolute inset-1 rounded-[0.8rem] bg-red-500/14 blur-sm dark:bg-slate-500/12" />
                <Swords className="relative h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </m.div>

            <div className="min-w-0 rounded-[1.1rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(39,39,42,0.42))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:border-slate-600/35 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.62),rgba(2,6,23,0.38))] sm:rounded-[1.35rem] sm:p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-3xl font-black leading-none tabular-nums text-white/74 sm:text-4xl">
                  {opponentScore}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <div className="min-w-0 text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/42">Oponente</p>
                    <p className="truncate text-sm font-black text-white sm:text-base">{opponent.username}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border border-white/12 bg-white/8 text-sm font-black text-white/76 sm:h-12 sm:w-12">
                    {opponent.username.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-white/42">
                <span>{opponentProgress}/{totalCards}</span>
                <span>Avanço</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full border border-white/10 bg-black/22">
                <m.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.62),rgba(252,211,77,0.58))]"
                  initial={{ width: 0 }}
                  animate={{ width: `${opponentPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-white/45">
                <span>{Math.round(opponentPercent)}%</span>
                <span>Erros: {opponentWrong}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 text-center sm:mt-5">
            <div className="rounded-[0.95rem] border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/42">Modo</p>
              <p className="mt-0.5 truncate text-xs font-black capitalize text-white/82">{gameType}</p>
            </div>
            <div className="rounded-[0.95rem] border border-red-200/12 bg-red-500/10 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-100/52">Pressão</p>
              <p className="mt-0.5 text-xs font-black text-red-50">{isFinalMinute ? 'Máxima' : 'Estável'}</p>
            </div>
            <div className="rounded-[0.95rem] border border-amber-200/14 bg-amber-400/10 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-100/52">Alvo</p>
              <p className="mt-0.5 text-xs font-black text-amber-50">{remainingCards} restam</p>
            </div>
          </div>
        </div>
      </m.div>

      {snakePowerEnabled && (
        <div className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-[1.15rem] border border-emerald-950/15 bg-[var(--color-surface-container-lowest)]/94 p-2 shadow-[0_18px_46px_rgba(0,0,0,0.20)] backdrop-blur-md dark:border-emerald-300/15 dark:bg-slate-950/88 sm:right-6">
          <button
            type="button"
            onClick={handleSnakePower}
            disabled={!snakePowerReady || ghostReplayMode}
            aria-label="Usar bloqueio da cobra"
            title={
              snakePowerUsed
                ? 'Poder já usado neste duelo'
                : snakePowerReady
                  ? `Bloquear o oponente por ${SNAKE_POWER_BLOCK_SECONDS} segundos`
                  : `Acerte ${Math.max(0, SNAKE_POWER_STREAK_TARGET - correctStreak)} frases seguidas para carregar`
            }
            className={`group flex h-12 w-12 items-center justify-center rounded-[0.95rem] border transition-all ${
              snakePowerReady && !ghostReplayMode
                ? 'border-emerald-500/35 bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.34)] hover:bg-emerald-600 active:scale-95'
                : 'border-[var(--color-border)] bg-[var(--color-surface-container-low)] text-[var(--color-text-subtle)]'
            }`}
          >
            <Worm className="h-6 w-6" strokeWidth={2.4} />
          </button>
          <div className="min-w-[64px] pr-1">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
              Cobra
            </p>
            <p className="text-xs font-black text-[var(--color-text)]">
              {snakePowerUsed
                ? 'Usado'
                : snakePowerReady
                  ? 'Pronto'
                  : `${Math.min(correctStreak, SNAKE_POWER_STREAK_TARGET)}/${SNAKE_POWER_STREAK_TARGET}`}
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <AnimatePresence mode="wait">
          {(() => {
            const currentCardIndex = cardQueue.length > 0 ? cardQueue[0] : null;
            return (
              <m.div
                key={gameType === 'matching' ? 'matching' : currentCardIndex !== null ? `${gameType}-${currentCardIndex}-${completedCards.size}` : 'finished'}
                initial={{ opacity: 0, x: 30, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={isSnakeBlocked ? 'pointer-events-none select-none opacity-45' : undefined}
              >
                {gameType === 'matching' ? (
                  <ArenaMatchingGame
                    cards={arenaCards}
                    onCorrect={handleMatchingCorrect}
                    onWrong={handleMatchingWrong}
                    onFinish={handleMatchingFinish}
                  />
                ) : gameType === 'flashcard' && currentCardIndex !== null ? (
                  <Flashcard
                    card={arenaCards[currentCardIndex]}
                    onCorrect={() => handleNext(true)}
                    onWrong={() => handleNext(false)}
                  />
                ) : gameType === 'typing' && currentCardIndex !== null ? (
                  <TypingMode
                    card={arenaCards[currentCardIndex]}
                    onCorrect={() => handleNext(true)}
                    onWrong={() => handleNext(false)}
                  />
                ) : gameType === 'listening' && currentCardIndex !== null ? (
                  <ListeningMode
                    card={arenaCards[currentCardIndex]}
                    onCorrect={() => handleNext(true)}
                    onWrong={() => handleNext(false)}
                  />
                ) : gameType === 'speaking' && currentCardIndex !== null ? (
                  <SpeakingMode
                    card={arenaCards[currentCardIndex]}
                    variant="arena"
                    onCorrect={() => handleNext(true, 'both')}
                    onWrong={(_, mode) => handleNext(false, mode ?? 'both')}
                  />
                ) : currentCardIndex !== null && (
                  <MultipleChoice
                    card={arenaCards[currentCardIndex]}
                    allCards={arenaCards}
                    onCorrect={() => handleNext(true)}
                    onWrong={() => handleNext(false)}
                  />
                )}
              </m.div>
            )
          })()}
        </AnimatePresence>

        {isSnakeBlocked && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[1.5rem] bg-black/48 p-4 backdrop-blur-sm">
            <div className="rounded-[1.2rem] border border-emerald-300/20 bg-slate-950/88 px-6 py-5 text-center text-white shadow-2xl">
              <Worm className="mx-auto h-8 w-8 text-emerald-200" strokeWidth={2.4} />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-100/70">
                Bloqueado
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums">{snakeBlockRemaining}s</p>
            </div>
          </div>
        )}
      </div>

      <m.div
        className="mt-4 flex items-center justify-center sm:mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-1.5 rounded-full border border-red-950/15 bg-[var(--color-surface-container-lowest)]/90 px-3 py-1.5 shadow-sm sm:gap-2 sm:px-4 sm:py-2">
          <span className="text-[10px] font-semibold text-[var(--color-text-subtle)] sm:text-xs">
            {currentRoundLabel}
          </span>
          <span className="text-xs font-black text-[var(--color-text)] sm:text-sm">
            {currentRoundValue}
          </span>
          <span className="text-[10px] text-[var(--color-text-subtle)]/70 sm:text-xs">/</span>
          <span className="text-xs font-bold text-[var(--color-text-subtle)] sm:text-sm">{totalCards}</span>
        </div>
      </m.div>
    </div>
  )
}
