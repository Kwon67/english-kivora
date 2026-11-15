'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

/** Keep a useful server-rendered fallback until React can attach its handlers. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
}
