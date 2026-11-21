'use client'

import type { RefObject } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { duration, ease } from '@/lib/motion-tokens'
import { Question, type FAQProps } from './LandingFAQ'
import { useLandingLite } from './useLandingLite'
import styles from './MindmarketLanding.module.css'

type AnimatedFAQProps = FAQProps & { initial: boolean[]; list: RefObject<HTMLDivElement | null> }

export default function AnimatedFAQ({ items, initial, list }: AnimatedFAQProps) {
  const lite = useLandingLite()
  useGSAP(() => {
    const container = list.current
    if (lite || !container) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const rows = Array.from(container.querySelectorAll('details'), details => {
        const trigger = details.querySelector('summary')!
        const answer = details.querySelector<HTMLElement>('[data-faq-answer]')!
        const text = answer.firstElementChild!
        let expanded = details.open
        let moving = false

        const settle = () => {
          details.open = expanded
          moving = false
          trigger.removeAttribute('aria-expanded')
          answer.removeAttribute('aria-hidden')
          answer.style.removeProperty('height')
          answer.style.removeProperty('opacity')
          answer.style.removeProperty('overflow')
        }

        // Read the natural text height only at the start of a fresh gesture.
        // The ribbon observes this same answer box as it opens and closes.
        const reveal = gsap.fromTo(answer, { height: 0, opacity: 0 }, {
          height: () => text.getBoundingClientRect().height, opacity: 1,
          duration: duration.faq, ease: ease.inOut, paused: true, immediateRender: false,
          onComplete: settle, onReverseComplete: settle,
        })
        const toggle = (event: MouseEvent) => {
          event.preventDefault()
          if (!moving) {
            expanded = details.open
            details.open = true
            answer.style.overflow = 'hidden'
            reveal.invalidate().progress(expanded ? 1 : 0, true)
          }
          moving = true
          expanded = !expanded
          trigger.setAttribute('aria-expanded', String(expanded))
          answer.setAttribute('aria-hidden', String(!expanded))
          if (reveal.progress() === (expanded ? 1 : 0)) {
            reveal.pause()
            settle()
          } else {
            reveal.reversed(!expanded).paused(false)
          }
        }
        trigger.addEventListener('click', toggle)
        return () => { trigger.removeEventListener('click', toggle); settle() }
      })
      return () => rows.forEach(cleanup => cleanup())
    })
    return () => media.revert()
  }, { scope: list, dependencies: [items, lite, list], revertOnUpdate: true })

  return items.map(([question, answer], i) => (
    <details key={question} className={styles.faqItem} open={initial[i]}>
      <summary><Question text={question} index={i} /></summary>
      <div data-faq-answer><p>{answer}</p></div>
    </details>
  ))
}
