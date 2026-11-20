'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const Leva = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('leva').then(module => module.Leva), { ssr: false }) : null

export default function SceneTools() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    let active = true
    let hide: (() => void) | undefined
    void Promise.all([import('@theatre/studio'), import('@theatre/r3f/dist/extension')]).then(([{ default: studio }, { default: extension }]) => {
      if (!active) return
      studio.extend(extension)
      studio.initialize()
      studio.ui.restore()
      hide = () => studio.ui.hide()
    })
    return () => { active = false; hide?.() }
  }, [])
  return Leva ? <Leva collapsed /> : null
}
