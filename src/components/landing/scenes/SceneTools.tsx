'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const Leva = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('leva').then(module => module.Leva), { ssr: false }) : null

export default function SceneTools() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    let active = true
    void import('@theatre/studio').then(({ default: studio }) => {
      if (active) { studio.initialize(); studio.ui.restore() }
    })
    return () => { active = false; void import('@theatre/studio').then(({ default: studio }) => studio.ui.hide()) }
  }, [])
  return Leva ? <Leva collapsed /> : null
}
