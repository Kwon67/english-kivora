'use client'

import dynamic from 'next/dynamic'
import { createContext, useContext, useRef, useState, ViewTransition, type ReactNode } from 'react'
import type Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap'
import { duration, ease } from '@/lib/motion-tokens'
import styles from './MindmarketLanding.module.css'

const LandingLenis = dynamic(() => import('./LandingLenis'), { ssr: false })
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

  useGSAP(() => {
    const container = root.current!
    const media = gsap.matchMedia()
    const select = gsap.utils.selector(container)
    document.documentElement.classList.add('kivora-landing-scroll')
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      setSmooth(true)
      // Each layer owns one transform. Travel, floating and pointer response
      // act on separate nodes so scrolling never fights the cursor.
      const cleanups: (() => void)[] = []
      for (const area of select('[data-pointer-area], [data-tilt], [data-magnetic]') as HTMLElement[]) {
        const isCard = area.hasAttribute('data-tilt')
        const magnet = area.hasAttribute('data-magnetic')
        const shine = isCard ? document.createElement('span') : null
        if (shine) {
          shine.className = styles.shine
          shine.setAttribute('aria-hidden', 'true')
          area.append(shine)
        }
        const targets = isCard || magnet ? [area] : Array.from(area.querySelectorAll('[data-cursor]'))
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

    media.add({
      motion: '(prefers-reduced-motion: no-preference)',
      splitHeadings: '(min-width: 768px) and (hover: hover) and (pointer: fine)',
    }, context => {
      if (!context.conditions?.motion) return
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
      const restoreTitles = new Set<() => void>()
      const revealTitle = (title: HTMLElement) => {
        const ink = title.querySelector<HTMLElement>('[data-title-ink]')
        if (!ink) return
        // Keep the real heading in flow, including across font loads and resizes.
        // Only the temporary visual copy is split into animated lines.
        const layer = ink.cloneNode(true) as HTMLElement
        layer.className = styles.titleRevealLayer
        layer.setAttribute('aria-hidden', 'true')
        title.append(layer)
        ink.style.opacity = '0'
        const restore = () => {
          ink.style.removeProperty('opacity')
          layer.remove()
          restoreTitles.delete(restore)
        }
        restoreTitles.add(restore)
        SplitText.create(layer, {
          type: 'lines', mask: 'lines', tag: 'span', aria: 'none', autoSplit: true,
          onSplit(split) {
            return gsap.from(split.lines, {
              yPercent: 104, rotation: 1.5, duration: duration.title, stagger: .08, ease: ease.title,
              scrollTrigger: { trigger: title, start: 'top 97%', once: true },
              onComplete: () => { split.revert(); restore() },
            })
          },
        })
      }
      const titles = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          titles.unobserve(entry.target)
          const title = entry.target as HTMLElement
          context.add(() => {
            // On touch, swapping balanced text for a split copy can change its visible lines.
            if (context.conditions?.splitHeadings) revealTitle(title)
            if (title.querySelector('[data-mark]')) gsap.fromTo(title, { '--paint': 0 }, {
              '--paint': 1, duration: duration.reveal, ease: ease.out, scrollTrigger: { trigger: title, start: 'top 82%', once: true },
            })
          })
        }
      }, { rootMargin: '240px' })
      for (const heading of select('main h1, main h2')) titles.observe(heading)
      for (const scene of select('[data-art-scene]')) {
        gsap.from(scene, { y: 32, scale: .97, duration: 1, ease: ease.reveal, scrollTrigger: { trigger: scene, start: 'top 96%', once: true } })
        const illustration = scene.querySelector('[data-art-motion="illustration"]')
        loop(scene, gsap.to(illustration, { y: -7, rotation: .35, duration: duration.illustration, ease: ease.loop, repeat: -1, yoyo: true }))
      }
      for (const element of select('[data-scene-travel], [data-hero-parallax]')) {
        gsap.fromTo(element, { y: 15 }, { y: -22, ease: ease.linear,
          scrollTrigger: { trigger: element.closest('section'), start: 'top bottom', end: 'bottom top', scrub: .35 } })
      }
      for (const element of select('[data-float], [data-spin]')) {
        const spin = element.hasAttribute('data-spin')
        loop(element, gsap.to(element, spin ? { rotation: 360, repeat: -1, duration: 32, ease: ease.linear } :
          { y: -8, rotation: 2, duration: duration.float, ease: ease.loop, repeat: -1, yoyo: true }))
      }
      for (const plant of select('[data-plant]')) gsap.from(plant, {
        scale: .62, transformOrigin: '62% 74%', ease: ease.linear,
        scrollTrigger: { trigger: '#revisoes', start: 'top 70%', end: 'bottom 65%', scrub: true },
      })
      const message = container.querySelector('[data-type]')
      if (message) {
        const text = SplitText.create(message, { type: 'chars', aria: 'auto', tag: 'span' })
        gsap.from(text.chars, { opacity: 0, stagger: .045, duration: .01, scrollTrigger: { trigger: message, start: 'top 90%', once: true } })
      }
      const scores = select('[data-score]') as HTMLElement[]
      const blitz = gsap.timeline({ scrollTrigger: { trigger: '[data-ranking]', start: 'top 89%', once: true } })
      scores.forEach((score, index) => {
        blitz.from(score.parentElement, { y: 10, opacity: 0, duration: .3 }, index * .13)
          .fromTo(score, { textContent: '000' }, { scrambleText: { text: score.dataset.score!, chars: '0123456789' }, duration: .65 }, index * .13)
      })
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
          restoreTitles.forEach(restore => restore()); titles.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', sync)
        }
      }
      return () => { restoreTitles.forEach(restore => restore()); titles.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
    })
    return () => { media.revert(); document.documentElement.classList.remove('kivora-landing-scroll') }
  }, { scope: root })

  return <ScrollContext.Provider value={engine}>
    {smooth && <LandingLenis engineRef={engine} />}
    <ViewTransition name="landing" default="none" enter="landing-page" exit="landing-page">
      <div ref={root} className={styles.page} onClickCapture={event => {
        if (!engine.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        const anchor = event.target instanceof Element && event.target.closest<HTMLAnchorElement>('a[href^="#"]')
        if (anchor && !anchor.closest('dialog') && !anchor.target && !anchor.hasAttribute('download') && scrollToAnchor(engine.current, anchor.hash)) event.preventDefault()
      }}>{children}</div>
    </ViewTransition>
  </ScrollContext.Provider>
}
