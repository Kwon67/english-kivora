import type { CSSProperties } from 'react'

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
  accent: 'var(--grammar-accent)',
  axis: 'var(--kivora-muted)',
  grid: 'var(--kivora-divider)',
  cursor: 'var(--kivora-outline)',
  activeDotStroke: 'var(--kivora-surface)',
  tooltip: {
    backgroundColor: 'var(--kivora-surface)',
    border: '1px solid var(--kivora-line)',
    borderRadius: 'var(--workspace-inset-radius)',
    boxShadow: 'var(--workspace-elevation)',
    color: 'var(--kivora-ink)',
    fontSize: '13px',
    fontWeight: 600,
  },
  tooltipLabel: {
    color: 'var(--kivora-muted)',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  itemStyle: { color: 'var(--kivora-ink)' },
  polarGrid: 'var(--kivora-line)',
  tick: {
    fill: 'var(--kivora-muted)',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.04em',
  },
}
