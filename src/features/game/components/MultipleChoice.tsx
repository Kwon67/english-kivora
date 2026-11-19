'use client'

import { CELEBRATION_COLORS } from '@/lib/brandColors'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { Check, X, ArrowRight } from 'lucide-react'
import { getCardTypingTranslations } from '@/features/cards/lib/cardTranslations'
import { buildMultipleChoiceOptions } from '@/features/game/lib/multipleChoiceOptions'
import type { Card } from '@/types/database.types'
import AudioButton from '@/components/ui/AudioButton'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import PracticeBooks from '@/components/illustrations/PracticeBooks'
import styles from './ChoiceExercise.module.css'
import { feedback } from '@/lib/feedback'

gsap.registerPlugin(useGSAP)


interface MultipleChoiceProps {
  card: Card
  allCards: Card[]
  onCorrect: (latencyMs?: number) => void
  onWrong: (latencyMs?: number) => void
  variant?: 'practice' | 'blitz' | 'assignment'
}

export default function MultipleChoice({
  card,
  allCards,
  onCorrect,
  onWrong,
  variant = 'practice',
}: MultipleChoiceProps) {
  const isBlitzVariant = variant === 'blitz'
  const isAssignment = variant === 'assignment'
  const [selected, setSelected] = useState<string | null>(null)
  const [isValidated, setIsValidated] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const [startTime] = useState(() => Date.now())
  const root = useRef<HTMLDivElement>(null)
  const validated = useRef(false)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (!root.current || isAssignment || isBlitzVariant) return
      if (!isValidated) {
        gsap.from(root.current.querySelectorAll('[data-choice-enter]'), { y: 12, stagger: .06, duration: .45, ease: 'power3.out', clearProps: 'transform' })
      } else {
        gsap.from(root.current.querySelectorAll('[data-result=correct]'), { scale: .97, duration: .35, ease: 'back.out(1.4)', clearProps: 'transform' })
      }
    })
    return () => media.revert()
  }, { scope: root, dependencies: [card.id, isAssignment, isBlitzVariant, isValidated], revertOnUpdate: true })

  const options = useMemo(() => {
    return buildMultipleChoiceOptions(card, allCards)
  }, [allCards, card])

  const handleSelect = useCallback(
    (option: string, index: number) => {
      if (isValidated || !option) return
      setSelected(option)
      setFocusedIndex(index)
      feedback.click()
    },
    [isValidated],
  )

  const triggerConfetti = useCallback(async () => {
    const { default: confetti } = await import('canvas-confetti')
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.82,
      decay: 0.94,
      startVelocity: 30,
      colors: CELEBRATION_COLORS,
    }

    confetti({
      disableForReducedMotion: true,
      ...defaults,
      particleCount: 48,
      scalar: 1.15,
      shapes: ['circle', 'square'],
      origin: { x: 0.5, y: 0.58 },
    })
  }, [])

  const handleCheck = useCallback(() => {
    if (!selected || validated.current) return

    validated.current = true
    setIsValidated(true)
    const acceptedAnswers = getCardTypingTranslations(card)
    const latencyMs = Date.now() - startTime
    const normalizedSelected = selected.trim().toLowerCase()
    const isCorrect = acceptedAnswers.some(
      (answer) => answer.trim().toLowerCase() === normalizedSelected,
    )

    if (isCorrect) {
      if (!isAssignment && !isBlitzVariant) triggerConfetti()
      onCorrect(latencyMs)
    } else {
      onWrong(latencyMs)
    }
  }, [
    selected,
    onCorrect,
    onWrong,
    triggerConfetti,
    isAssignment,
    isBlitzVariant,
    card,
    startTime,
  ])

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isValidated || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable=true], [role=dialog]')) return
      if (target instanceof HTMLElement && target.closest('button') && e.key === 'Enter') return
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) e.preventDefault()

      const key = e.key.toLowerCase()

      // Atalhos diretos A-D ou 1-4
      if (['a', '1'].includes(key)) handleSelect(options[0], 0)
      else if (['b', '2'].includes(key)) handleSelect(options[1], 1)
      else if (['c', '3'].includes(key)) handleSelect(options[2], 2)
      else if (['d', '4'].includes(key)) handleSelect(options[3], 3)
      // Navegação por setas
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFocusedIndex((prev) => {
          const next = prev === null ? 0 : (prev + 1) % options.length
          setSelected(options[next])
          return next
        })
        feedback.click()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFocusedIndex((prev) => {
          const next =
            prev === null
              ? options.length - 1
              : (prev - 1 + options.length) % options.length
          setSelected(options[next])
          return next
        })
        feedback.click()
      }

      // Confirmar com Enter
      else if (e.key === 'Enter') {
        if (selected) {
          handleCheck()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [options, selected, isValidated, handleSelect, handleCheck])

  useEffect(() => {
    if (isAssignment || isBlitzVariant) root.current?.querySelector('h2')?.focus()
  }, [card.id, isAssignment, isBlitzVariant])

  const translations = getCardTypingTranslations(card)
  const acceptedAnswers = translations.map(answer => answer.toLowerCase())
  const selectedIsCorrect = selected !== null && acceptedAnswers.includes(selected.trim().toLowerCase())

  if (options.length < 2) return <div ref={root} className={styles.exercise}>
    <p className={styles.instruction}>Esta frase ainda não tem alternativas suficientes para um quiz.</p>
    <h2 className={styles.question} lang="en">{card.english_phrase || card.en}</h2>
    <p>{card.portuguese_translation || card.pt}</p>
    <p>Leitura de apoio, sem nota. Continue pela revisão.</p>
    <a className="product-text-link" href="/review">Abrir revisão</a>
  </div>

  return (
    <div ref={root} className={`${styles.exercise} ${isBlitzVariant ? styles.compact : ''}`}>
      <div data-choice-enter>
        <p className={styles.instruction}>Escolha a tradução correta.</p>
        <div className={styles.prompt}>
          <h2 data-testid="multiple-choice-question" tabIndex={isAssignment || isBlitzVariant ? -1 : undefined} className={styles.question} lang="en">
            {card.english_phrase || card.en}
          </h2>
          <AudioButton url={card.audio_url} fallbackText={card.english_phrase || card.en} autoPlay={true} variant="game" />
        </div>
      </div>
      <div className={styles.options} aria-label="Alternativas">
        {options.map((option, index) => {
          const correct = acceptedAnswers.includes(option.trim().toLowerCase())
          const result = isValidated ? correct ? 'correct' : option === selected ? 'wrong' : 'muted' : undefined
          return <button
            key={`${option}-${index}`}
            type="button"
            className={styles.option}
            data-choice-enter
            data-result={result}
            data-testid="multiple-choice-option"
            data-focused={focusedIndex === index || undefined}
            aria-pressed={selected === option}
            aria-label={`Opção: ${option}`}
            onClick={() => handleSelect(option, index)}
            disabled={isValidated}
          >
            <span>{option}</span>
            {(selected === option || isValidated && correct) && <span className={styles.selection}>{result === 'wrong' ? <X size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}</span>}
          </button>
        })}
      </div>
      {!isBlitzVariant && <PracticeBooks className={styles.art} />}
      <button type="button" onClick={handleCheck} disabled={!selected || isValidated} className={styles.confirm}>
        {isValidated ? 'Resposta confirmada' : 'Confirmar'} <ArrowRight size={20} aria-hidden="true" />
      </button>
      {isAssignment && (
        <div role="status" className={isValidated ? styles.feedback : 'sr-only'} data-correct={selectedIsCorrect}>
          {isValidated && (selectedIsCorrect
            ? 'Resposta correta.'
            : `Resposta incorreta. Resposta esperada: ${translations[0]}`)}
        </div>
      )}
    </div>
  )
}
