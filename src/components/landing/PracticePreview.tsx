'use client'

import { useLandingLite } from './useLandingLite'
import FeedbackConfetti from './FeedbackConfetti'
import { playLandingSound } from './LandingSound'
import { useRef, useState } from 'react'
import { ArrowRight, Check, Lightbulb, RotateCcw } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { duration, ease } from '@/lib/motion-tokens'
import { formatMinutesEstimate, scheduleReview, type SchedulingState } from '@/features/review/lib/learningSteps'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import styles from './LearningLanding.module.css'
import GrammarPreview from './GrammarPreview'

const examples = [
  { phrase: 'Can I have a coffee, please?', answer: 'Um café, por favor.', other: 'Onde fica a cafeteria?', tip: '“Can I have…” é uma forma educada de fazer um pedido.' },
  { phrase: 'Nice to meet you!', answer: 'Prazer em conhecer você!', other: 'Até a próxima!', tip: 'Use esta expressão quando conhecer alguém.' },
  { phrase: 'Could you say that again?', answer: 'Pode repetir, por favor?', other: 'Você já terminou?', tip: 'Pedir para repetir também faz parte de uma boa conversa.' },
]

export function ConversationPreview() {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<boolean | null>(null)
  const question = examples[index]
  const next = useRef<HTMLButtonElement>(null)
  const firstAnswer = useRef<HTMLButtonElement>(null)

  function choose(correct: boolean) {
    setAnswer(correct)
    if (correct) requestAnimationFrame(() => next.current?.focus({ preventScroll: true }))
  }

  return <div className={styles.heroPractice}>
    <div className={styles.practiceMeta}><span><i /> INGLÊS NA VIDA REAL</span><span>0{index + 1} / 03</span></div>
    <p className={styles.heroPhrase} lang="en">“{question.phrase}”</p>
    <p className={styles.practicePrompt}>O que você diria em português?</p>
    <div className={styles.heroChoices}>
      {[question.answer, question.other].map((text, option) => <button key={text} type="button" ref={option === 0 ? firstAnswer : undefined} disabled={answer === true} data-result={answer === true && option === 0 ? 'correct' : answer === false && option === 1 ? 'retry' : undefined} onClick={() => choose(option === 0)}><span>{text}</span>{answer === true && option === 0 ? <Check size={17} aria-hidden="true" /> : <span aria-hidden="true">{option + 1}</span>}</button>)}
    </div>
    <div className={styles.heroFeedback} aria-live="polite" aria-atomic="true">{answer === true ? <><Check size={17} aria-hidden="true" /><span>{question.tip}</span></> : answer === false ? <><Lightbulb size={17} aria-hidden="true" /><span>Quase! Pense na intenção da frase e tente de novo.</span></> : <span>Experimente. Aprender começa com uma tentativa.</span>}</div>
    {answer === true && <button ref={next} className={styles.inlineAction} onClick={() => { setIndex((index + 1) % examples.length); setAnswer(null); requestAnimationFrame(() => firstAnswer.current?.focus({ preventScroll: true })) }}>Próxima expressão <ArrowRight size={17} aria-hidden="true" /></button>}
  </div>
}

const parts = ['please?', 'a coffee,', 'Can I have']
const correctOrder = [2, 1, 0]
const demoState: SchedulingState = { learningStep: 0, intervalDays: 0, easeFactor: 2.5, repetitions: 0, hasGraduated: false }
const reviewGrades = [
  { label: 'De novo', grade: REVIEW_GRADE.AGAIN, tone: 'speaking' },
  { label: 'Difícil', grade: REVIEW_GRADE.HARD, tone: 'vocabulary' },
  { label: 'Lembrei', grade: REVIEW_GRADE.GOOD, tone: 'review' },
  { label: 'Fácil', grade: REVIEW_GRADE.EASY, tone: 'listening' },
] as const

