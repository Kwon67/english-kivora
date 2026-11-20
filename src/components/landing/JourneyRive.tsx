'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, type ReactNode } from 'react'
import useSceneVisibility from './scenes/useSceneVisibility'
import styles from './JourneyArt.module.css'

const RiveCanvas = dynamic(() => import('./scenes/RiveCanvas'), { ssr: false })

export default function JourneyRive({ src, stateMachine, children }: { src: string; stateMachine?: string; children: ReactNode }) {
  const { ref, visible, reduced } = useSceneVisibility()
  const [load, setLoad] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (load || !visible || reduced) return
    let active = true
    let idle: number | undefined
    let timer: number | undefined
    let frame = 0
    const schedule = async () => {
      await ref.current?.querySelector('img')?.decode().catch(() => undefined)
      if (!active) return
      frame = requestAnimationFrame(() => {
        const start = () => { if (active) setLoad(true) }
        if (window.requestIdleCallback) idle = window.requestIdleCallback(start, { timeout: 1200 })
        else timer = window.setTimeout(start, 250)
      })
    }
    if (document.readyState === 'complete') void schedule()
    else window.addEventListener('load', schedule, { once: true })
    return () => {
      active = false
      window.removeEventListener('load', schedule)
      cancelAnimationFrame(frame)
      if (idle !== undefined) window.cancelIdleCallback(idle)
      clearTimeout(timer)
    }
  }, [visible, reduced, load, ref])
  return <div ref={ref} className={styles.riveScene} data-rive-ready={ready && !reduced}>
    {children}
    <div className={styles.riveOverlay}>{load && !reduced && <RiveCanvas src={src} stateMachine={stateMachine} active={visible} onReady={setReady} />}</div>
  </div>
}
