'use client'

import { Children, cloneElement, isValidElement, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react'
import gsap from 'gsap'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

type Panel = ReactElement<HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> }>
interface TransitionSlotProps {
  children: ReactNode
  duration: number
  enterY?: number
  exitY?: number
  enterOpacity?: number
  exitOpacity?: number
  expand?: boolean
  animateFirst?: boolean
  ease?: string
}

/** Retain one keyed DOM panel until its exit finishes. Same-key renders stay live. */
export default function TransitionSlot({
  children, duration, enterY = 0, exitY = 0, enterOpacity = 0, exitOpacity = 0,
  expand = false, animateFirst = true, ease = 'power2.out',
}: TransitionSlotProps) {
  const next = Children.toArray(children).find((child): child is Panel => isValidElement(child)) ?? null
  const nextKey = next?.key ?? null
  const [shownKey, setShownKey] = useState(nextKey)
  const retained = useRef(next)
  const requestedKey = useRef(nextKey)
  const panel = useRef<HTMLElement>(null)
  const previousNode = useRef<HTMLElement | null>(null)
  const first = useRef(true)
  const reduced = useHydratedReducedMotion()
  const exiting = shownKey !== nextKey
  const shown = exiting ? retained.current : next

  useLayoutEffect(() => {
    requestedKey.current = nextKey
    if (!exiting) retained.current = next
  }, [next, nextKey, exiting])

  useLayoutEffect(() => {
    const element = panel.current
    const skip = first.current && !animateFirst
    first.current = false
    if (!element || reduced || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (exiting) setShownKey(requestedKey.current)
      if (element) gsap.set(element, { clearProps: expand ? 'opacity,transform,height' : 'opacity,transform' })
      previousNode.current = element
      return
    }
    const newNode = previousNode.current !== element
    previousNode.current = element
    if (skip && !exiting) return
    if (exiting) {
      const exit = gsap.to(element, {
        opacity: exitOpacity, y: exitY, ...(expand && { height: 0 }), duration, ease,
        onComplete: () => setShownKey(requestedKey.current),
      })
      return () => { exit.kill() }
    }
    if (newNode) gsap.set(element, { y: enterY, opacity: enterOpacity, ...(expand && { height: 0 }) })
    const enter = gsap.to(element, {
      opacity: 1, y: 0, ...(expand && { height: 'auto' }), duration, ease,
      clearProps: expand ? 'opacity,transform,height' : 'opacity,transform',
    })
    return () => { enter.kill() }
  }, [shownKey, exiting, reduced, animateFirst, enterY, exitY, enterOpacity, exitOpacity, duration, ease, expand])

  return shown && cloneElement(shown, { ref: panel, inert: exiting || undefined })
}
