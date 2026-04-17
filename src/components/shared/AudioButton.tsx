'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface AudioButtonProps {
  url?: string | null
  autoPlay?: boolean
  className?: string
}

export default function AudioButton({ url, autoPlay, className = '' }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!url) return
    
    const audio = new Audio(url)
    audio.onended = () => setPlaying(false)
    audio.onerror = () => {
      setError(true)
      setPlaying(false)
    }
    audioRef.current = audio

    if (autoPlay) {
      audio.play().catch(() => {
        // Auto-play was prevented by the browser policy, requires user interaction
        console.warn('Auto-play desativado pelo navegador.')
      })
      setPlaying(true)
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [url, autoPlay])

  if (!url) return null

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setPlaying(false)
      } else {
        audioRef.current.play().catch(() => setError(true))
        setPlaying(true)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={`inline-flex items-center justify-center p-2 rounded-full transition-colors ${
        error 
          ? 'text-red-400 opacity-50 cursor-not-allowed' 
          : playing 
            ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)]' 
            : 'text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-hover)]'
      } ${className}`}
      title={error ? 'Erro ao carregar áudio' : 'Ouvir pronúncia'}
      disabled={error}
    >
      {error ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
    </button>
  )
}
