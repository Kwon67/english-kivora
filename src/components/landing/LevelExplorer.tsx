'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
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
  const [index, setIndex] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(panel.current?.children ?? [], { y: 22, opacity: 0, duration: .5, stagger: .07, ease: 'power3.out', clearProps: 'transform,opacity' })
    })
    return () => media.revert()
  }, { scope: panel, dependencies: [index], revertOnUpdate: true })
  const current = levels[index]
  return <div className={styles.pathExplorer}>
    <div className={styles.levels} aria-label="Explore os níveis de inglês">{levels.map((item, i) => <button key={item.level} data-tone={item.tone} aria-pressed={index === i} aria-controls="level-example" onClick={() => setIndex(i)}><span>{item.level}</span><small>{i < 2 ? 'Base' : i < 4 ? 'Autonomia' : 'Proficiência'}</small></button>)}</div>
    <div ref={panel} id="level-example" className={styles.levelExample} data-tone={current.tone} aria-live="polite" aria-atomic="true">
      <div className={styles.levelStamp} aria-hidden="true"><Compass size={24} /><strong>{current.level}</strong></div>
      <div><p className={styles.exampleLabel}>{current.label}</p><h3 lang="en">“{current.phrase}”</h3><p>{current.goal}</p></div>
      <Link href="/register" className={styles.roundLink} aria-label={`Começar a aprender inglês: ${current.level}`}><ArrowRight size={23} /></Link>
    </div>
    <p className={styles.pathNote}><Check size={16} aria-hidden="true" /> Seu ponto de partida respeita o que você já sabe.</p>
  </div>
}
