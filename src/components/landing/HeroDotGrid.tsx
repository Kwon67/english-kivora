'use client'

import { useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import styles from './HeroDotGrid.module.css'

const DotGrid = dynamic(() => import('./dot-grid/DotGrid'), { ssr: false })
const motionQuery = '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)'
const touchQuery = '(any-pointer: coarse)'

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(motionQuery), window.matchMedia(touchQuery)]
  queries.forEach(query => query.addEventListener('change', onChange))
  return () => queries.forEach(query => query.removeEventListener('change', onChange))
}

function getSnapshot() {
  return navigator.maxTouchPoints === 0 && window.matchMedia(motionQuery).matches && !window.matchMedia(touchQuery).matches
}

export default function HeroDotGrid() {
  const interactive = useSyncExternalStore(subscribe, getSnapshot, () => false)

  return (
    <div className={styles.background} aria-hidden="true" data-hero-dot-grid>
      <div className={styles.staticGrid} />
      {interactive ? (
        <DotGrid
          className={styles.interactiveGrid}
          dotSize={2}
          gap={24}
          baseColor="var(--brand-violet)"
          activeColor="var(--brand-violet)"
          opacity={0.2}
          proximity={120}
          strength={0.35}
          shockRadius={260}
          shockStrength={1.8}
          swell={0.3}
          stretch={0.2}
          glow={0}
          intro={false}
        />
      ) : null}
    </div>
  )
}
