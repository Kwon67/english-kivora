'use client'

import type { CSSProperties } from 'react'
import { BRAND_PRIMARY } from '@/lib/brandColors'

export type ChartPalette = {
  accent: string
  axis: string
  grid: string
  cursor: string
  activeDotStroke: string
  tooltip: CSSProperties
  tooltipLabel: CSSProperties
  itemStyle: CSSProperties
  polarGrid: string
  tick: {
    fill: string
    fontSize: number
    fontWeight: number
    letterSpacing: string
  }
}

export const chartPalette: ChartPalette = {
  accent: BRAND_PRIMARY,
  axis: '#6B6560',
  grid: 'rgba(193,200,196,0.35)',
  cursor: 'rgba(17,32,51,0.12)',
  activeDotStroke: '#fdfdf8',
  tooltip: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(193,200,196,0.4)',
    borderRadius: '12px',
    boxShadow: '0 18px 44px rgba(27,28,24,0.08)',
    color: '#10130f',
    fontSize: '13px',
    fontWeight: 600,
  },
  tooltipLabel: {
    color: '#6B6560',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  itemStyle: { color: '#1b1c18' },
  polarGrid: 'rgba(193,200,196,0.3)',
  tick: { fill: '#6B6560', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' },
}

export function useChartPalette() {
  return chartPalette
}