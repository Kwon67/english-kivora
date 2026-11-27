'use client'

import { playLandingSound } from './landingSound'
import { useRef, useState } from 'react'
import { ArrowRight, Check, Lightbulb, RotateCcw } from 'lucide-react'
import styles from './Editorial.module.css'

const questions = [
  { before: 'This is', after: 'book.', choices: ['a', 'an', 'the'], answer: 'a', translation: 'Este é um livro.', explanation: 'Para dizer “um livro”, use “a book”. “Book” começa com som de consoante. “The book” seria “o livro”.' },
  { before: 'She has', after: 'idea.', choices: ['a', 'an', 'the'], answer: 'an', translation: 'Ela tem uma ideia.', explanation: '“Idea” começa com som de vogal. Por isso, dizemos “an idea”.' },
  { before: 'We read', after: 'books.', choices: ['a', 'an', 'two'], answer: 'two', translation: 'Nós lemos dois livros.', explanation: '“Books” está no plural: two books. “A” e “an” acompanham substantivos no singular.' },
]

export default function GrammarPreview() {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const firstOption = useRef<HTMLButtonElement>(null)
  const question = questions[index]
  const correct = selected === question.answer
  return <div className={styles.exercise}>
    <div className={styles.sessionTop}><span>PRÁTICA DE GRAMÁTICA</span><span>{index + 1} / {questions.length}</span></div>
    <div className={styles.progress} role="progressbar" aria-label="Exemplos de gramática" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index + (confirmed && correct ? 1 : 0)}><span style={{ transform: `scaleX(${(index + (confirmed && correct ? 1 : 0)) / questions.length})` }} /></div>
    <div data-exercise-question><p className={styles.instruction}>Escolha a opção correta.</p><p className={styles.question} lang="en">{question.before} <span className={styles.questionBlank}>{selected || '\u00a0'}</span> {question.after}</p><p className={styles.translation}>{question.translation}</p></div>
    <div className={`${styles.options} ${styles.shortOptions}`} aria-label="Alternativas" lang="en">{question.choices.map((option, i) => <button ref={i === 0 ? firstOption : undefined} key={option} className={styles.option} aria-pressed={selected === option} disabled={confirmed} data-result={confirmed ? option === question.answer ? 'correct' : option === selected ? 'wrong' : 'muted' : undefined} onClick={() => setSelected(option)}><span>{option}</span>{selected === option && <span className={styles.selection}><Check size={15} aria-hidden="true" /></span>}</button>)}</div>
    {confirmed && <div data-exercise-feedback className={styles.feedback} data-correct={correct} role="status">{correct ? <Check size={19} aria-hidden="true" /> : <Lightbulb size={19} aria-hidden="true" />}<p><strong>{correct ? 'Muito bem! ' : 'Vamos entender? '}</strong>{question.explanation}</p></div>}
    <button className={styles.confirm} disabled={!selected} data-sound-feedback={confirmed ? undefined : true} onClick={() => {
      if (!confirmed) { playLandingSound(correct ? 'correct' : 'wrong'); setConfirmed(true) }
      else {
        if (correct) setIndex((index + 1) % questions.length)
        setSelected(null); setConfirmed(false)
        requestAnimationFrame(() => firstOption.current?.focus({ preventScroll: true }))
      }
    }}>{confirmed ? correct ? index === questions.length - 1 ? 'Praticar novamente' : 'Continuar' : 'Tentar de novo' : 'Confirmar'}{confirmed && !correct ? <RotateCcw size={20} /> : <ArrowRight size={20} />}</button>
  </div>
}
