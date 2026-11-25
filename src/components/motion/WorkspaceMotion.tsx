'use client'

import { useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
      const animations = new Set<Animation>()
      const reveal = context.add('revealPanel', (container: Element) => {
        const candidates = [container, ...container.querySelectorAll(targets)]
        candidates.forEach(element => {
          if (!element.matches(targets) || seen.has(element) || element.closest('[data-product-motion], [data-motion-surface]')) return
          if (element.parentElement?.closest(targets) || element.closest('details:not([open])')) return
          seen.add(element)
          ScrollTrigger.create({
            trigger: element,
            start: 'top 94%',
            once: true,
            onEnter: () => {
              if (element.contains(document.activeElement)) return
              // A streamed panel can be visible before React hydrates it. A native
              // animation leaves the server-rendered style attribute untouched.
              const animation = element.animate(
                [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
                { id: 'workspace-entry', duration: 560, easing: 'cubic-bezier(.2,.75,.3,1)' },
              )
              animations.add(animation)
              animation.onfinish = () => animations.delete(animation)
            },
          })
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
        animations.forEach(animation => animation.cancel())
      }
    })
    return () => media.revert()
  }, { scope: root, dependencies: [pathname], revertOnUpdate: true })
  return <div ref={root} onFocusCapture={event => {
    for (const animation of event.currentTarget.getAnimations({ subtree: true })) {
      if (animation.id === 'workspace-entry') animation.finish()
    }
  }} className="workspace-motion">{children}</div>
}
