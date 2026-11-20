'use client'

import dynamic from 'next/dynamic'
import type { CSSProperties, ReactNode } from 'react'
import useSceneVisibility from './useSceneVisibility'

const SceneCanvas = dynamic(() => import('./SceneCanvas'), { ssr: false })

export default function LandingScene({ src, label, style, fallback, children }: {
  src?: string; label: string; style: CSSProperties; fallback?: ReactNode; children?: ReactNode
}) {
  const { ref, entered, visible, reduced } = useSceneVisibility()
  return <div ref={ref} style={style} role="img" aria-label={label}>
    {entered ? <SceneCanvas src={src} fallback={fallback} frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'}>
      {children}
    </SceneCanvas> : fallback}
  </div>
}
