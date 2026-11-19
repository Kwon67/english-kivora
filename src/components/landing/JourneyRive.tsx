'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Rive } from '@rive-app/canvas'
import styles from './JourneyArt.module.css'

export default function JourneyRive({ src, children }: { src: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const element = root.current
    const surface = canvas.current
    if (!element || !surface) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let disposed = false
    let nearby = false
    let visible = false
    let loading = false
    let loaded = false
    let waiting = false
    let frame = 0
    let idle: number | undefined
    let timer: number | undefined
    let scene: Rive | undefined

    const canLoad = () => nearby && !motion.matches && !document.hidden && !disposed
    const load = () => {
      waiting = false
      if (!canLoad() || loading) return
      loading = true
      void import('@rive-app/canvas').then(({ Rive, RuntimeLoader }) => {
        if (!canLoad()) {
          loading = false
          return
        }
        RuntimeLoader.setWasmUrl(new URL('@rive-app/canvas/rive.wasm', import.meta.url).href)
        RuntimeLoader.setWasmFallbackUrl(new URL('@rive-app/canvas/rive_fallback.wasm', import.meta.url).href)
        scene = new Rive({
          src,
          canvas: surface,
          autoplay: true,
          onLoad: () => {
            if (disposed) return
            loaded = true
            scene?.resizeDrawingSurfaceToCanvas()
            update()
          },
          onLoadError: () => { if (!disposed) setReady(false) },
        })
      }).catch(() => { if (!disposed) setReady(false) })
    }

    const afterPageLoad = async () => {
      // Give the poster its own paint before downloading and compiling WASM.
      const poster = element.querySelector('img')
      if (poster?.decode) await poster.decode().catch(() => undefined)
      if (disposed) return
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (typeof window.requestIdleCallback === 'function') {
            idle = window.requestIdleCallback(load, { timeout: 1200 })
          } else {
            timer = window.setTimeout(load, 250)
          }
        })
      })
    }

    const update = () => {
      if (loaded && scene) {
        if (visible && !document.hidden && !motion.matches) scene.startRendering()
        else scene.stopRendering()
        setReady(!motion.matches)
      }
      if (!canLoad() || loading || waiting) return
      waiting = true
      if (document.readyState === 'complete') void afterPageLoad()
      else window.addEventListener('load', afterPageLoad, { once: true })
    }

    const preload = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting
      update()
    }, { rootMargin: '240px' })
    const viewport = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    const resize = new ResizeObserver(() => scene?.resizeDrawingSurfaceToCanvas())
    preload.observe(element)
    viewport.observe(element)
    resize.observe(element)
    motion.addEventListener('change', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      disposed = true
      window.removeEventListener('load', afterPageLoad)
      cancelAnimationFrame(frame)
      if (idle !== undefined) window.cancelIdleCallback(idle)
      if (timer !== undefined) window.clearTimeout(timer)
      preload.disconnect()
      viewport.disconnect()
      resize.disconnect()
      motion.removeEventListener('change', update)
      document.removeEventListener('visibilitychange', update)
      scene?.cleanup()
    }
  }, [src])

  return (
    <div ref={root} className={styles.riveScene} data-rive-ready={ready}>
      {children}
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  )
}
