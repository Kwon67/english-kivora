'use client'

import { useSyncExternalStore } from 'react'

const preference = '(prefers-reduced-motion: reduce)'
const readPreference = () => window.matchMedia(preference).matches
const serverPreference = () => false

function subscribe(notify: () => void) {
  const media = window.matchMedia(preference)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

export function useHydratedReducedMotion() {
  return useSyncExternalStore(subscribe, readPreference, serverPreference)
}