export default function PracticePreview() {
  const [mode, setMode] = useState<'choose' | 'build' | 'recall'>('choose')
  const [selected, setSelected] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [grade, setGrade] = useState<number | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const correct = selected.every((item, index) => item === correctOrder[index]) && selected.length === 3

  const lite = useLandingLite()
  useGSAP(() => {
    if (lite) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(panel.current, { y: 24, opacity: 0, duration: duration.panel, ease: ease.reveal, clearProps: 'transform,opacity' })
    })
    return () => media.revert()
  }, { scope: panel, dependencies: [mode, revealed, checked, lite], revertOnUpdate: true })

  return <div className={styles.lab}>
    <div className={styles.labTabs} aria-label="Escolha uma prática">
      <button aria-pressed={mode === 'choose'} onClick={() => setMode('choose')}>Escolher</button>
      <button aria-pressed={mode === 'build'} onClick={() => setMode('build')}>Montar</button>
      <button aria-pressed={mode === 'recall'} onClick={() => setMode('recall')}>Relembrar</button>
    </div>
    <div ref={panel} className={styles.labPanel}>
      {mode !== 'choose' && <span className={styles.exampleLabel}>EXEMPLO INTERATIVO · {mode === 'build' ? 'CONSTRUÇÃO DE FRASES' : 'RECORDAÇÃO ATIVA'}</span>}
      {mode === 'choose' ? <GrammarPreview /> : mode === 'build' ? <>
        <h3>Um café, por favor.</h3>
        <p>Toque nas partes para construir seu pedido em inglês.</p>
        <div className={styles.sentence} aria-label="Sua frase" aria-live="polite" lang="en">
          {selected.length ? selected.map((part, index) => <button key={part} aria-label={`Remover ${parts[part]}`} disabled={checked && correct} onClick={() => { setSelected(selected.filter((_, i) => i !== index)); setChecked(false) }}>{parts[part]}</button>) : <span>Sua frase começa aqui…</span>}
        </div>
        <div className={styles.wordBank} lang="en">{parts.map((part, index) => <button key={part} disabled={selected.includes(index)} onClick={() => { setSelected([...selected, index]); setChecked(false) }}>{part}<span aria-hidden="true">+</span></button>)}</div>
        <div className={styles.labFeedback} aria-live="polite" data-correct={checked && correct}>{checked && correct && <FeedbackConfetti />}{checked ? correct ? <><Check size={20} /><span>Isso! <strong>Can I have</strong> abre um pedido educado. Você já pode usar essa frase.</span></> : <><Lightbulb size={20} /><span>Comece com “Can I have”, depois acrescente o pedido. Toque em uma parte para reorganizar.</span></> : <span>Você aprende usando a língua, uma decisão por vez.</span>}</div>
        <div className={styles.labActions}><button className={styles.primary} disabled={selected.length !== 3 || checked && correct} data-sound-feedback onClick={() => { playLandingSound(correct ? 'correct' : 'wrong'); setChecked(true) }}>Verificar frase <Check size={18} /></button><button className={styles.reset} aria-label="Recomeçar frase" onClick={() => { setSelected([]); setChecked(false) }}><RotateCcw size={19} /></button></div>
      </> : <>
        <h3 lang="en">a little closer</h3>
        <p>Tente lembrar o significado antes de revelar.</p>
        <div className={styles.recallAnswer} aria-live="polite">{revealed ? 'um pouco mais perto' : <span aria-hidden="true">•••</span>}</div>
        {!revealed ? <button className={styles.primary} onClick={() => setRevealed(true)}>Revelar significado <ArrowRight size={18} /></button> : <>
          <p className={styles.gradeLabel}>Como foi lembrar?</p>
          <div className={styles.demoGrades}>{reviewGrades.map(item => <button key={item.grade} data-tone={item.tone} aria-pressed={grade === item.grade} onClick={() => setGrade(item.grade)}><strong>{item.label}</strong><span>{formatMinutesEstimate(scheduleReview(item.grade, demoState).intervalMinutes)}</span></button>)}</div>
          <div className={styles.labFeedback} aria-live="polite">{grade !== null ? <><Check size={20} /><span>Neste exemplo, a palavra voltaria em <strong>{formatMinutesEstimate(scheduleReview(grade, demoState).intervalMinutes)}</strong>. Na sua conta, o intervalo considera seu histórico.</span></> : 'O próximo intervalo muda de acordo com a sua resposta.'}</div>
          <button className={styles.inlineAction} onClick={() => { setRevealed(false); setGrade(null) }}>Experimentar de novo <RotateCcw size={16} /></button>
        </>}
      </>}
    </div>
    <p className={styles.demoNote}>Uma amostra para explorar. Esta prática não salva progresso.</p>
  </div>
}
