'use client'

import { lazy, Suspense, useEffect, useState } from 'react'

type PWAExperienceProps = {
  publicVapidKey: string | null
  className?: string
}

const PWAExperienceClient = lazy(() => import('./PWAExperienceClient'))

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  cancelIdleCallback?: (handle: number) => void
}

function scheduleAfterInitialPaint(callback: () => void) {
  const win = window as WindowWithIdleCallback
  let cancelled = false
  let idleHandle: number | null = null
  let timeoutHandle: number | null = null

  const run = () => {
    if (cancelled) return

    if (win.requestIdleCallback) {
      idleHandle = win.requestIdleCallback(() => {
        if (!cancelled) callback()
      }, { timeout: 1800 })
      return
    }

    timeoutHandle = window.setTimeout(() => {
      if (!cancelled) callback()
    }, 600)
  }

  if (document.readyState === 'complete') {
    run()
  } else {
    window.addEventListener('load', run, { once: true })
  }

  return () => {
    cancelled = true
    window.removeEventListener('load', run)

    if (idleHandle !== null && win.cancelIdleCallback) {
      win.cancelIdleCallback(idleHandle)
    }

    if (timeoutHandle !== null) {
      window.clearTimeout(timeoutHandle)
    }
  }
}

export default function PWAExperience(props: PWAExperienceProps) {
  const [shouldLoadClient, setShouldLoadClient] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.pwaReady = '1'
    return scheduleAfterInitialPaint(() => setShouldLoadClient(true))
  }, [])

  if (!shouldLoadClient) return null

  return (
    <Suspense fallback={null}>
      <PWAExperienceClient {...props} />
    </Suspense>
  )
}
