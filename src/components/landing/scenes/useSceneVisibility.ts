'use client'

import { useEffect, useRef, useState } from 'react'
import { useLandingLite } from '../useLandingLite'

export default function useSceneVisibility() {
  const lite = useLandingLite()
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({ entered: false, visible: false, reduced: true })
  useEffect(() => {
    if (!ref.current) return
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let intersecting = false
    const update = () => {
      const visible = intersecting && !document.hidden
      setState(previous => ({ entered: previous.entered || visible, visible, reduced: media.matches }))
    }
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update() })
    observer.observe(ref.current)
    media.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return { ref, ...state, reduced: lite || state.reduced, lite }
}
