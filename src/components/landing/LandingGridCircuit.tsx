'use client'

import { useEffect, useState } from 'react'

const TRAVELERS = [
  { id: 't1', routeClass: 'landing-circuit-route-left', duration: 80, delay: 0 },
  { id: 't2', routeClass: 'landing-circuit-route-right', duration: 92, delay: 24 },
] as const

export default function LandingGridCircuit() {
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const syncPaused = () => {
      setIsPaused(document.visibilityState === 'hidden')
    }

    syncPaused()
    document.addEventListener('visibilitychange', syncPaused)
    return () => document.removeEventListener('visibilitychange', syncPaused)
  }, [])

  const rootClass = [
    'landing-grid-circuit',
    isPaused ? 'landing-grid-circuit--paused' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} aria-hidden="true" data-landing-circuit>
      <div className="landing-circuit-track">
        {TRAVELERS.map((traveler) => (
          <span
            key={traveler.id}
            className={`landing-circuit-traveler ${traveler.routeClass}`}
            style={{
              animationDuration: `${traveler.duration}s`,
              animationDelay: `${traveler.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}