'use client'

import { useRef, useState } from 'react'
import { Flip, gsap, useGSAP } from '@/lib/gsap'
import { useLandingLite } from './useLandingLite'
import { duration, ease } from '@/lib/motion-tokens'
import Link from 'next/link'
import { ArrowRight, Check, Compass } from 'lucide-react'
import styles from './LearningLanding.module.css'

const levels = [
  { level: 'A1', label: 'Primeiros encontros', phrase: 'Hello, I’m learning English.', goal: 'Apresente-se, reconheça palavras e construa suas primeiras frases.', tone: 'review' },
  { level: 'A2', label: 'O seu dia a dia', phrase: 'Could I have a coffee, please?', goal: 'Fale sobre sua rotina, faça pedidos e encontre seu caminho.', tone: 'listening' },
  { level: 'B1', label: 'Mais independência', phrase: 'Let me tell you what happened.', goal: 'Conte experiências, converse sobre planos e explique suas ideias.', tone: 'vocabulary' },
  { level: 'B2', label: 'Sua voz no mundo', phrase: 'Here’s how I see it.', goal: 'Defenda pontos de vista e participe de conversas mais complexas.', tone: 'speaking' },
  { level: 'C1', label: 'Clareza e nuances', phrase: 'That’s a compelling perspective.', goal: 'Explore nuances, argumentos e diferentes registros de linguagem.', tone: 'grammar' },
  { level: 'C2', label: 'Expressão com precisão', phrase: 'There’s more to it than meets the eye.', goal: 'Refine a precisão, interprete sutilezas e amplie seu repertório.', tone: 'listening' },
] as const

export default function LevelExplorer() {
  "use memo"
  const [index, setIndex] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const selectedChip = useRef<HTMLElement | null>(null)
  const fromSwipe = useRef(false)
  const lite = useLandingLite()
  function activate(next: number, center = true) {
    const button = rail.current?.querySelectorAll<HTMLButtonElement>('button')[next]
    if (!button) return
    if (next !== index) {
      selectedChip.current = button.querySelector('span')
      setIndex(next)
    }
    if (center && rail.current && rail.current.scrollWidth > rail.current.clientWidth) {
      const track = rail.current
      track.scrollTo({ left: track.scrollLeft + button.getBoundingClientRect().left - track.getBoundingClientRect().left
        - (track.clientWidth - button.offsetWidth) / 2, behavior: lite || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
  }
  useGSAP(() => {
    if (lite) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const card = panel.current
      const chip = selectedChip.current
      if (!card || !chip) return
      // Expand the selected stop into the example card using transform-only FLIP.
      const fit = Flip.fit(card, chip, { getVars: true, scale: true })
      if (fit) gsap.from(card, { ...fit, duration: duration.panel, ease: ease.reveal, clearProps: 'transform' })
    })
    return () => media.revert()
  }, { scope: panel, dependencies: [index, lite], revertOnUpdate: true })
  const current = levels[index]
  return <div className={styles.pathExplorer}>
    <div ref={rail} className={styles.levels} aria-label="Explore os níveis de inglês"
      onPointerDown={() => { fromSwipe.current = true }} onScrollEnd={() => {
        if (!rail.current || !fromSwipe.current) return
        fromSwipe.current = false
        const track = rail.current.getBoundingClientRect()
        const midpoint = track.left + track.width / 2
        const distances = Array.from(rail.current.children, child => {
          const rect = child.getBoundingClientRect()
          return Math.abs(rect.left + rect.width / 2 - midpoint)
        })
        activate(distances.indexOf(Math.min(...distances)), false)
      }}
      onKeyDown={event => {
        const active = Array.from(event.currentTarget.children).indexOf(event.target as HTMLElement)
        const next = { ArrowLeft: Math.max(0, active - 1), ArrowRight: Math.min(5, active + 1), Home: 0, End: 5 }[event.key]
        if (next === undefined) return
        event.preventDefault()
        activate(next)
        rail.current?.querySelectorAll('button')[next]?.focus({ preventScroll: true })
      }}>{levels.map((item, i) => <button key={item.level} data-tone={item.tone} aria-pressed={index === i} aria-controls="level-example" onClick={() => { fromSwipe.current = false; activate(i) }}><span>{item.level}</span><small>{i < 2 ? 'Base' : i < 4 ? 'Autonomia' : 'Proficiência'}</small></button>)}</div>
    <div ref={panel} id="level-example" className={styles.levelExample} data-tone={current.tone} aria-live="polite" aria-atomic="true">
      <div className={styles.levelStamp} aria-hidden="true"><Compass size={24} /><strong>{current.level}</strong></div>
      <div><p className={styles.exampleLabel}>{current.label}</p><h3 lang="en">“{current.phrase}”</h3><p>{current.goal}</p></div>
      <Link href="/register" transitionTypes={['kivora-auth']} className={styles.roundLink} aria-label={`Começar a aprender inglês: ${current.level}`}><ArrowRight size={23} /></Link>
    </div>
    <p className={styles.pathNote}><Check size={16} aria-hidden="true" /> Seu ponto de partida respeita o que você já sabe.</p>
  </div>
}
