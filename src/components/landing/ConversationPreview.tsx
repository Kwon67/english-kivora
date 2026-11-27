'use client'

import { useRef, useState } from 'react'
import { ArrowRight, Check, Lightbulb } from 'lucide-react'
import editorialStyles from './Editorial.module.css'
import legacyStyles from './LearningLanding.module.css'

const examples = [
  { phrase: 'Can I have a coffee, please?', answer: 'Um café, por favor.', other: 'Onde fica a cafeteria?', tip: '“Can I have…” é uma forma educada de fazer um pedido.' },
  { phrase: 'Nice to meet you!', answer: 'Prazer em conhecer você!', other: 'Até a próxima!', tip: 'Use esta expressão quando conhecer alguém.' },
  { phrase: 'Could you say that again?', answer: 'Pode repetir, por favor?', other: 'Você já terminou?', tip: 'Pedir para repetir também faz parte de uma boa conversa.' },
]

export default function ConversationPreview({ editorial = false }: { editorial?: boolean }) {
  const styles = editorial ? editorialStyles : legacyStyles
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
