'use client'

import { useEffect, useState } from 'react'
import { Clock3, Flame, Heart } from 'lucide-react'
import {
  getBlitzSessionPhase,
  getBlitzSessionProgress,
  getComboMultiplier,
} from '@/features/blitz/lib/blitzScoring'
import type { BlitzGameMode } from '@/features/blitz/lib/blitzModes'
import { getBlitzModeLabel } from '@/features/blitz/lib/blitzModes'

function BlitzElapsed({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!startedAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  const seconds = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0
  const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return <div><dt><Clock3 size={15} aria-hidden="true" /><span className="sr-only">Tempo decorrido</span></dt><dd>{label}</dd></div>
}

interface BlitzHudProps {
  startedAt: number
  lives: number
  score: number
  combo: number
  mode: BlitzGameMode
  cardsAnswered: number
  totalCards: number
  /** "Aliviando o ritmo" / "Subindo o nível", quando a partida se ajusta ao desempenho. */
  adaptationLabel?: string
}

export default function BlitzHud({
  startedAt,
  lives,
  score,
  combo,
  mode,
  cardsAnswered,
  totalCards,
  adaptationLabel = '',
}: BlitzHudProps) {
  const multiplier = getComboMultiplier(combo)
  const progress = getBlitzSessionProgress(cardsAnswered, totalCards, lives)
  const phase = getBlitzSessionPhase(progress)

  return (
    <section className="blitz-hud" aria-label="Placar da partida">
      <div className="blitz-hud-row">
        <div className="blitz-hud-lives" role="img" aria-label={`${lives} de 3 vidas`}>
          {Array.from({ length: 3 }, (_, index) => (
            <Heart key={index} aria-hidden="true" size={17} className={index < lives ? 'blitz-heart' : 'blitz-heart-empty'} />
          ))}
        </div>
        <dl className="blitz-hud-stats">
          <div><dt>Pontos</dt><dd>{score}</dd></div>
          <div data-combo={combo >= 3}>
            <dt><Flame size={16} aria-hidden="true" /><span className="sr-only">Combo</span></dt>
            <dd>{combo}{combo >= 3 && <small>×{multiplier}</small>}</dd>
          </div>
          <BlitzElapsed startedAt={startedAt} />
        </dl>
      </div>
      <div className="blitz-hud-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0}
        aria-valuemax={100} aria-valuetext={`${phase} da partida`} aria-label="Progresso da partida de Blitz"
        data-testid="blitz-session-progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="blitz-hud-context">
        <span>{getBlitzModeLabel(mode)}</span>
        <span role="status">{adaptationLabel}</span>
      </div>
    </section>
  )
}
