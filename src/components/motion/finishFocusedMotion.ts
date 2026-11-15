import gsap from 'gsap'
import type { FocusEvent } from 'react'

/** Keyboard or autofocus settles an entrance before a learner starts typing. */
export function finishFocusedMotion(event: FocusEvent<HTMLElement>) {
  let element: HTMLElement | null = event.target
  while (element) {
    gsap.getTweensOf(element).forEach(tween => {
      if (tween.repeat() === 0) tween.progress(1)
    })
    if (element === event.currentTarget) break
    element = element.parentElement
  }
}
