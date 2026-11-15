'use client'

import { useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { finishFocusedMotion } from './finishFocusedMotion'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const targets = '.home-frosted-surface, .learning-panel, .admin-metric-cell, .admin-page-header, .study-desk-heading, .practice-routes, .collection-group'

/** Route-scoped entrances. ProductMotion owns lesson/card transitions. */
export default function WorkspaceMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', context => {
      const seen = new WeakSet<Element>()
      const animations = new Set<gsap.core.Tween>()
      const reveal = context.add('revealPanel', (container: Element) => {
        const candidates = [container, ...container.querySelectorAll(targets)]
        candidates.forEach(element => {
          if (!element.matches(targets) || seen.has(element) || element.closest('[data-product-motion], [data-motion-surface]')) return
          if (element.parentElement?.closest(targets)) return
          seen.add(element)
          const tween = gsap.from(element, {
            y: 28, opacity: 0, duration: .75, ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: element, start: 'top 94%', once: true },
          })
          animations.add(tween)
        })
      })
      if (root.current) reveal(root.current)
      // Streaming sections and client-loaded panels get the same entrance.
      const observer = new MutationObserver(records => {
        records.forEach(record => record.addedNodes.forEach(node => {
          if (node instanceof Element) reveal(node)
        }))
      })
      if (root.current) observer.observe(root.current, { childList: true, subtree: true })
      return () => {
        observer.disconnect()
        animations.forEach(tween => { tween.scrollTrigger?.kill(); tween.revert() })
      }
    })
    return () => media.revert()
  }, { scope: root, dependencies: [pathname], revertOnUpdate: true })
  return <div ref={root} onFocusCapture={finishFocusedMotion} className="workspace-motion">{children}</div>
}
