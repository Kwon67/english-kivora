'use client'

import { useRef } from 'react'
import { m, useMotionValue, useSpring, useTransform } from 'framer-motion'

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
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Suaviza o movimento
  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  // Transforma posição do mouse em rotação
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [strength, -strength])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-strength, strength])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    // Normaliza posição para range -0.5 a 0.5
    const mouseX = (e.clientX - rect.left) / width - 0.5
    const mouseY = (e.clientY - rect.top) / height - 0.5
    
    x.set(mouseX)
    y.set(mouseY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative perspective-1000 ${className}`}
      style={{ perspective: '1200px' }}
    >
      <m.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="w-full h-full transition-shadow duration-300"
      >
        {children}
        
      </m.div>
    </div>
  )
}
