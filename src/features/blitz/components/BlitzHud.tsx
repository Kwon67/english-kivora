'use client'

import { m } from 'motion/react'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'
import { Flame, Heart, Zap } from 'lucide-react'
import {
  getBlitzSessionPhase,
  getBlitzSessionProgress,
  getComboMultiplier,
} from '@/features/blitz/lib/blitzScoring'
import type { BlitzGameMode } from '@/features/blitz/lib/blitzModes'
import { getBlitzModeShortLabel } from '@/features/blitz/lib/blitzModes'

interface BlitzHudProps {
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

  const reduceMotion = useHydratedReducedMotion()

  return (
    <section className="blitz-hud" aria-label="Placar da partida">
      <div className="blitz-hud-row">
        <div className="blitz-hud-lives" aria-label={`${lives} de 3 vidas`}>
          {Array.from({ length: 3 }, (_, index) => (
            <m.span key={index} aria-hidden="true"
              animate={index < lives || reduceMotion ? { scale: 1 } : { scale: [1, 1.25, 1] }}
              transition={{ duration: reduceMotion ? 0 : .3 }}>
              <Heart size={18} className={index < lives ? 'blitz-heart' : 'blitz-heart-empty'} />
            </m.span>
          ))}
        </div>
        <dl className="blitz-hud-stats">
          <div><dt>Pontos</dt><dd>{score}</dd></div>
          <div>
            <dt className="sr-only">Combo</dt>
            <m.dd key={combo} initial={combo > 0 && !reduceMotion ? { scale: 1.22 } : false}
              animate={{ scale: 1 }} transition={{ duration: reduceMotion ? 0 : .2 }}>
              <Flame size={16} aria-hidden="true" />{combo}{combo >= 3 && <small>×{multiplier}</small>}
            </m.dd>
          </div>
        </dl>
        <span className="blitz-hud-mode"><Zap size={14} aria-hidden="true" />{getBlitzModeShortLabel(mode)}</span>
      </div>
      <div className="blitz-hud-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0}
        aria-valuemax={100} aria-valuetext={`${phase} da partida`} aria-label="Progresso da partida de Blitz"
        data-testid="blitz-session-progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div aria-live="polite" className="blitz-adaptation">{adaptationLabel}</div>
    </section>
  )
}
