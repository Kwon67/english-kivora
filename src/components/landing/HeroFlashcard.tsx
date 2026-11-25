'use client'

import { useRef, useState } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import styles from './MindmarketLanding.module.css'

export default function HeroFlashcard() {
  const card = useRef<HTMLButtonElement>(null)
  const interacted = useRef(false)
  const [pressed, setPressed] = useState(false)
  const [translated, setTranslated] = useState(false)

  useGSAP(() => {
    if (!interacted.current) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const face = card.current
    const flip = gsap.timeline()
    if (reduced.matches) {
      flip.to(face, { opacity: .25, duration: .1 })
        .call(() => setTranslated(pressed))
        .to(face, { opacity: 1, duration: .14, clearProps: 'opacity' })
    } else {
      flip.to(face, { rotationY: 90, duration: .19, ease: 'power2.in' })
        .call(() => setTranslated(pressed))
        .fromTo(face, { rotationY: -90 }, { rotationY: 0, duration: .24, ease: 'power2.out', immediateRender: false, clearProps: 'transform' })
    }
    const finish = () => flip.progress(1)
    reduced.addEventListener('change', finish)
    return () => reduced.removeEventListener('change', finish)
  }, { dependencies: [pressed], scope: card, revertOnUpdate: true })

  return <button type="button" ref={card} className={styles.phraseCard}
    aria-label="Revelar tradução" aria-pressed={pressed}
    aria-describedby="hero-phrase" onClick={() => { interacted.current = true; setPressed(previous => !previous) }}>
    <span className={styles.cardLabel}>Flashcard · Viagem</span>
    <strong id="hero-phrase" lang={translated ? 'pt-BR' : 'en'} aria-live="polite">
      {translated ? 'Este lugar está ocupado?' : 'Is this seat taken?'}
    </strong>
    <span className={styles.cardHint}>{translated ? 'Voltar ao inglês' : 'Revelar tradução'} <span aria-hidden="true">↻</span></span>
  </button>
}
