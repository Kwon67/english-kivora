'use client'

import { useSyncExternalStore } from 'react'

type DeviceNavigator = Navigator & { deviceMemory?: number; connection?: EventTarget & { saveData?: boolean; effectiveType?: string } }
const getConnection = () => (navigator as DeviceNavigator).connection

export function isLandingLite() {
  const { hardwareConcurrency, deviceMemory } = navigator as DeviceNavigator
  const connection = getConnection()
  return Boolean((hardwareConcurrency > 0 && hardwareConcurrency <= 2)
    || (deviceMemory && deviceMemory <= 2)
    || connection?.saveData
    || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? ''))
}

function subscribe(callback: () => void) {
  const connection = getConnection()
  connection?.addEventListener('change', callback)
  return () => connection?.removeEventListener('change', callback)
}

export function useLandingLite() {
  return useSyncExternalStore(subscribe, isLandingLite, () => true)
}
