'use client'

import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Plus } from 'lucide-react'
import styles from './MindmarketLanding.module.css'

export type FAQProps = { items: string[][] }
export function Question({ index, text }: { index: number; text: string }) {
  return <><span><small>0{index + 1}</small>{text}</span><Plus size={23} aria-hidden="true" /></>
}

export default function LandingFAQ({ items }: FAQProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [enhanced, setEnhanced] = useState<{ List: ComponentType<FAQProps & { initial: boolean[] }>; initial: boolean[] }>()
  useEffect(() => {
    const element = ref.current!
    let active = true
    let install: (() => void) | undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      void import('./LandingFAQItem').then(({ default: List }) => {
        install = () => {
          if (!active || element.contains(document.activeElement)) return
          setEnhanced({ List, initial: Array.from(element.querySelectorAll('details'), item => item.open) })
          element.removeEventListener('focusout', onBlur)
        }
        install()
      }).catch(() => { /* Native details remains interactive. */ })
    }, { rootMargin: '320px' })
    const onBlur = () => queueMicrotask(() => install?.())
    element.addEventListener('focusout', onBlur)
    observer.observe(element)
    return () => { active = false; observer.disconnect(); element.removeEventListener('focusout', onBlur) }
  }, [])
  return <div ref={ref} className={styles.faqList}>
    {enhanced ? <enhanced.List items={items} initial={enhanced.initial} /> : items.map(([question, answer], i) =>
      <details className={styles.faqItem} key={question}><summary><Question text={question} index={i} /></summary><div data-faq-answer><p>{answer}</p></div></details>)}
  </div>
}
