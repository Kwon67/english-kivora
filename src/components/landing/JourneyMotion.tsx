'use client'

import dynamic from 'next/dynamic'
import { createContext, useContext, useRef, useState, ViewTransition, type ReactNode } from 'react'
import type Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { duration, ease } from '@/lib/motion-tokens'
import styles from './MindmarketLanding.module.css'
import { playLandingSound } from './landingSound'
import { useLandingLite } from './useLandingLite'
import { setupHeroMotion } from './HeroMotion'
import { setupPlanHover, setupSectionMotion } from './JourneySectionMotion'

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
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => setupHeroMotion(root.current!))
    return () => media.revert()
  }, { scope: root })

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
      const cleanups: (() => void)[] = [setupPlanHover(container)]
      for (const area of select('[data-pointer-area], [data-tilt], [data-magnetic]') as HTMLElement[]) {
        const isCard = area.hasAttribute('data-tilt')
        const magnet = area.hasAttribute('data-magnetic')
        const shine = isCard ? document.createElement('span') : null
        if (shine) {
          shine.className = styles.shine
          shine.setAttribute('aria-hidden', 'true')
          area.append(shine)
        }
        const targets = isCard ? [area] : Array.from(area.querySelectorAll(magnet ? '[data-action-icon]' : '[data-cursor]'))
        const axes = targets.map((el, i) => ({
          x: gsap.quickTo(el, isCard ? 'rotationY' : 'x', { duration: .42, ease: ease.out }),
          y: gsap.quickTo(el, isCard ? 'rotationX' : 'y', { duration: .42, ease: ease.out }),
          strength: isCard ? 1.5 : magnet ? 6 : (i % 2 ? -10 : 14),
        }))
        const move = (event: PointerEvent) => {
          const rect = area.getBoundingClientRect()
          const x = 2 * (event.clientX - rect.left) / rect.width - 1
          const y = 2 * (event.clientY - rect.top) / rect.height - 1
          axes.forEach(axis => { axis.x(x * axis.strength); axis.y((isCard ? -y : y) * axis.strength) })
          if (isCard) {
            area.style.setProperty('--shine-x', (x * 50) + '%')
            area.style.setProperty('--shine-y', (y * 50) + '%')
          }
        }
        const reset = () => axes.forEach(axis => { axis.x(0); axis.y(0) })
        area.addEventListener('pointermove', move)
        area.addEventListener('pointerleave', reset)
        cleanups.push(() => { area.removeEventListener('pointermove', move); area.removeEventListener('pointerleave', reset); shine?.remove() })
      }
      return () => { cleanups.forEach(clean => clean()); setSmooth(false) }
    })

    media.add('(prefers-reduced-motion: no-preference)', () => {
      setupSectionMotion(container)
      const loops = new Map<Element, { animation: gsap.core.Animation; visible: boolean }>()
      const sync = () => loops.forEach(loop => loop.animation.paused(!loop.visible || document.hidden))
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { const loop = loops.get(entry.target); if (loop) loop.visible = entry.isIntersecting })
        sync()
      })
      const loop = (element: Element, animation: gsap.core.Animation) => {
        loops.set(element, { animation: animation.pause(), visible: false }); observer.observe(element)
      }
      document.addEventListener('visibilitychange', sync)
      for (const scene of select('[data-art-scene]')) {
        gsap.from(scene, { y: 32, scale: .97, duration: 1, ease: ease.reveal, scrollTrigger: { trigger: scene, start: 'top 96%', toggleActions: 'play none none none' } })
        const illustration = scene.querySelector('[data-art-motion="illustration"]')
        loop(scene, gsap.to(illustration, { y: -7, rotation: .35, duration: duration.illustration, ease: ease.loop, repeat: -1, yoyo: true }))
      }
      for (const element of select('[data-scene-travel], [data-hero-parallax]')) {
        gsap.fromTo(element, { y: 15 }, { y: -22, ease: ease.linear,
          scrollTrigger: { trigger: element.closest('section'), start: 'top bottom', end: 'bottom top', scrub: .35 } })
      }
      // The remaining decorative loops belong to the hero and FAQ. The story
      // sections finish their own gestures as the visitor reaches each chapter.
      for (const element of select('[data-hero-parallax] [data-float], #faq [data-float]')) {
        loop(element, gsap.to(element, { y: -8, rotation: 2, duration: duration.float, ease: ease.loop, repeat: -1, yoyo: true }))
      }
      const belt = select('[data-word-belt]')[0]
      if (belt) {
        const marquee = gsap.to(belt, { xPercent: -50, duration: duration.belt, repeat: -1, ease: ease.linear,
          onReverseComplete: () => { marquee.totalTime(marquee.duration() * 100) } })
        loop(belt, marquee)
        const speed = gsap.quickTo(marquee, 'timeScale', { duration: .3 })
        ScrollTrigger.create({ trigger: belt.parentElement, start: 'top bottom', end: 'bottom top',
          onUpdate(trigger) { speed(trigger.direction * (1 + Math.min(3, Math.abs(trigger.getVelocity()) / 900))) },
        })
        const settle = () => speed(marquee.timeScale() < 0 ? -1 : 1)
        ScrollTrigger.addEventListener('scrollEnd', settle)
        return () => {
          ScrollTrigger.removeEventListener('scrollEnd', settle)
          observer.disconnect(); document.removeEventListener('visibilitychange', sync)
        }
      }
      return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
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
        if (event.target instanceof Element && !event.target.closest('[data-sound-feedback]')
          && event.target.closest('a[href], button:not(:disabled), summary')) playLandingSound('click')
        if (!engine.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        const anchor = event.target instanceof Element && event.target.closest<HTMLAnchorElement>('a[href^="#"]')
        if (anchor && !anchor.closest('dialog') && !anchor.target && !anchor.hasAttribute('download') && scrollToAnchor(engine.current, anchor.hash)) event.preventDefault()
      }}>
        {children}
      </div>
    </ViewTransition>
  </ScrollContext.Provider>
}
