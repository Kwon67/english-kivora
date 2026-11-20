'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function LearningMotion({ children, className, hero = false }: { children: ReactNode; className?: string; hero?: boolean }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const element = root.current
    if (!element) return
    const media = gsap.matchMedia()
    media.add({ desktop: '(min-width: 60rem)', motion: '(prefers-reduced-motion: no-preference)' }, ({ conditions }) => {
      if (!conditions?.motion) return
      const select = gsap.utils.selector(element)
      const timeline = gsap.timeline({
        defaults: { ease: 'power3.out', duration: .85 },
        ...(!hero && { scrollTrigger: { trigger: element, start: 'top 86%', once: true } }),
      })
      const animate = (selector: string, values: gsap.TweenVars, position: number) => {
        const targets = select(selector)
        if (targets.length) timeline.from(targets, values, position)
      }
      // Never hide the server-rendered headline or delay the largest contentful paint.
      animate('[data-entrance]', { y: hero ? 28 : 20, stagger: .09, clearProps: 'transform' }, 0)

      if (hero && conditions.desktop) {
        gsap.to(select('[data-scroll-art]'), { y: 12, ease: 'none', scrollTrigger: { trigger: element, start: 'top top', end: 'bottom top', scrub: .8 } })
      }
    })
    let active = true
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh() })
    return () => { active = false; media.revert() }
  }, { scope: root, dependencies: [hero], revertOnUpdate: true })

  return <div ref={root} className={className}>{children}</div>
}
