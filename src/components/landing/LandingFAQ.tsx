'use client'

import { useEffect, useRef, useState, type RefObject, type ComponentType } from 'react'
import { flushSync } from 'react-dom'
import { Plus } from 'lucide-react'
import styles from './MindmarketLanding.module.css'

export type FAQProps = { items: string[][] }
export function Question({ index, text }: { index: number; text: string }) {
  return <><span><small>0{index + 1}</small>{text}</span><Plus size={23} aria-hidden="true" /></>
}

export default function LandingFAQ({ items }: FAQProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [enhanced, setEnhanced] = useState<{ List: ComponentType<FAQProps & { initial: boolean[]; list: RefObject<HTMLDivElement | null> }>; initial: boolean[] }>()
  useEffect(() => {
    const element = ref.current!
    let active = true
    let nearby = false
    let requested = false
    let pressed = false
    let install: (() => void) | undefined
    const onPress = () => { pressed = true }
    const onBlur = () => queueMicrotask(() => install?.())
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        if (nearby) {
          nearby = false
          pressed = false
          install?.()
        }
        return
      }
      nearby = true
      if (requested) return
      requested = true
      void import('./LandingFAQItem').then(({ default: List }) => {
        install = () => {
          // Keep the native controls in place if a visitor starts a gesture before the animated list loads.
          if (!active || pressed || element.contains(document.activeElement)) return
          const initial = Array.from(element.querySelectorAll('details'), item => item.open)
          disconnect()
          flushSync(() => setEnhanced({ List, initial }))
        }
        install()
      }).catch(() => { /* Native details remains interactive. */ })
    }, { rootMargin: '320px' })
    const disconnect = () => {
      observer.disconnect()
      element.removeEventListener('pointerdown', onPress, true)
      element.removeEventListener('focusout', onBlur)
    }
    element.addEventListener('pointerdown', onPress, true)
    element.addEventListener('focusout', onBlur)
    observer.observe(element)
    return () => { active = false; disconnect() }
  }, [])
  return <div ref={ref} className={styles.faqList}>
    {enhanced ? <enhanced.List list={ref} items={items} initial={enhanced.initial} /> : items.map(([question, answer], i) =>
      <details className={styles.faqItem} key={question}><summary><Question text={question} index={i} /></summary><div data-faq-answer><p>{answer}</p></div></details>)}
  </div>
}
