'use client'

import dynamic from 'next/dynamic'
import type { CSSProperties, ReactNode } from 'react'
import useSceneVisibility from './useSceneVisibility'

const Unicorn = dynamic(() => import('unicornstudio/react').then(module => module.UnicornScene), { ssr: false })
const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })
const Lottie = dynamic(() => import('./LottiePlayer'), { ssr: false })

type Frame = { style: CSSProperties; poster: ReactNode }

export function UnicornScene({ projectId, jsonFilePath, style, poster }: Frame & { projectId: string; jsonFilePath?: string }) {
  const { ref, entered, visible, reduced } = useSceneVisibility()
  return <div ref={ref} style={style}>{entered && !reduced
    ? <Unicorn production projectId={projectId} jsonFilePath={jsonFilePath} paused={!visible} placeholder={poster} />
    : poster}</div>
}

export function SplineScene({ src, style, poster }: Frame & { src: string }) {
  const { ref, visible, reduced } = useSceneVisibility()
  return <div ref={ref} style={style}>{visible && !reduced
    ? <Spline scene={src} renderOnDemand htmlContentMode="none" />
    : poster}</div>
}

export function LottieScene({ src, style, poster }: Frame & { src: string }) {
  const { ref, visible, reduced } = useSceneVisibility()
  return <div ref={ref} style={style}>{visible && !reduced ? <Lottie src={src} /> : poster}</div>
}
