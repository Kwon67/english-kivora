'use client'

import dynamic from 'next/dynamic'
import { createContext, useContext, useRef, useState, ViewTransition, type ReactNode } from 'react'
import type Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, useGSAP } from '@/lib/gsap'
import { ease } from '@/lib/motion-tokens'
import styles from './MindmarketLanding.module.css'
import { useLandingLite } from './useLandingLite'
import { setupHeroMotion } from './HeroMotion'
import { setupSectionMotion } from './JourneySectionMotion'

const LandingLenis = dynamic(() => import('./LandingLenis'), { ssr: false })
let signed = false
const ScrollContext = createContext<{ current: Lenis | null }>({ current: null })
export const useLandingScroll = () => useContext(ScrollContext)

export function scrollToAnchor(lenis: Lenis, hash: string) {
  const target = document.getElementById(hash.slice(1))
  if (!target) return false
  if (location.hash !== hash) history.pushState(null, '', hash)
  if (!target.hasAttribute('tabindex') && target.tabIndex < 0) {
    target.tabIndex = -1
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
  }
  target.focus({ preventScroll: true })
  lenis.scrollTo(target)
  return true
}

export default function JourneyMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const engine = useRef<Lenis | null>(null)
  const [smooth, setSmooth] = useState(false)
  const lite = useLandingLite()

  // The short headline sequence does not require the full scrolling or Rive runtime.
  useGSAP(() => setupHeroMotion(root.current!), { scope: root })

  useGSAP(() => {
    if (!signed) {
      signed = true
      console.info('%c K\\   kivora.\n |<   Inglês para a vida acontecer.\n K/ ', 'color:#2c2e2a;background:#8ed462;font:600 13px monospace')
    }
    const container = root.current!
    const media = gsap.matchMedia()
    const select = gsap.utils.selector(container)
    const html = document.documentElement
    html.classList.add('kivora-landing-scroll')
    html.classList.toggle('kivora-landing-lite', lite)
    const stop = () => html.classList.remove('kivora-landing-scroll', 'kivora-landing-lite')
    if (lite) return stop

    const pause = () => gsap.globalTimeline.paused(document.hidden)
    document.addEventListener('visibilitychange', pause)
    pause()
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      setSmooth(true)
      // Each layer owns one transform. Travel, floating and pointer response
      // act on separate nodes so scrolling never fights the cursor.
      const cleanups: (() => void)[] = []
      for (const area of select('[data-pointer-area], [data-tilt], [data-magnetic]') as HTMLElement[]) {
        const isCard = area.hasAttribute('data-tilt')
        const magnet = area.hasAttribute('data-magnetic')
        const targets = isCard ? [area] : Array.from(area.querySelectorAll(magnet ? '[data-action-icon]' : '[data-cursor]'))
        if (!targets.length) continue
        if (isCard) gsap.set(area, { transformPerspective: 900 })
        const axes = targets.map((el, i) => ({
          x: gsap.quickTo(el, isCard ? 'rotationY' : 'x', { duration: .42, ease: ease.out }),
          y: gsap.quickTo(el, isCard ? 'rotationX' : 'y', { duration: .42, ease: ease.out }),
          strength: isCard ? 3 : magnet ? 6 : (i % 2 ? -10 : 14),
        }))
        let frame = 0
        let clientX = 0
        let clientY = 0
        const update = () => {
          frame = 0
          const rect = area.getBoundingClientRect()
          const x = 2 * (clientX - rect.left) / rect.width - 1
          const y = 2 * (clientY - rect.top) / rect.height - 1
          axes.forEach(axis => { axis.x(x * axis.strength); axis.y((isCard ? -y : y) * axis.strength) })
        }
        const move = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return
          clientX = event.clientX
          clientY = event.clientY
          if (!frame) frame = requestAnimationFrame(update)
        }
        const reset = () => {
          cancelAnimationFrame(frame)
          frame = 0
          axes.forEach(axis => { axis.x(0); axis.y(0) })
        }
        area.addEventListener('pointermove', move)
        area.addEventListener('pointerleave', reset)
        cleanups.push(() => { area.removeEventListener('pointermove', move); area.removeEventListener('pointerleave', reset); cancelAnimationFrame(frame) })
      }
      return () => { cleanups.forEach(clean => clean()); setSmooth(false) }
    })

    media.add('(prefers-reduced-motion: no-preference)', () => {
      setupSectionMotion(container)
      for (const scene of select('[data-art-scene]')) {
        gsap.from(scene, { y: 32, scale: .97, duration: 1, ease: ease.reveal, scrollTrigger: { trigger: scene, start: 'top 96%', toggleActions: 'play none none none' } })
      }
    })
    return () => {
      media.revert()
      document.removeEventListener('visibilitychange', pause)
      gsap.globalTimeline.paused(false)
      stop()
    }
  }, { scope: root, dependencies: [lite], revertOnUpdate: true })

  return <ScrollContext.Provider value={engine}>
    {smooth && !lite && <LandingLenis engineRef={engine} />}
    <ViewTransition name="landing" default="none" exit={lite ? 'none' : { 'kivora-auth': 'kivora-auth-exit', default: 'none' }}>
      <div ref={root} className={styles.page} onClickCapture={event => {
        if (!engine.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        const anchor = event.target instanceof Element && event.target.closest<HTMLAnchorElement>('a[href^="#"]')
        if (anchor && !anchor.closest('dialog') && !anchor.target && !anchor.hasAttribute('download') && scrollToAnchor(engine.current, anchor.hash)) event.preventDefault()
      }}>
        {children}
      </div>
    </ViewTransition>
  </ScrollContext.Provider>
}
