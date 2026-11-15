'use client'

import { useEffect, useEffectEvent, type RefObject } from 'react'

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
export function useFocusTrap({
  active,
  containerRef,
  onClose,
}: UseFocusTrapOptions) {
  const close = useEffectEvent(onClose)

  useEffect(() => {
    if (!active) return

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const focusable = () =>
      Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        ) ?? [],
      ).filter(
        (element) =>
          element.tabIndex >= 0 && element.getClientRects().length > 0,
      )

    const focusPanel = () => {
      if (!containerRef.current) return false
      focusable()[0]?.focus()
      return true
    }
    // A portal can mount on the commit after its open state changes.
    const observer = new MutationObserver(() => {
      if (focusPanel()) observer.disconnect()
    })
    if (!focusPanel())
      observer.observe(document.body, { childList: true, subtree: true })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = focusable()

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!containerRef.current?.contains(document.activeElement)) {
        event.preventDefault()
        const target = event.shiftKey ? lastElement : firstElement
        target.focus()
        return
      }

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
      observer.disconnect()
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [active, containerRef])
}
