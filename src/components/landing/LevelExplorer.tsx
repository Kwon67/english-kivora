'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { levels } from './levels'
import styles from './Editorial.module.css'

export default function LevelExplorer() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const readHash = () => {
      const selected = levels.findIndex(item => location.hash === '#nivel-' + item.level)
      if (selected >= 0) setIndex(selected)
    }
    readHash()
    window.addEventListener('hashchange', readHash)
    return () => window.removeEventListener('hashchange', readHash)
  }, [])
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
        aria-pressed={i === index} aria-controls="level-example" onClick={() => {
          setIndex(i)
          history.replaceState(history.state, '', '#nivel-' + item.level)
        }}>{item.level}</button>)}
    </div>
    <div id="level-example" aria-live="polite" aria-atomic="true">
      <p className={styles.eyebrow}>{current.label}</p>
      <h3 lang="en">“{current.phrase}”</h3>
      <p>{current.goal}</p>
    </div>
    <a className={styles.secondary} href="/register">Criar conta <ArrowUpRight size={16} /></a>
  </div>
}
