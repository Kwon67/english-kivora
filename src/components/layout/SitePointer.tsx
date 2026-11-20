'use client'

import { useEffect, useRef } from 'react'
import { useLandingLite } from '@/components/landing/useLandingLite'
import styles from '@/components/landing/LandingPolish.module.css'

export default function SitePointer() {
  const lite = useLandingLite()
  const pointer = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (lite) return
    const surface = document.documentElement
    const dot = pointer.current!
    const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let magnetic: HTMLElement | null = null
    const resetMagnet = () => { magnetic?.style.removeProperty('translate'); magnetic = null }
    const hide = () => {
      resetMagnet()
      dot.removeAttribute('data-visible')
      surface.removeAttribute('data-kivora-pointer')
    }
    const move = (event: PointerEvent) => {
      const target = event.target
      if (!media.matches || event.pointerType !== 'mouse' || !(target instanceof Element)
        || target.closest('input, textarea, select, [contenteditable], dialog')) { hide(); return }
      const control = target.closest<HTMLElement>('a[href], button:not(:disabled), summary')
      const next = control?.matches('a:not([data-magnetic]), button:not([data-sound-control])') ? control : null
      if (next !== magnetic) {
        resetMagnet()
        if (next && getComputedStyle(next).translate === 'none') magnetic = next
      }
      if (magnetic) {
        const bounds = magnetic.getBoundingClientRect()
        const x = Math.max(-3, Math.min(3, (event.clientX - bounds.left - bounds.width / 2) * .11))
        const y = Math.max(-3, Math.min(3, (event.clientY - bounds.top - bounds.height / 2) * .15))
        magnetic.style.translate = `${x}px ${y}px`
      }
      const label = control?.matches('a[href="/register"]') ? 'começar' : control ? 'ver' : ''
      if (label) dot.dataset.label = label
      else delete dot.dataset.label
      dot.style.setProperty('--cursor-x', event.clientX + 'px')
      dot.style.setProperty('--cursor-y', event.clientY + 'px')
      dot.toggleAttribute('data-edge-x', event.clientX > innerWidth - 100)
      dot.toggleAttribute('data-edge-y', event.clientY > innerHeight - 48)
      dot.toggleAttribute('data-visible', true)
      surface.toggleAttribute('data-kivora-pointer', true)
    }
    surface.addEventListener('pointermove', move)
    surface.addEventListener('pointerleave', hide)
    window.addEventListener('blur', hide)
    document.addEventListener('visibilitychange', hide)
    document.addEventListener('scroll', hide, { passive: true })
    media.addEventListener('change', hide)
    return () => {
      hide()
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerleave', hide)
      window.removeEventListener('blur', hide)
      document.removeEventListener('visibilitychange', hide)
      document.removeEventListener('scroll', hide)
      media.removeEventListener('change', hide)
    }
  }, [lite])

  return <span ref={pointer} className={styles.pointer} aria-hidden="true" />
}
