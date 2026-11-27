'use client'

import { playLandingSound } from './landingSound'
import { useEffect, useState } from 'react'
import { ArrowRight, Check, Lightbulb, RotateCcw } from 'lucide-react'
import { formatMinutesEstimate, scheduleReview, type SchedulingState } from '@/features/review/lib/learningSteps'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import styles from './Editorial.module.css'
import Image from 'next/image'
import GrammarPreview from './GrammarPreview'

const recallCards = [
  { phrase: 'a little closer', translation: 'um pouco mais perto' },
  { phrase: 'around the corner', translation: 'logo ali na esquina' },
  { phrase: 'on the way', translation: 'a caminho' },
]

const parts = ['please?', 'a coffee,', 'Can I have']
const correctOrder = [2, 1, 0]
const demoState: SchedulingState = { learningStep: 0, intervalDays: 0, easeFactor: 2.5, repetitions: 0, hasGraduated: false }
const reviewGrades = [
  { label: 'De novo', grade: REVIEW_GRADE.AGAIN, tone: 'speaking' },
  { label: 'Difícil', grade: REVIEW_GRADE.HARD, tone: 'vocabulary' },
  { label: 'Lembrei', grade: REVIEW_GRADE.GOOD, tone: 'review' },
  { label: 'Fácil', grade: REVIEW_GRADE.EASY, tone: 'listening' },
] as const

const practiceModes = [
  { key: 'choose', label: 'Escolher', description: 'Complete a frase com a palavra certa.', width: 531, height: 451 },
  { key: 'build', label: 'Montar', description: 'Coloque as palavras em ordem para fazer seu pedido.', width: 596, height: 484 },
  { key: 'recall', label: 'Relembrar', description: 'Teste a memória e descubra quando revisar.', width: 453, height: 488 },
] as const

export default function PracticePreview() {
  const [mode, setMode] = useState<'choose' | 'build' | 'recall' | null>(null)
  useEffect(() => {
    const openLinkedMode = () => {
      if (location.hash === '#practice-recall' || location.hash === '#revisoes') setMode('recall')
      if (location.hash === '#practice-choose' || location.hash === '#practice-demo') setMode('choose')
      if (location.hash === '#practice-build') setMode('build')
    }
    openLinkedMode()
    window.addEventListener('hashchange', openLinkedMode)
    return () => window.removeEventListener('hashchange', openLinkedMode)
  }, [])
  const [selected, setSelected] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  const [recallIndex, setRecallIndex] = useState(0)
  const recallCard = recallCards[recallIndex]
  const [revealed, setRevealed] = useState(false)
  const [grade, setGrade] = useState<number | null>(null)
  const correct = selected.every((item, index) => item === correctOrder[index]) && selected.length === 3

  return <div id="practice-demo" data-practice-lab className={styles.lab}>
    <div className={styles.cards} aria-label="Escolha uma prática">
      {practiceModes.map(({ key, label, description, width, height }) => <button
        type="button" id={'practice-' + key} key={key} aria-expanded={mode === key}
        aria-controls="practice-panel" className={styles.practiceCard}
        onClick={() => {
          const next = mode === key ? null : key
          setMode(next)
          history.replaceState(history.state, '', next ? '#practice-' + next : '#como-funciona')
        }}>
        <span id={key === 'recall' ? 'revisoes' : undefined} className={styles.cardHeading}>{label}<ArrowRight aria-hidden="true" size={23} /></span>
        <span className={styles.cardDescription}>{description}</span>
        <Image src={'/images/editorial/' + key + '.webp'} alt="" width={width} height={height} />
      </button>)}
    </div>
    <div id="practice-panel" hidden={!mode} className={styles.labPanel}>
      {mode && <>
      {mode !== 'choose' && <span className={styles.exampleLabel}>{mode === 'build' ? 'CONSTRUÇÃO DE FRASES' : 'RECORDAÇÃO ATIVA'}</span>}
      {mode === 'choose' ? <GrammarPreview /> : mode === 'build' ? <>
        <h3>Um café, por favor.</h3>
        <p>Monte seu pedido em inglês.</p>
        <div className={styles.sentence} aria-label="Sua frase" aria-live="polite" lang="en">
          {selected.length ? selected.map((part, index) => <button key={part} aria-label={`Remover ${parts[part]}`} disabled={checked && correct} onClick={() => { setSelected(selected.filter((_, i) => i !== index)); setChecked(false) }}>{parts[part]}</button>) : <span>Sua frase…</span>}
        </div>
        <div className={styles.wordBank} lang="en">{parts.map((part, index) => <button key={part} disabled={selected.includes(index)} onClick={() => { setSelected([...selected, index]); setChecked(false) }}>{part}<span aria-hidden="true">+</span></button>)}</div>
        <div className={styles.labFeedback} aria-live="polite" data-correct={checked && correct}>{checked ? correct ? <><Check size={20} /><span><strong>Can I have</strong> inicia um pedido educado.</span></> : <><Lightbulb size={20} /><span>Comece com “Can I have”. Toque nas partes para reorganizar.</span></> : <span>Toque numa parte da frase para removê-la.</span>}</div>
        <div className={styles.labActions}><button className={styles.primary} disabled={selected.length !== 3 || checked && correct} data-sound-feedback onClick={() => { playLandingSound(correct ? 'correct' : 'wrong'); setChecked(true) }}>Verificar frase <Check size={18} /></button><button className={styles.reset} aria-label="Recomeçar frase" onClick={() => { setSelected([]); setChecked(false) }}><RotateCcw size={19} /></button></div>
      </> : <>
        <h3 lang="en">{recallCard.phrase}</h3>
        <p>Tente lembrar o significado antes de revelar.</p>
        <div className={styles.recallAnswer} aria-live="polite">{revealed ? recallCard.translation : <span aria-hidden="true">•••</span>}</div>
        {!revealed ? <button className={styles.primary} onClick={() => setRevealed(true)}>Revelar significado <ArrowRight size={18} /></button> : <>
          <p className={styles.gradeLabel}>Como foi lembrar?</p>
          <div className={styles.demoGrades}>{reviewGrades.map(item => <button key={item.grade} data-review-grade data-tone={item.tone} aria-pressed={grade === item.grade} onClick={() => setGrade(item.grade)}><strong>{item.label}</strong><span>{formatMinutesEstimate(scheduleReview(item.grade, demoState).intervalMinutes)}</span></button>)}</div>
          <div className={styles.labFeedback} aria-live="polite">{grade !== null ? <><Check size={20} /><span>Próxima revisão em <strong>{formatMinutesEstimate(scheduleReview(grade, demoState).intervalMinutes)}</strong> nesta demonstração.</span></> : 'Escolha como foi lembrar.'}</div>
          <button className={styles.inlineAction} onClick={() => { setRevealed(false); setGrade(null); setRecallIndex(i => (i + 1) % recallCards.length) }}>Próxima expressão <RotateCcw size={16} /></button>
        </>}
      </>}
      <p className={styles.demoNote}>Demonstração sem registro de progresso.</p>
      </>}
    </div>
  </div>
}
