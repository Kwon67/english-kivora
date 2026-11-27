'use client'

import { useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { duration, ease } from '@/lib/motion-tokens'
import { useLandingLite } from './useLandingLite'
import styles from './Editorial.module.css'

export default function EditorialMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const progress = useRef<HTMLDivElement>(null)
  const lite = useLandingLite()

  useGSAP(() => {
    const page = root.current
    if (!page || lite) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      page.dataset.motion = 'active'
      gsap.from(page.querySelectorAll('[data-hero-copy] > *'), {
        y: 13, duration: duration.panel, stagger: .07, ease: ease.reveal, clearProps: 'transform',
      })
      gsap.to(progress.current, {
        scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true },
      })
      for (const art of page.querySelectorAll('[data-scroll-art]')) {
        gsap.fromTo(art, { y: 12 }, {
          y: -12, ease: 'none', scrollTrigger: { trigger: art.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      }
      const cards = page.querySelectorAll('[data-practice-lab] button[aria-controls="practice-panel"]')
      gsap.from(cards, {
        y: 14, stagger: .06, duration: duration.panel, ease: ease.reveal, clearProps: 'transform',
        scrollTrigger: { trigger: cards[0], start: 'top 95%', once: true },
      })
      // Expanded exercises and answers change the page height after the first layout.
      let frame = 0
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => ScrollTrigger.refresh())
      })
      observer.observe(page)
      return () => {
        observer.disconnect()
        cancelAnimationFrame(frame)
        delete page.dataset.motion
      }
    })

    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const phone = page.querySelector<HTMLElement>('[data-phone]')
      if (!phone) return
      gsap.set(phone, { transformPerspective: 1000 })
      const tiltX = gsap.quickTo(phone, 'rotationX', { duration: .35, ease: ease.out })
      const tiltY = gsap.quickTo(phone, 'rotationY', { duration: .35, ease: ease.out })
      const move = (event: PointerEvent) => {
        const bounds = phone.getBoundingClientRect()
        tiltX((.5 - (event.clientY - bounds.top) / bounds.height) * 5)
        tiltY(((event.clientX - bounds.left) / bounds.width - .5) * 7)
      }
      const reset = () => { tiltX(0); tiltY(0) }
      phone.addEventListener('pointermove', move)
      phone.addEventListener('pointerleave', reset)
      return () => {
        phone.removeEventListener('pointermove', move)
        phone.removeEventListener('pointerleave', reset)
      }
    })
    return () => media.revert()
  }, { scope: root, dependencies: [lite], revertOnUpdate: true })

  return <div id="inicio" className={styles.page} ref={root}>
    <div aria-hidden="true" className={styles.readingProgress} ref={progress} />
    {children}
  </div>
}
