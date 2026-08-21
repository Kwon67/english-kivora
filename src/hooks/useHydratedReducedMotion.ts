'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

/**
 * Keeps the first SSR/client render identical while still honoring the
 * user's reduced-motion preference immediately after hydration.
 */
export function useHydratedReducedMotion() {
  const prefersReducedMotion = useReducedMotion()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated && Boolean(prefersReducedMotion)
}
