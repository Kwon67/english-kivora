'use client'

import { useLayoutEffect, useRef } from 'react'
import LandingWordmark from './LandingWordmark'
import { isLandingLite } from './useLandingLite'
import styles from './LandingPolish.module.css'

export default function LandingIntro() {
  const intro = useRef<HTMLDivElement>(null)
  const startedHere = useRef(false)

  useLayoutEffect(() => {
    const overlay = intro.current
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    if (!overlay || document.hidden || location.hash || reduced.matches || isLandingLite()) return
    try {
      if (!startedHere.current && sessionStorage.getItem('kivora-intro-seen')) return
      sessionStorage.setItem('kivora-intro-seen', '1')
      startedHere.current = true
    } catch { return }

    overlay.dataset.intro = 'waiting'
    const started = performance.now()
    let delay: number | undefined
    const open = () => {
      if (overlay.dataset.intro !== 'waiting') return
      overlay.dataset.intro = 'opening'
      dispose()
    }
    const onVisibility = () => { if (document.hidden) open() }
    const deadline = window.setTimeout(open, 1050)
    let active = true
    function dispose() {
      active = false
      window.clearTimeout(deadline)
      window.clearTimeout(delay)
      window.removeEventListener('pointerdown', open)
      window.removeEventListener('keydown', open)
      document.removeEventListener('visibilitychange', onVisibility)
      reduced.removeEventListener('change', open)
    }

    window.addEventListener('pointerdown', open, { passive: true })
    window.addEventListener('keydown', open)
    document.addEventListener('visibilitychange', onVisibility)
    reduced.addEventListener('change', open)
    const hero = document.querySelector<HTMLImageElement>('[data-art-scene="discovery"] img')
    void Promise.allSettled([document.fonts.ready, hero?.decode()]).then(() => {
      if (active) delay = window.setTimeout(open, Math.max(0, 560 - (performance.now() - started)))
    })
    return () => {
      dispose()
      delete overlay.dataset.intro
    }
  }, [])

  return <div ref={intro} id="kivora-intro" className={styles.intro} aria-hidden="true">
    <div className={styles.introBrand}><LandingWordmark /><span className={styles.introHello} lang="en">hello.</span></div>
  </div>
}
