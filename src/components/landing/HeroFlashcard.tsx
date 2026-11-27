'use client'

import { useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import styles from './Editorial.module.css'

export default function HeroFlashcard() {
  const audio = useRef<HTMLAudioElement>(null)
  const [sound, setSound] = useState<'ready' | 'playing' | 'error'>('ready')
  const [translated, setTranslated] = useState<boolean | null>(null)

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

  return <div className={styles.phraseCard}>
    <button type="button" className={styles.flipPhrase}
      aria-labelledby="hero-flip-action" aria-describedby="hero-phrase"
      onClick={() => { setTranslated(previous => !previous) }}>
      <span className={styles.cardLabel}>Inglês no café</span>
      <strong key={String(translated)} className={translated !== null ? styles.flipped : undefined} id="hero-phrase" lang={translated ? 'pt-BR' : 'en'} aria-live="polite">
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
