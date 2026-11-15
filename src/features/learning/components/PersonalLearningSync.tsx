'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/** Refresh the existing home when its background preparation finishes. */
export function PersonalLearningSync({ active }: { active: boolean }) {
  const router = useRouter()
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0

    async function check() {
      try {
        const response = await fetch('/api/learning/personalize', { signal: controller.signal, cache: 'no-store' })
        if (response.ok) {
          const result: { status?: string } = await response.json()
          if (['ready', 'failed', 'deferred'].includes(result.status ?? '')) {
            router.refresh()
            return
          }
          if (['disabled', 'unavailable'].includes(result.status ?? '')) {
            setSlow(true)
            return
          }
        } else if (response.status === 401) return
      } catch {
        if (controller.signal.aborted) return
      }
      attempts += 1
      if (attempts >= 12) {
        setSlow(true)
        return
      }
      timer = setTimeout(check, 10_000)
    }

    timer = setTimeout(check, 5_000)
    return () => { controller.abort(); if (timer) clearTimeout(timer) }
  }, [active, router])

  return slow ? <p role="status" className="px-4 py-2 text-sm text-muted-foreground">Seu próximo treino ainda está sendo preparado. Você pode continuar estudando enquanto isso.</p> : null
}
