'use client'

import { useRef } from 'react'
import { Plus } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import styles from './MindmarketLanding.module.css'

gsap.registerPlugin(useGSAP)

export default function LandingFAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const root = useRef<HTMLDetailsElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const animation = useRef<gsap.core.Tween | null>(null)
  const desiredOpen = useRef(false)
  const { contextSafe } = useGSAP(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => { if (query.matches) animation.current?.progress(1) }
    query.addEventListener('change', finish)
    return () => query.removeEventListener('change', finish)
  }, { scope: root })
  const toggle = contextSafe((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault()
    const details = root.current
    const content = panel.current
    if (!details || !content) return
    animation.current?.kill()
    desiredOpen.current = !desiredOpen.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      details.open = desiredOpen.current
      gsap.set(content, { clearProps: 'height,opacity,overflow' })
      return
    }
    const opening = desiredOpen.current
    if (opening) details.open = true
    animation.current = gsap.fromTo(content, { opacity: opening ? 0 : 1 }, {
      opacity: opening ? 1 : 0, duration: .22, ease: 'power2.out',
      onComplete: () => { details.open = opening; gsap.set(content, { clearProps: 'opacity' }) },
    })
  })
  return <details ref={root} className={styles.faqItem}><summary onClick={toggle}><span><small>0{index + 1}</small>{question}</span><Plus size={23} aria-hidden="true" /></summary><div ref={panel}><p>{answer}</p></div></details>
}
