'use client'

import { useEffect } from 'react'
import { EventType, RuntimeLoader, useRive } from '@rive-app/react-canvas'

RuntimeLoader.setWasmUrl(new URL('@rive-app/canvas/rive.wasm', import.meta.url).href)
RuntimeLoader.setWasmFallbackUrl(new URL('@rive-app/canvas/rive_fallback.wasm', import.meta.url).href)

export default function RiveCanvas({ src, active, stateMachine, onReady }: {
  src: string; active: boolean; stateMachine?: string; onReady: (ready: boolean) => void
}) {
  const { rive, setCanvasRef, canvas } = useRive({ src, autoplay: true, stateMachine }, {
    shouldResizeCanvasToContainer: false, shouldUseIntersectionObserver: false,
  })
  useEffect(() => {
    if (!rive || !canvas) return
    const resize = () => rive.resizeDrawingSurfaceToCanvas()
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    let frame = 0
    const advanced = () => {
      rive.off(EventType.Advance, advanced)
      // The runtime draws after advancing. Keep the still through that frame.
      frame = requestAnimationFrame(() => onReady(true))
    }
    rive.on(EventType.Advance, advanced)
    return () => {
      observer.disconnect()
      rive.off(EventType.Advance, advanced)
      cancelAnimationFrame(frame)
      onReady(false)
    }
  }, [canvas, rive, onReady])
  useEffect(() => {
    if (active) rive?.startRendering()
    else rive?.stopRendering()
  }, [active, rive])
  return <canvas ref={setCanvasRef} aria-hidden="true" />
}
