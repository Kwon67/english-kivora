'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { shuffleArray } from '@/lib/utils'
import GameWrapper from '@/components/game/GameWrapper'
import type { Card, GameMode } from '@/types/database.types'

interface GameClientProps {
  cards: Card[]
  gameMode: GameMode
  assignmentId: string
  packName: string
}

export default function GameClient({
  cards,
  gameMode,
  assignmentId,
  packName,
}: GameClientProps) {
  const setConfig = useGameStore((s) => s.setConfig)

  useEffect(() => {
    setConfig({
      cards: shuffleArray(cards),
      gameMode,
      assignmentId,
      packName,
    })
  }, [cards, gameMode, assignmentId, packName, setConfig])

  return <GameWrapper key={assignmentId} />
}
