'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useLandingLite } from '@/components/landing/useLandingLite'
import styles from '@/components/landing/LandingPolish.module.css'

export default function SitePointer() {
  const pathname = usePathname()
  const lite = useLandingLite()
  const pointer = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (lite || pathname === '/') return
    const surface = document.documentElement
    const dot = pointer.current!
    const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let magnetic: HTMLElement | null = null
    const resetMagnet = () => { magnetic?.style.removeProperty('translate'); magnetic = null }
    let x = 0
    let y = 0
    let frame = 0
    let tracking = false
    const hide = () => {
      resetMagnet()
      dot.removeAttribute('data-visible')
      surface.removeAttribute('data-kivora-pointer')
    }
    const stop = () => {
      tracking = false
      cancelAnimationFrame(frame)
      frame = 0
      hide()
    }
    const update = () => {
      frame = 0
      const target = document.elementFromPoint(x, y)
      if (!target || target.closest('input, textarea, select, [contenteditable], dialog, iframe')) { hide(); return }
      const control = target.closest<HTMLElement>('a[href], button:not(:disabled), summary')
      const next = control?.matches('a:not([data-magnetic]), button') ? control : null
      if (next !== magnetic) {
        resetMagnet()
        if (next && getComputedStyle(next).translate === 'none') magnetic = next
      }
      if (magnetic) {
        const bounds = magnetic.getBoundingClientRect()
        const offsetX = Math.max(-3, Math.min(3, (x - bounds.left - bounds.width / 2) * .11))
        const offsetY = Math.max(-3, Math.min(3, (y - bounds.top - bounds.height / 2) * .15))
        magnetic.style.translate = `${offsetX}px ${offsetY}px`
      }
      const label = control?.matches('a[href="/register"]') ? 'começar' : control ? 'ver' : ''
      if (label) dot.dataset.label = label
      else delete dot.dataset.label
      dot.style.setProperty('--cursor-x', x + 'px')
      dot.style.setProperty('--cursor-y', y + 'px')
      dot.toggleAttribute('data-edge-x', x > innerWidth - 100)
      dot.toggleAttribute('data-edge-y', y > innerHeight - 48)
      dot.toggleAttribute('data-visible', true)
      surface.toggleAttribute('data-kivora-pointer', true)
    }
    const schedule = () => {
      if (tracking && !frame) frame = requestAnimationFrame(update)
    }
    const move = (event: PointerEvent) => {
      if (!media.matches || event.pointerType !== 'mouse') { stop(); return }
      tracking = true
      x = event.clientX
      y = event.clientY
      schedule()
    }
    surface.addEventListener('pointermove', move)
    surface.addEventListener('pointerleave', stop)
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', stop)
    document.addEventListener('scroll', schedule, { passive: true, capture: true })
    media.addEventListener('change', stop)
    return () => {
      stop()
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerleave', stop)
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', stop)
      document.removeEventListener('scroll', schedule, true)
      media.removeEventListener('change', stop)
    }
  }, [lite, pathname])

  return pathname === '/' ? null : <span ref={pointer} className={styles.pointer} aria-hidden="true" />
}
