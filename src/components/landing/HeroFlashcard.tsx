'use client'

import { useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import styles from './MindmarketLanding.module.css'

export default function HeroFlashcard() {
  const card = useRef<HTMLDivElement>(null)
  const audio = useRef<HTMLAudioElement>(null)
  const [sound, setSound] = useState<'ready' | 'playing' | 'error'>('ready')
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

  async function playPhrase() {
    const player = audio.current
    if (!player) return
    try {
      if (player.error) player.load()
      player.currentTime = 0
      await player.play()
    } catch {
      setSound('error')
    }
  }

  return <div className={styles.phraseCard} ref={card}>
    <button type="button" className={styles.flipPhrase}
      aria-labelledby="hero-flip-action" aria-describedby="hero-phrase"
      onClick={() => { interacted.current = true; setPressed(previous => !previous) }}>
      <span className={styles.cardLabel}>Flashcard · Viagem</span>
      <strong id="hero-phrase" lang={translated ? 'pt-BR' : 'en'} aria-live="polite">
        {translated ? 'Este lugar está ocupado?' : 'Is this seat taken?'}
      </strong>
      <span id="hero-flip-action" className={styles.cardHint}>{translated ? 'Voltar ao inglês' : 'Revelar tradução'} <span aria-hidden="true">↻</span></span>
    </button>
    <button type="button" className={styles.listenPhrase} onClick={playPhrase}>
      <Volume2 size={15} aria-hidden="true" />
      <span aria-live="polite">{sound === 'playing' ? 'Reproduzindo…' : sound === 'error' ? 'Tentar ouvir de novo' : 'Ouvir frase'}</span>
    </button>
    <audio ref={audio} src="/brand/is-this-seat-taken-siren.mp3" preload="none"
      onPlaying={() => setSound('playing')} onEnded={() => setSound('ready')} onError={() => setSound('error')} />
  </div>
}
