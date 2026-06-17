'use client'

import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { BRAND_PRIMARY, BRAND_PRIMARY_DARK } from '@/lib/brandColors'
import { useTheme } from '@/lib/theme'

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

function buildPalette(theme: 'light' | 'dark'): ChartPalette {
  if (theme === 'dark') {
    return {
      accent: BRAND_PRIMARY_DARK,
      axis: '#8e9a78',
      grid: 'rgba(142, 154, 120, 0.28)',
      cursor: 'rgba(184, 255, 92, 0.18)',
      activeDotStroke: '#11160e',
      tooltip: {
        backgroundColor: 'rgba(17, 22, 14, 0.96)',
        border: '1px solid rgba(213, 230, 169, 0.28)',
        borderRadius: '12px',
        boxShadow: '0 18px 44px rgba(0, 0, 0, 0.42)',
        color: '#f4f7e9', // --color-text dark
        fontSize: '13px',
        fontWeight: 600,
      },
      tooltipLabel: {
        color: '#b9c3a4', // --color-text-muted dark
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      },
      itemStyle: { color: '#f4f7e9' },
      polarGrid: 'rgba(142, 154, 120, 0.28)',
      tick: { fill: '#8e9a78', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' },
    }
  }

  return {
    accent: BRAND_PRIMARY,
    axis: '#6d7d63',
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
      color: '#6d7d63',
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    },
    itemStyle: { color: '#1b1c18' },
    polarGrid: 'rgba(193,200,196,0.3)',
    tick: { fill: '#6d7d63', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' },
  }
}

export function useChartPalette() {
  const { theme } = useTheme()
  return useMemo(() => buildPalette(theme === 'dark' ? 'dark' : 'light'), [theme])
}