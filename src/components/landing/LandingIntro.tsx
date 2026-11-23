'use client'

import { useLayoutEffect, useRef } from 'react'
import { isLandingLite } from './useLandingLite'
import styles from './LandingPolish.module.css'

// A fresh page load replays the greeting; internal route returns skip it.
let greeted = false

export default function LandingIntro() {
  const intro = useRef<HTMLDivElement>(null)
  const startedHere = useRef(false)

  useLayoutEffect(() => {
    const overlay = intro.current
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    if (!overlay || document.hidden || location.hash || reduced.matches || isLandingLite()) return
    if (window.scrollY > 48 || (greeted && !startedHere.current)) return
    greeted = true
    startedHere.current = true

    const finish = () => {
      if (!overlay.dataset.intro) return
      delete overlay.dataset.intro
      overlay.dispatchEvent(new Event('kivora-intro-finished'))
    }
    const onVisibility = () => { if (document.hidden) finish() }
    const onEnd = (event: AnimationEvent) => {
      if (event.target === overlay) finish()
    }
    overlay.addEventListener('animationend', onEnd)
    window.addEventListener('pointerdown', finish, { once: true, passive: true })
    window.addEventListener('keydown', finish, { once: true })
    document.addEventListener('visibilitychange', onVisibility)
    reduced.addEventListener('change', finish)
    overlay.dataset.intro = 'opening'
    overlay.dispatchEvent(new Event('kivora-intro-opening'))
    return () => {
      overlay.removeEventListener('animationend', onEnd)
      window.removeEventListener('pointerdown', finish)
      window.removeEventListener('keydown', finish)
      document.removeEventListener('visibilitychange', onVisibility)
      reduced.removeEventListener('change', finish)
      delete overlay.dataset.intro
    }
  }, [])

  return <div ref={intro} id="kivora-intro" className={styles.intro} aria-hidden="true" />
}
