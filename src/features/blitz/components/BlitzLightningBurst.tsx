'use client'

import { m } from 'framer-motion'

const RAY_COLORS = ['#b8ff5c', '#f4d36b', '#fff7c2', '#e8ff9a', '#ffd86a']

interface BlitzLightningBurstProps {
  intensity?: number
}

function LightningRay({
  angle,
  delay,
  length,
  color,
}: {
  angle: number
  delay: number
  length: number
  color: string
}) {
  return (
    <m.div
      className="absolute left-1/2 top-1/2 origin-center"
      style={{ rotate: `${angle}deg` }}
      initial={{ opacity: 0, scale: 0.15 }}
      animate={{ opacity: [0, 1, 0.75, 0], scale: [0.15, length, length * 1.08, length * 1.2] }}
      transition={{ duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <svg
        viewBox="0 0 32 120"
        className="-translate-x-1/2 -translate-y-1/2"
        style={{ width: '2.25rem', height: '9.5rem', filter: 'drop-shadow(0 0 10px rgba(184,255,92,0.95)) drop-shadow(0 0 22px rgba(244,211,107,0.65))' }}
        aria-hidden
      >
        <path
          d="M16 0 L10 46 L18 46 L6 120 L26 52 L16 52 Z"
          fill={color}
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </m.div>
  )
}

export default function BlitzLightningBurst({ intensity = 1 }: BlitzLightningBurstProps) {
  const rayCount = intensity >= 5 ? 12 : intensity >= 3 ? 10 : 8
  const rayLength = intensity >= 5 ? 1.55 : intensity >= 3 ? 1.35 : 1.15
  const flashStrength = intensity >= 5 ? 0.22 : intensity >= 3 ? 0.16 : 0.11

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden rounded-[inherit]">
      <m.div
        className="absolute inset-0 rounded-[inherit] bg-[#b8ff5c]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, flashStrength, 0] }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      <m.div
        className="absolute inset-0 rounded-[inherit] ring-1 ring-[#b8ff5c]/35 ring-inset"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: [0, 0.55, 0], scale: [0.98, 1.01, 1.02] }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />

      <m.div
        className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b8ff5c]"
        style={{ filter: 'blur(24px)' }}
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 0.45, 0.12, 0], scale: [0.2, 2.2, 2.8, 3.2] }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
      />

      <m.div
        className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{ filter: 'blur(5px)' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.45, 0], scale: [0, 1.3, 1.8] }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {Array.from({ length: rayCount }, (_, index) => (
        <LightningRay
          key={index}
          angle={(360 / rayCount) * index + 8}
          delay={index * 0.02}
          length={rayLength}
          color={RAY_COLORS[index % RAY_COLORS.length]}
        />
      ))}
    </div>
  )
}