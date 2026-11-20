'use client'

import { createContext, useContext, useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import type Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import styles from './MindmarketLanding.module.css'

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin)

const ScrollContext = createContext<{ current: Lenis | null }>({ current: null })
export const useLandingScroll = () => useContext(ScrollContext)

function scrollToAnchor(lenis: Lenis, hash: string) {
  const target = document.getElementById(hash.slice(1))
  if (!target) return false
  if (location.hash !== hash) history.pushState(null, '', hash)
  if (!target.hasAttribute('tabindex') && target.tabIndex < 0) {
    target.tabIndex = -1
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
  }
  target.focus({ preventScroll: true })
  // Lenis 1.3.27 reads scroll-margin and scroll-padding for element targets.
  lenis.scrollTo(target)
  return true
}
export { scrollToAnchor }

/** Scroll owns travel; visible-only timelines own the smaller scene gestures. */
export default function JourneyMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const engine = useRef<Lenis | null>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    const html = document.documentElement
    html.classList.add('kivora-landing-scroll')
    let mounted = true
    void document.fonts.ready.then(() => { if (mounted) ScrollTrigger.refresh() })
    media.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      let active = true
      let dispose: (() => void) | undefined
      void import('lenis').then(({ default: Lenis }) => {
        if (!active) return
        const lenis = new Lenis({ autoRaf: false, syncTouch: false })
        engine.current = lenis
        if (root.current?.querySelector('dialog[open]')) lenis.stop()
        const tick = (seconds: number) => lenis.raf(seconds * 1000)
        const unsubscribe = lenis.on('scroll', ScrollTrigger.update)
        const cancelTravel = () => {
          if (!lenis.isStopped) { lenis.stop(); lenis.start() }
        }
        window.addEventListener('popstate', cancelTravel)
        gsap.ticker.lagSmoothing(0)
        gsap.ticker.add(tick)
        dispose = () => {
          window.removeEventListener('popstate', cancelTravel)
          gsap.ticker.remove(tick)
          unsubscribe()
          lenis.destroy()
          engine.current = null
          gsap.ticker.lagSmoothing(500, 33)
        }
      }).catch(() => { /* Native scrolling handles an unavailable optional chunk. */ })
      return () => { active = false; dispose?.() }
    })
    media.add({ motion: '(prefers-reduced-motion: no-preference)', compact: '(max-width: 47.99rem)' }, ({ conditions }) => {
      if (!conditions?.motion) return
      const compact = conditions.compact
      const container = root.current
      if (!container) return
      const select = gsap.utils.selector(container)
      const loops = new Map<Element, { animation: gsap.core.Animation; visible: boolean }>()
      const sync = () => loops.forEach(({ animation, visible }) => {
        const paused = !visible || document.hidden
        if (animation.paused() !== paused) animation.paused(paused)
      })
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { const loop = loops.get(entry.target); if (loop) loop.visible = entry.isIntersecting })
        sync()
      }, { threshold: .08 })
      const watch = (element: Element, animation: gsap.core.Animation) => {
        loops.set(element, { animation, visible: false })
        observer.observe(element)
      }

      select('[data-reveal]').forEach((element: HTMLElement) => {
        // Focus can arrive between pointerdown and pointerup. Moving a whole
        // control group at that point changes the click target (notably on
        // mobile Safari). Keep interactive hit areas fixed throughout entry.
        const interactive = element.querySelector('a,button,input,select,textarea,summary,[tabindex]') !== null
        gsap.from(element, {
          y: interactive ? 0 : 48, opacity: 0, duration: .8, ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 96%', once: true },
          clearProps: 'transform,opacity',
        })
      })
      // Keep interactive content available when keyboard navigation skips the scroll entrance.
      const revealFocus = (event: FocusEvent) => {
        const element = (event.target as Element)?.closest<HTMLElement>('[data-reveal]')
        if (!element) return
        gsap.getTweensOf(element).forEach(tween => tween.progress(1))
      }
      container.addEventListener('focusin', revealFocus)

      gsap.from(select('[data-title-line]'), { yPercent: 105, rotation: 3, duration: 1.05, stagger: .1, ease: 'power4.out', clearProps: 'transform' })
      gsap.from(select('[data-hero-copy] > :not(h1)'), { y: 24, opacity: 0, stagger: .07, duration: .8, delay: .15, ease: 'power3.out', clearProps: 'transform,opacity' })
      select('[data-art-scene]').forEach((scene: HTMLElement) => {
        // Reveal the scene as a unit. Its parent handles scroll travel and its
        // children handle local movement, so none of the transforms compete.
        const trigger = scene.closest('[data-hero-art], [data-scene-travel]') ?? scene
        gsap.timeline({ scrollTrigger: { trigger, start: 'top 94%', once: true } })
          .from(scene, {
            y: () => Math.min(100, window.innerHeight * .1),
            scale: .75, force3D: true, duration: 1.75, ease: 'elastic.out(1, 0.3)',
            clearProps: 'transform',
          }, 0)
          .from(scene, { opacity: .3, duration: .2, clearProps: 'opacity' }, 0)
      })
      const hero = container.querySelector('[data-hero-parallax]')
      if (hero && !compact) gsap.to(hero, { y: () => Math.min(110, window.innerHeight * .13), force3D: true, ease: 'none', scrollTrigger: { trigger: container.querySelector('main > section'), start: 'top top', end: 'bottom top', scrub: .3, invalidateOnRefresh: true } })

      select('[data-scene-travel]').forEach((element: HTMLElement, index: number) => {
        gsap.fromTo(element, { y: 42, rotation: index % 2 ? 2 : -2 }, {
          y: -54, rotation: index % 2 ? -2 : 2, force3D: true, ease: 'none',
          scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'bottom top', scrub: .3 },
        })
      })
      select('[data-story-card]').forEach((element: HTMLElement) => {
        gsap.from(element, {
          scale: .78, force3D: true, transformOrigin: '50% 65%', ease: 'power2.out',
          scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'top 49%', scrub: .3 },
        })
      })
      select('[data-journey-prop]').forEach((element: HTMLElement, index: number) => {
        gsap.fromTo(element, { y: 65, x: index % 2 ? -18 : 18, rotation: -14 }, {
          y: -90, x: index % 2 ? 18 : -18, rotation: 24, ease: 'none',
          scrollTrigger: { trigger: element.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
      if (!compact) select('[data-depth-ornaments]').forEach((element: HTMLElement, index: number) => {
        gsap.fromTo(element, { y: 25, rotation: index % 2 ? -3 : 3 }, {
          y: -25, rotation: index % 2 ? 3 : -3, force3D: true, ease: 'none',
          scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'bottom top', scrub: .3 },
        })
      })
      select('[data-art-scene]').forEach((scene: HTMLElement) => {
        const timeline = gsap.timeline({ paused: true, repeat: -1, yoyo: true, defaults: { duration: 2.4, ease: 'sine.inOut' } })
        const move = (name: string, vars: gsap.TweenVars) => {
          const targets = scene.querySelectorAll(`[data-art-motion="${name}"]`)
          if (targets.length) timeline.to(targets, vars, 0)
        }
        move('illustration', { y: -7, rotation: .35, transformOrigin: '50% 85%' })
        move('turn', { rotation: 38, transformOrigin: '50% 50%', stagger: .12 })
        move('drift', { x: 13, y: -14, rotation: 7, stagger: .15 })
        watch(scene, timeline)
      })
      select('[data-float]').forEach((element: HTMLElement, index: number) => {
        watch(element, gsap.to(element, { y: index % 2 ? 9 : -9, rotation: index % 2 ? 3 : -3, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true }))
      })
      // These loops use a short, duplicated decorative row; no layout is animated.
      select('[data-word-belt]').forEach((element: HTMLElement) => {
        watch(element, gsap.to(element, { xPercent: -50, duration: 28, repeat: -1, ease: 'none', paused: true }))
      })
      const underline = container.querySelectorAll<SVGPathElement>('[data-draw-line]')
      underline.forEach((element: SVGPathElement) => {
        gsap.fromTo(element, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1, ease: 'power2.inOut', scrollTrigger: { trigger: element.closest('h1,h2'), start: 'top 85%', once: true } })
      })
      document.addEventListener('visibilitychange', sync)
      return () => {
        observer.disconnect()
        container.removeEventListener('focusin', revealFocus)
        document.removeEventListener('visibilitychange', sync)
        loops.forEach(({ animation }) => animation.kill())
      }
    })
    return () => { mounted = false; media.revert(); html.classList.remove('kivora-landing-scroll') }
  }, { scope: root })
  return <ScrollContext.Provider value={engine}><div ref={root} className={styles.page} onClickCapture={event => {
    if (!engine.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
    const anchor = event.target instanceof Element && event.target.closest<HTMLAnchorElement>('a[href^="#"]')
    if (!anchor || anchor.closest('dialog') || anchor.target || anchor.hasAttribute('download')) return
    if (scrollToAnchor(engine.current, anchor.hash)) event.preventDefault()
  }}>{children}</div></ScrollContext.Provider>
}
