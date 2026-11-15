'use client'

import { useRef, type RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

/** Keep the dialog, scroll lock and focus trap alive until its exit finishes. */
export function useAnimatedDismiss(panel: RefObject<HTMLElement | null>) {
  const animation = useRef<gsap.core.Timeline | null>(null)
  const closing = useRef<HTMLElement | null>(null)
  const { contextSafe } = useGSAP(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => { if (query.matches) animation.current?.progress(1) }
    query.addEventListener('change', finish)
    return () => query.removeEventListener('change', finish)
  })

  return contextSafe((after: () => void) => {
    const element = panel.current
    if (element && closing.current === element) return
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { after(); return }
    closing.current = element
    const overlay = element.closest('[data-modal-overlay]')
    gsap.killTweensOf([element, ...(overlay ? [overlay] : [])])
    animation.current = gsap.timeline({ onComplete: () => {
      // The callback dismisses this panel; its focus trap stays active until then.
      after()
    } })
      .to(element, { y: 22, scale: .96, opacity: 0, duration: .24, ease: 'power2.in' }, 0)
    if (overlay) animation.current.to(overlay, { opacity: 0, duration: .24, ease: 'power2.in' }, 0)
  })
}
