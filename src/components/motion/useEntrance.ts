'use client'

import { useCallback } from 'react'
import gsap from 'gsap'

/** A React 19 callback ref gives each mounted element its own animation and teardown. */
export function useEntrance(y: number, opacity = 0, duration = 0.3, delay = 0) {
  return useCallback((element: HTMLElement | null) => {
    if (!element) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return
    const tween = gsap.from(element, {
      y, opacity, duration, delay, ease: 'power2.out',
      onComplete: () => tween.revert(),
    })
    const finish = () => { if (media.matches) tween.revert() }
    media.addEventListener('change', finish)
    return () => {
      media.removeEventListener('change', finish)
      tween.revert()
    }
  }, [y, opacity, duration, delay])
}
