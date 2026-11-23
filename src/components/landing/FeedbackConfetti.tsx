'use client'

import { useRef } from 'react'
import { useLandingLite } from './useLandingLite'
import { gsap, useGSAP } from '@/lib/gsap'

const colors = ['var(--lime)', 'var(--mint)', 'var(--butter)', 'var(--plum)', 'var(--paper)', 'var(--ink)']
export default function FeedbackConfetti() {
  const ref = useRef<HTMLSpanElement>(null)
  const lite = useLandingLite()
  useGSAP(() => {
    if (lite) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      Array.from(ref.current!.children).forEach((piece, i) => {
        const angle = -Math.PI * (i + 1) / (colors.length + 1)
        gsap.fromTo(piece, { opacity: 1, rotation: 0 }, {
          x: Math.cos(angle) * 52, y: Math.sin(angle) * 44, rotation: i * 48, opacity: 0, duration: .6, ease: 'power2.out',
        })
      })
    })
    return () => media.revert()
  }, { scope: ref, dependencies: [lite], revertOnUpdate: true })
  if (lite) return null
  return <span ref={ref} aria-hidden="true" style={{ position: 'relative', width: 0, height: 0 }}>
    {colors.map(color => <i key={color} style={{ backgroundColor: color, position: 'absolute', height: 6, width: 4, opacity: 0 }} />)}
  </span>
}
