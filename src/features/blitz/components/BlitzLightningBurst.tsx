'use client'

import { m } from 'framer-motion'

const RAY_COLORS = ['#d8edb0', '#e8e4b8', '#f0f2d4', '#dce8b4', '#ebe6b8']

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
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: [0, 0.55, 0.35, 0], scale: [0.2, length, length * 1.02, length * 1.08] }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.9, 0.3, 1] }}
    >
      <svg
        viewBox="0 0 32 120"
        className="-translate-x-1/2 -translate-y-1/2"
        style={{
          width: '1.75rem',
          height: '7rem',
          filter: 'drop-shadow(0 0 6px rgba(202,233,189,0.35)) drop-shadow(0 0 12px rgba(228,220,160,0.2))',
        }}
        aria-hidden
      >
        <path
          d="M16 0 L10 46 L18 46 L6 120 L26 52 L16 52 Z"
          fill={color}
          fillOpacity={0.82}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </m.div>
  )
}

export default function BlitzLightningBurst({ intensity = 1 }: BlitzLightningBurstProps) {
  const rayCount = intensity >= 5 ? 8 : intensity >= 3 ? 7 : 6
  const rayLength = intensity >= 5 ? 1.2 : intensity >= 3 ? 1.05 : 0.92
  const flashStrength = intensity >= 5 ? 0.1 : intensity >= 3 ? 0.07 : 0.05

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden rounded-[inherit]">
      <m.div
        className="absolute inset-0 rounded-[inherit] bg-[#d4e8b8]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, flashStrength, 0] }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
      />

      <m.div
        className="absolute inset-0 rounded-[inherit] ring-1 ring-[#cae9bd]/20 ring-inset"
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: [0, 0.28, 0], scale: [0.99, 1.005, 1.01] }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
      />

      <m.div
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4e8b8]"
        style={{ filter: 'blur(20px)' }}
        initial={{ opacity: 0, scale: 0.25 }}
        animate={{ opacity: [0, 0.22, 0.06, 0], scale: [0.25, 1.6, 2, 2.3] }}
        transition={{ duration: 0.48, ease: 'easeOut' }}
      />

      <m.div
        className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{ filter: 'blur(4px)' }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.22, 0], scale: [0, 1.1, 1.35] }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      />

      {Array.from({ length: rayCount }, (_, index) => (
        <LightningRay
          key={index}
          angle={(360 / rayCount) * index + 8}
          delay={index * 0.015}
          length={rayLength}
          color={RAY_COLORS[index % RAY_COLORS.length]}
        />
      ))}
    </div>
  )
}