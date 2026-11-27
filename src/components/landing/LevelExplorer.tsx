'use client'

import { useFlipSelection } from '@/components/motion/useFlipSelection'
import { duration, ease } from '@/lib/motion-tokens'
import { useLandingLite } from './useLandingLite'
import { useDrag } from '@use-gesture/react'
import { useEffect } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { levels } from './levels'
import styles from './Editorial.module.css'

export default function LevelExplorer() {
  const lite = useLandingLite()
  const { index, select, indicator, id } = useFlipSelection(0, lite ? 0 : duration.feedback, ease.reveal)
  function selectLevel(next: number) {
    select(next)
    history.replaceState(history.state, '', '#nivel-' + levels[next].level)
  }
  const swipe = useDrag(({ last, movement: [x], canceled }) => {
    if (last && !canceled && Math.abs(x) >= 48) selectLevel(Math.max(0, Math.min(levels.length - 1, index + (x < 0 ? 1 : -1))))
  }, { axis: 'x', filterTaps: true })
  useEffect(() => {
    const readHash = () => {
      const selected = levels.findIndex(item => location.hash === '#nivel-' + item.level)
      if (selected >= 0) select(selected)
    }
    readHash()
    window.addEventListener('hashchange', readHash)
    return () => window.removeEventListener('hashchange', readHash)
  }, [select])
  const current = levels[index]
  return <div className={styles.explorer}>
    <div className={styles.levelButtons} role="group" aria-label="Escolha seu nível" onKeyDown={event => {
      const active = Array.from(event.currentTarget.children).indexOf(event.target as HTMLElement)
      const next = { ArrowLeft: Math.max(0, active - 1), ArrowRight: Math.min(levels.length - 1, active + 1), Home: 0, End: levels.length - 1 }[event.key]
      if (next === undefined) return
      event.preventDefault()
      const button = event.currentTarget.querySelectorAll('button')[next]
      button.focus()
      button.click()
    }}>
      {levels.map((item, i) => <button type="button" key={item.level} id={'nivel-' + item.level}
        aria-pressed={i === index} aria-controls="level-example" onClick={() => selectLevel(i)}>
          {i === index && <span aria-hidden="true" className={styles.levelIndicator} ref={indicator} data-flip-id={id} />}
          <span>{item.level}</span>
        </button>)}
    </div>
    <div {...swipe()} className={styles.swipeExample} id="level-example" aria-live="polite" aria-atomic="true">
      <p className={styles.eyebrow}>{current.label}</p>
      <h3 key={current.level} lang="en">“{current.phrase}”</h3>
      <p>{current.goal}</p>
    </div>
    <a className={styles.secondary} href="/register">Criar conta <ArrowUpRight size={16} /></a>
  </div>
}
