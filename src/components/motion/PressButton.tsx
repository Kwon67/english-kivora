'use client'

import { useRef, type ComponentPropsWithoutRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface PressButtonProps extends ComponentPropsWithoutRef<'button'> {
  hoverScale?: number
  pressedScale: number
  hoverY?: number
}

export default function PressButton({ hoverScale = 1, pressedScale, hoverY = 0, disabled, ...props }: PressButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  useGSAP(() => {
    const button = ref.current
    if (!button || disabled) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const scale = gsap.quickTo(button, 'scale', { duration: 0.22, ease: 'power3.out' })
      const y = gsap.quickTo(button, 'y', { duration: 0.22, ease: 'power3.out' })
      let hovering = false
      const release = () => { scale(hovering ? hoverScale : 1); y(hovering ? hoverY : 0) }
      const enter = (event: PointerEvent) => { hovering = event.pointerType !== 'touch'; release() }
      const leave = () => { hovering = false; release() }
      const press = () => { scale(pressedScale); y(0) }
      const keyDown = (event: KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') press() }
      const events = new AbortController()
      const options = { signal: events.signal }
      button.addEventListener('pointerenter', enter, options)
      button.addEventListener('pointerleave', leave, options)
      button.addEventListener('pointerdown', press, options)
      button.addEventListener('pointerup', release, options)
      button.addEventListener('pointercancel', leave, options)
      button.addEventListener('keydown', keyDown, options)
      button.addEventListener('keyup', release, options)
      button.addEventListener('blur', leave, options)
      return () => events.abort()
    })
    return () => media.revert()
  }, { scope: ref, dependencies: [disabled, hoverScale, pressedScale, hoverY], revertOnUpdate: true })
  return <button {...props} disabled={disabled} ref={ref} />
}
