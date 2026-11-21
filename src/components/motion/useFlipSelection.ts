'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { gsap, Flip, useGSAP } from '@/lib/gsap'

/** Capture the old indicator before React moves its keyed host to the selected item. */
export function useFlipSelection(initial: number, duration: number, ease: string) {
  const [index, setIndex] = useState(initial)
  const indicator = useRef<HTMLSpanElement>(null)
  const previous = useRef<Flip.FlipState | null>(null)
  const selected = useRef(initial)
  const id = useId()
  const select = useCallback((value: number) => {
    if (selected.current === value) return
    selected.current = value
    previous.current = indicator.current && !matchMedia('(prefers-reduced-motion: reduce)').matches
      ? Flip.getState(indicator.current) : null
    setIndex(value)
  }, [])
  useGSAP(() => {
    const state = previous.current
    previous.current = null
    if (!state || !indicator.current) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      Flip.from(state, { targets: indicator.current, duration, ease, scale: true })
    })
    return () => media.revert()
  }, { scope: indicator, dependencies: [index, duration, ease], revertOnUpdate: true })
  return { index, select, indicator, id }
}
