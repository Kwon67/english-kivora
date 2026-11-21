'use client'

import { useLayoutEffect, useRef } from 'react'
import LandingWordmark from './LandingWordmark'
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

    overlay.dataset.intro = 'waiting'
    const finish = () => {
      delete overlay.dataset.intro
      overlay.dispatchEvent(new Event('kivora-intro-finished'))
    }
    const open = () => { overlay.dataset.intro = 'opening' }
    const deadline = window.setTimeout(open, 2200)
    const skip = () => {
      window.clearTimeout(deadline)
      finish()
    }
    const onVisibility = () => { if (document.hidden) skip() }
    const onEnd = (event: AnimationEvent) => {
      if (event.target === overlay) finish()
    }
    overlay.addEventListener('animationend', onEnd)
    window.addEventListener('pointerdown', skip, { once: true, passive: true })
    window.addEventListener('keydown', skip, { once: true })
    document.addEventListener('visibilitychange', onVisibility)
    reduced.addEventListener('change', skip)
    return () => {
      window.clearTimeout(deadline)
      overlay.removeEventListener('animationend', onEnd)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
      document.removeEventListener('visibilitychange', onVisibility)
      reduced.removeEventListener('change', skip)
      delete overlay.dataset.intro
    }
  }, [])

  return <div ref={intro} id="kivora-intro" className={styles.intro} aria-hidden="true">
    <div className={styles.introBrand}><LandingWordmark /><span className={styles.introHello} lang="en">hello.</span></div>
  </div>
}
