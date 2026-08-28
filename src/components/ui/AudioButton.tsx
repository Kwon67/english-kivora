'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

/** Endpoint que sintetiza a frase na hora, quando o card não tem áudio gravado. */
export function ttsFallbackUrl(text: string | null | undefined): string | null {
  const limpo = (text || '').trim()
  if (!limpo) return null
  return `/api/tts/preview?text=${encodeURIComponent(limpo)}`
}

interface AudioButtonProps {
  url?: string | null
  /**
   * Frase em inglês, para sintetizar quando `url` está vazio.
   *
   * Sem isto o botão inteiro sumia (`if (!url) return null`) — e como só 9% dos cards do catálogo
   * têm `audio_url`, na prática a pronúncia não existia em 9 de cada 10 frases. O aluno estudava
   * inglês sem nunca ouvir a frase, que é metade do idioma.
   */
  fallbackText?: string | null
  autoPlay?: boolean
  className?: string
  stopSignal?: number
  disabled?: boolean
  variant?: 'default' | 'game' | 'tile'
  onPlaybackEnded?: () => void
}

export const AUDIO_STOP_EVENT = 'kivora:stop-audio'
export const AUDIO_SPEED_EVENT = 'kivora:speed-audio'

export default function AudioButton({ 
  url, 
  fallbackText,
  autoPlay, 
  className = '', 
  stopSignal = 0, 
  disabled = false,
  variant = 'default',
  onPlaybackEnded,
}: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const [speed, setSpeed] = useState(1)
  // Áudio gravado quando existe; senão, síntese sob demanda a partir do texto.
  const resolvedUrl = url || ttsFallbackUrl(fallbackText)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const savedSpeed = localStorage.getItem('kivora_audio_speed')
    if (savedSpeed) {
      setTimeout(() => setSpeed(Number(savedSpeed)), 0)
    }

    const handleGlobalSpeed = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setSpeed(customEvent.detail);
    };

    window.addEventListener(AUDIO_SPEED_EVENT, handleGlobalSpeed);
    return () => window.removeEventListener(AUDIO_SPEED_EVENT, handleGlobalSpeed);
  }, [])

  useEffect(() => {
    if (!resolvedUrl) return

    // Reset states whenever the URL changes (new card)
    setTimeout(() => {
      setError(false)
      setPlaying(false)
    }, 0)

    const audio = new Audio(resolvedUrl)
    audio.defaultPlaybackRate = speed
    audio.playbackRate = speed
    audio.preservesPitch = true

    // Guard: prevents the old audio's callbacks from firing after cleanup
    let isDestroyed = false

    audio.oncanplay = () => {
      if (!isDestroyed) {
        audio.playbackRate = speed
      }
    }
    
    audio.onplay = () => {
      if (!isDestroyed) {
        audio.playbackRate = speed
      }
    }
    
    audio.onended = () => {
      if (!isDestroyed) {
        setTimeout(() => setPlaying(false), 0)
        onPlaybackEnded?.()
      }
    }
    audio.onerror = () => {
      if (!isDestroyed) setTimeout(() => {
        setError(true)
        setPlaying(false)
      }, 0)
    }
    audioRef.current = audio

    if (autoPlay && !disabled) {
      audio.defaultPlaybackRate = speed
      audio.playbackRate = speed
      // `setPlaying(true)` ficava fora da promise, então um autoplay BLOQUEADO (o padrão do
      // Chrome em qualquer página sem gesto do usuário) deixava o estado dizendo "tocando" com
      // o áudio mudo. O clique seguinte caía no ramo de pausa do handlePlay e era engolido:
      // a pessoa apertava para ouvir e não saía som nenhum — só no segundo clique. Agora o
      // estado só vira "tocando" quando o play() realmente resolve.
      audio.play().then(() => {
        if (isDestroyed) return
        audio.playbackRate = speed
        setPlaying(true)
      }).catch(() => {
        if (isDestroyed) return
        setPlaying(false)
        console.warn('Auto-play desativado pelo navegador.')
      })
    }

    return () => {
      isDestroyed = true
      // Null out handlers before clearing src to avoid onerror triggering on the next card
      audio.oncanplay = null
      audio.onplay = null
      audio.onerror = null
      audio.onended = null
      audio.pause()
      audio.src = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUrl, autoPlay, onPlaybackEnded])

  // Atualiza a velocidade do áudio atual se ele estiver rodando ou mutado, pra garantir que a próxima exec pegue
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }, [speed])

  useEffect(() => {
    if (!audioRef.current || stopSignal === 0) return

    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setPlaying(false)
  }, [stopSignal])

  useEffect(() => {
    if (!audioRef.current || !disabled) return

    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setPlaying(false)
  }, [disabled])

  useEffect(() => {
    const stopAudio = () => {
      if (!audioRef.current) return

      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
    }

    window.addEventListener(AUDIO_STOP_EVENT, stopAudio)
    return () => window.removeEventListener(AUDIO_STOP_EVENT, stopAudio)
  }, [])

  if (!resolvedUrl) return null

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (disabled) return
    
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setPlaying(false)
      } else {
        // Reset error so user can always retry
        setError(false)
        audioRef.current.defaultPlaybackRate = speed
        audioRef.current.playbackRate = speed
        // Mesmo motivo do autoplay acima: se o play() falhar, o estado não pode ficar preso em
        // "tocando", senão o próximo clique vira pausa em cima de um áudio que nunca tocou.
        audioRef.current.play().then(() => {
          if (audioRef.current) audioRef.current.playbackRate = speed
          setPlaying(true)
        }).catch(() => {
          setError(true)
          setPlaying(false)
        })
      }
    }
  }

  const handleSpeedChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    if (disabled) return

    let newSpeed = 1
    if (speed === 1) newSpeed = 0.75
    else if (speed === 0.75) newSpeed = 0.5
    else newSpeed = 1

    setSpeed(newSpeed)
    localStorage.setItem('kivora_audio_speed', String(newSpeed))
    window.dispatchEvent(new CustomEvent(AUDIO_SPEED_EVENT, { detail: newSpeed }))
  }

  const isGame = variant === 'game'
  const isTile = variant === 'tile'

  return (
    <div 
      className={`relative z-50 pointer-events-auto inline-flex items-center gap-1.5 ${
        isGame 
          ? 'bg-[var(--color-surface-container-high)] p-1.5 rounded-full border border-border shadow-sm' 
          : isTile
            ? 'rounded-full border border-border-muted/20 bg-surface-container-low p-0.5 shadow-sm'
            : ''
      } ${className}`} 
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handlePlay}
        className={`inline-flex items-center justify-center rounded-full transition-all ${
          isGame ? 'p-2.5' : isTile ? 'p-1.5' : 'p-2'
        } ${
          disabled
            ? 'text-text-subtle opacity-40 cursor-not-allowed'
            : error
            ? 'text-red-400 opacity-50 cursor-not-allowed'
            : playing
              ? 'text-primary bg-primary-light scale-110'
              : 'text-text-subtle hover:text-primary hover:bg-[var(--color-surface-hover)] active:scale-90'
        }`}
        title={disabled ? 'Áudio bloqueado durante a gravação' : error ? 'Erro ao carregar áudio' : 'Ouvir pronúncia'}
        disabled={disabled || error}
      >
        {error ? (
          <VolumeX className={isGame ? 'h-6 w-6' : isTile ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
        ) : (
          <Volume2 className={isGame ? 'h-6 w-6' : isTile ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
        )}
      </button>

      {!error && !isTile && (
        <button
          type="button"
          onClick={handleSpeedChange}
          title="Velocidade de reprodução (clique para alterar)"
          disabled={disabled}
          className={`bg-transparent font-bold text-text-subtle rounded-lg border-none focus:ring-0 transition-all ${
            isGame 
              ? 'text-[13px] px-3 py-1.5 hover:bg-[var(--color-surface-hover)]' 
              : 'text-xs px-2 py-1 hover:bg-[var(--color-surface-hover)]'
          } ${
            disabled
              ? 'cursor-not-allowed opacity-40'
              : 'hover:text-primary cursor-pointer active:scale-95'
          }`}
        >
          {speed === 1 ? '1.0' : speed}x
        </button>
      )}
    </div>
  )
}

