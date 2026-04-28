'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface AudioButtonProps {
  url?: string | null
  autoPlay?: boolean
  className?: string
  stopSignal?: number
  disabled?: boolean
  variant?: 'default' | 'game'
}

export const AUDIO_STOP_EVENT = 'kivora:stop-audio'

export default function AudioButton({ 
  url, 
  autoPlay, 
  className = '', 
  stopSignal = 0, 
  disabled = false,
  variant = 'default'
}: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const [speed, setSpeed] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const savedSpeed = localStorage.getItem('kivora_audio_speed')
    if (savedSpeed) {
      setTimeout(() => setSpeed(Number(savedSpeed)), 0)
    }
  }, [])

  useEffect(() => {
    if (!url) return

    // Reset states whenever the URL changes (new card)
    setError(false)
    setPlaying(false)

    const audio = new Audio(url)
    audio.playbackRate = speed

    // Guard: prevents the old audio's callbacks from firing after cleanup
    let isDestroyed = false

    audio.onended = () => {
      if (!isDestroyed) setTimeout(() => setPlaying(false), 0)
    }
    audio.onerror = () => {
      if (!isDestroyed) setTimeout(() => {
        setError(true)
        setPlaying(false)
      }, 0)
    }
    audioRef.current = audio

    if (autoPlay && !disabled) {
      audio.play().catch(() => {
        console.warn('Auto-play desativado pelo navegador.')
      })
      setTimeout(() => setPlaying(true), 0)
    }

    return () => {
      isDestroyed = true
      // Null out handlers before clearing src to avoid onerror triggering on the next card
      audio.onerror = null
      audio.onended = null
      audio.pause()
      audio.src = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, autoPlay])

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

  if (!url) return null

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
        audioRef.current.playbackRate = speed
        audioRef.current.play().catch(() => setError(true))
        setPlaying(true)
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
  }

  const isGame = variant === 'game'

  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${
        isGame 
          ? 'bg-[var(--color-surface-container-high)] p-1.5 rounded-full border border-[var(--color-border)] shadow-sm' 
          : ''
      } ${className}`} 
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handlePlay}
        className={`inline-flex items-center justify-center rounded-full transition-all ${
          isGame ? 'p-2.5' : 'p-2'
        } ${
          disabled
            ? 'text-[var(--color-text-subtle)] opacity-40 cursor-not-allowed'
            : error
            ? 'text-red-400 opacity-50 cursor-not-allowed'
            : playing
              ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)] scale-110'
              : 'text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)] active:scale-90'
        }`}
        title={disabled ? 'Áudio bloqueado durante a gravação' : error ? 'Erro ao carregar áudio' : 'Ouvir pronúncia'}
        disabled={disabled || error}
      >
        {error ? <VolumeX className={isGame ? "w-6 h-6" : "w-5 h-5"} /> : <Volume2 className={isGame ? "w-6 h-6" : "w-5 h-5"} />}
      </button>

      {!error && (
        <button
          type="button"
          onClick={handleSpeedChange}
          title="Velocidade de reprodução (clique para alterar)"
          disabled={disabled}
          className={`bg-transparent font-bold text-[var(--color-text-subtle)] rounded-lg border-none focus:ring-0 transition-all ${
            isGame 
              ? 'text-[13px] px-3 py-1.5 hover:bg-[var(--color-surface-hover)]' 
              : 'text-xs px-2 py-1 hover:bg-[var(--color-surface-hover)]'
          } ${
            disabled
              ? 'cursor-not-allowed opacity-40'
              : 'hover:text-[var(--color-primary)] cursor-pointer active:scale-95'
          }`}
        >
          {speed === 1 ? '1.0' : speed}x
        </button>
      )}
    </div>
  )
}

