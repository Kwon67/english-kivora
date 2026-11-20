'use client'

import type { RefObject } from 'react'
import type Lenis from 'lenis'
import { ReactLenis, useLenis } from 'lenis/react'
import { gsap, useGSAP, ScrollTrigger } from '@/lib/gsap'

function Ticker({ engineRef }: { engineRef: RefObject<Lenis | null> }) {
  const lenis = useLenis()
  useGSAP(() => {
    if (!lenis) return
    engineRef.current = lenis
    if (document.querySelector('#kivora-mobile-menu[open]')) lenis.stop()
    const tick = (seconds: number) => lenis.raf(seconds * 1000)
    const cancel = () => { if (!lenis.isStopped) { lenis.stop(); lenis.start() } }
    const unsubscribe = lenis.on('scroll', ScrollTrigger.update)
    window.addEventListener('popstate', cancel)
    gsap.ticker.lagSmoothing(0)
    gsap.ticker.add(tick)
    return () => {
      engineRef.current = null
      unsubscribe()
      window.removeEventListener('popstate', cancel)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
    }
  }, { dependencies: [lenis, engineRef], revertOnUpdate: true })
  return null
}

export default function LandingLenis({ engineRef }: { engineRef: RefObject<Lenis | null> }) {
  return <ReactLenis root options={{ autoRaf: false, syncTouch: false }}><Ticker engineRef={engineRef} /></ReactLenis>
}
