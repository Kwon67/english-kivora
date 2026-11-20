'use client'

import { useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { duration, ease } from '@/lib/motion-tokens'
import { Question, type FAQProps } from './LandingFAQ'
import styles from './MindmarketLanding.module.css'

type AnimatedFAQProps = FAQProps & { initial: boolean[]; list: RefObject<HTMLDivElement | null> }

export default function AnimatedFAQ({ items, initial, list }: AnimatedFAQProps) {
  const [opened, setOpened] = useState(initial)
  const animation = useRef<gsap.core.Timeline | null>(null)
  const { contextSafe } = useGSAP(() => {
    const timeline = gsap.timeline({ paused: true, defaults: { duration: duration.faq, ease: ease.out } })
    animation.current = timeline
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => { if (preference.matches) timeline.progress(1) }
    preference.addEventListener('change', finish)
    return () => { preference.removeEventListener('change', finish); animation.current = null }
  }, { scope: list })

  const toggle = contextSafe((index: number) => {
    const rows = Array.from(list.current!.querySelectorAll('details'))
    const timeline = animation.current
    const animate = timeline && !matchMedia('(prefers-reduced-motion: reduce)').matches
    const before = animate ? rows.map(row => row.getBoundingClientRect().top) : []
    timeline?.progress(1).clear()
    flushSync(() => setOpened(old => old.map((open, i) => i === index ? !open : open)))
    if (!animate) return
    // Batch both geometry reads. Only translate neighbours, keeping answer height native
    // so the ribbon's ResizeObserver always sees the actual open layout.
    const offsets = rows.map((row, i) => before[i] - row.getBoundingClientRect().top)
    rows.forEach((row, i) => {
      if (offsets[i]) timeline.fromTo(row, { y: offsets[i] }, { y: 0, clearProps: 'transform' }, 0)
    })
    const answer = rows[index].querySelector('[data-faq-answer]')
    if (answer) timeline.fromTo(answer, { y: -5, opacity: 0 }, { y: 0, opacity: 1, clearProps: 'transform,opacity' }, 0)
    timeline.restart()
  })

  return items.map(([question, answer], i) => (
    <details key={question} className={styles.faqItem} open={opened[i]}>
      <summary onClick={event => { event.preventDefault(); toggle(i) }}><Question text={question} index={i} /></summary>
      {opened[i] && <div data-faq-answer><p>{answer}</p></div>}
    </details>
  ))
}
