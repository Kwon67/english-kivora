'use client'

import { useState } from 'react'
import { hasIOSWebKitFlag, isIOSWebKit } from '@/lib/safari'

/** Client hook — reads the early `data-ios` flag set in pwa-init.js when available. */
export function useSafariIOS(): boolean {
  const [isIOS] = useState(() => hasIOSWebKitFlag() || isIOSWebKit())
  return isIOS
}