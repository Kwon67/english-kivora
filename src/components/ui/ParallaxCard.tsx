'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

interface ParallaxCardProps {
  children: React.ReactNode
  className?: string
  strength?: number
}

export default function ParallaxCard({
  children,
  className = '',
  strength = 15,
}: ParallaxCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const card = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const area = containerRef.current!
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference) and (hover: hover)', () => {
      const rotateX = gsap.quickTo(card.current, 'rotationX', { duration: 0.46, ease: 'back.out(0.8)' })
      const rotateY = gsap.quickTo(card.current, 'rotationY', { duration: 0.46, ease: 'back.out(0.8)' })
      let bounds: DOMRect | undefined
      const measure = () => { bounds = undefined }
      const move = (event: PointerEvent) => {
        bounds ??= area.getBoundingClientRect()
        if (!bounds.width || !bounds.height) return
        rotateX((1 - 2 * (event.clientY - bounds.top) / bounds.height) * strength)
        rotateY((2 * (event.clientX - bounds.left) / bounds.width - 1) * strength)
      }
      const leave = () => { rotateX(0); rotateY(0); measure() }
      const observer = new ResizeObserver(measure)
      observer.observe(area)
      area.addEventListener('pointermove', move)
      area.addEventListener('pointerleave', leave)
      window.addEventListener('scroll', measure, true)
      return () => {
        observer.disconnect()
        area.removeEventListener('pointermove', move)
        area.removeEventListener('pointerleave', leave)
        window.removeEventListener('scroll', measure, true)
      }
    })
    return () => media.revert()
  }, { scope: containerRef, dependencies: [strength], revertOnUpdate: true })

  return (
    <div
      ref={containerRef}
      className={`relative perspective-1000 ${className}`}
      style={{ perspective: '1200px' }}
    >
      <div ref={card} style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full transition-shadow duration-300"
      >
        {children}
        
      </div>
    </div>
  )
}
