'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './MindmarketLanding.module.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/** Scroll owns travel; visible-only timelines own the smaller scene gestures. */
export default function JourneyMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const container = root.current
      if (!container) return
      const select = gsap.utils.selector(container)
      const loops = new Map<Element, { animation: gsap.core.Animation; visible: boolean }>()
      const sync = () => loops.forEach(({ animation, visible }) => {
        if (visible && !document.hidden) animation.play()
        else animation.pause()
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
        gsap.from(element, {
          y: 48, opacity: 0, duration: .8, ease: 'power3.out',
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
      gsap.from(select('[data-hero-art]'), { y: 65, scale: .86, rotation: -4, duration: 1.3, ease: 'power3.out', clearProps: 'transform' })
      const hero = container.querySelector('[data-hero-parallax]')
      if (hero) gsap.to(hero, { y: () => Math.min(80, window.innerHeight * .08), ease: 'none', scrollTrigger: { trigger: container.querySelector('main > section'), start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } })

      select('[data-scene-travel]').forEach((element: HTMLElement, index: number) => {
        gsap.fromTo(element, { y: 45, rotation: index % 2 ? 3 : -3 }, {
          y: -45, rotation: index % 2 ? -3 : 3, ease: 'none',
          scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
      select('[data-story-card]').forEach((element: HTMLElement) => {
        gsap.from(element, {
          scale: .64, transformOrigin: '50% 50%', ease: 'none',
          scrollTrigger: { trigger: element.parentElement, start: 'top 94%', end: 'top 46%', scrub: true },
        })
      })
      select('[data-journey-prop]').forEach((element: HTMLElement, index: number) => {
        gsap.fromTo(element, { y: 65, x: index % 2 ? -18 : 18, rotation: -14 }, {
          y: -90, x: index % 2 ? 18 : -18, rotation: 24, ease: 'none',
          scrollTrigger: { trigger: element.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true },
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
        gsap.fromTo(element, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', scrollTrigger: { trigger: element.closest('h1,h2'), start: 'top 85%', once: true } })
      })
      document.addEventListener('visibilitychange', sync)
      return () => {
        observer.disconnect()
        container.removeEventListener('focusin', revealFocus)
        document.removeEventListener('visibilitychange', sync)
        loops.forEach(({ animation }) => animation.kill())
      }
    })
    return () => media.revert()
  }, { scope: root })
  return <div ref={root} className={styles.page}>{children}</div>
}
