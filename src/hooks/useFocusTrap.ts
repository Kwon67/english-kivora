'use client'

import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type UseFocusTrapOptions = {
  /** Only traps while true — pass the dialog's own open state. */
  active: boolean
  /** The element that should contain focus (the dialog panel). */
  containerRef: RefObject<HTMLElement | null>
  /** Called on Escape. Should close the dialog. */
  onClose: () => void
}

/**
 * Containment behaviour every `aria-modal="true"` element owes the user: move focus in on open,
 * keep Tab inside, close on Escape, and hand focus back to whatever opened it.
 *
 * Extracted verbatim from ConfirmDialog, which was the only hand-rolled dialog in the project
 * that implemented all four. The others declared `aria-modal="true"` while leaving focus loose in
 * the page behind them — which is worse than not declaring it, because it tells assistive tech the
 * rest of the page is inert when it is still reachable.
 */
export function useFocusTrap({ active, containerRef, onClose }: UseFocusTrapOptions) {
  useEffect(() => {
    if (!active) return

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    // The panel animates in, so the first focusable may not be mounted on this tick.
    const focusFrame = requestAnimationFrame(() => {
      containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()
    })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      )

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [active, containerRef, onClose])
}
