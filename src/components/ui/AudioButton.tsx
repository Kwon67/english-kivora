'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useState, useRef, useEffect, useEffectEvent } from 'react'

import type { AudioVoice } from '@/lib/audioRoles'
import { usePublishedAudio } from '@/lib/usePublishedAudio'

/** Endpoint que sintetiza a frase na hora, quando o card não tem áudio gravado. */
export function ttsFallbackUrl(text: string | null | undefined,voice:AudioVoice='lauren'): string | null {
  const limpo = (text || '').trim()
  if (!limpo) return null
  return `${limpo.length > 320 ? '/api/tts' : '/api/tts/preview'}?text=${encodeURIComponent(limpo)}&voice=${voice}`
}

interface AudioButtonProps {
  voice?: AudioVoice
  label?: string
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
  onPlaybackError?: () => void
  onPlaybackStarted?: () => void
}

export const AUDIO_STOP_EVENT = 'kivora:stop-audio'
export const AUDIO_SPEED_EVENT = 'kivora:speed-audio'

export default function AudioButton({
  url, voice, label,
  fallbackText,
  autoPlay,
  className = '',
  stopSignal = 0,
  disabled = false,
  variant = 'default',
  onPlaybackEnded,
  onPlaybackError,
  onPlaybackStarted,
}: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loading, setLoading] = useState(false)
  const {url:premiumUrl,loading:lookingUp} = usePublishedAudio(fallbackText, voice)
  const restricted = url?.startsWith('/api/card-audio/')
  const preview = restricted ? null : ttsFallbackUrl(fallbackText,voice)
  const savedPremium = url?.startsWith('/audio/kivora/') ? url : null
  const freePreview = process.env.NEXT_PUBLIC_KIVORA_F0_CONFIGURED === 'true' ? preview : null
  const resolvedUrl = (restricted && url) || premiumUrl || savedPremium || freePreview || url || preview
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playback = useRef<{start: () => void; pause: (rewind?: boolean) => void} | null>(null)
  const canAutoplay = useEffectEvent(() => !disabled)
  const started = useEffectEvent(() => onPlaybackStarted?.())
  const ended = useEffectEvent(() => onPlaybackEnded?.())
  const failed = useEffectEvent(() => onPlaybackError?.())
  const initialSpeed = useEffectEvent(() => speed)

  useEffect(() => {
    let savedSpeed: string | null = null
    try { savedSpeed = localStorage.getItem('kivora_audio_speed') } catch { /* Optional preference. */ }
    if (savedSpeed && [0.5, 0.75, 1].includes(Number(savedSpeed))) {
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
    if (!resolvedUrl || lookingUp) return
    const sources = [...new Set([resolvedUrl, freePreview, url, preview].filter((v): v is string => Boolean(v)))]
    const audio = new Audio()
    audio.preload = 'none'
    audio.src = resolvedUrl
    audio.playbackRate = initialSpeed()
    audio.preservesPitch = true
    audioRef.current = audio
    let active = true
    let source = 0
    let requested = false
    setError(false)
    setPlaying(false)
    setLoading(false)
    const unavailable = () => {
      if (!active) return
      requested = false
      setLoading(false)
      setPlaying(false)
      setError(true)
      failed()
    }
    const attempt = () => {
      requested = true
      const index = source
      setLoading(true)
      void audio.play().catch((reason: unknown) => {
        if (!active || !requested || index !== source) return
        if (reason instanceof DOMException && ['NotAllowedError','AbortError'].includes(reason.name)) {
          setLoading(false)
        } else if (!audio.error) unavailable()
        // A failed media source emits 'error', which advances the fallback chain.
      })
    }
    audio.onerror = () => {
      if (!active || !requested) return
      if (++source >= sources.length) { unavailable(); return }
      audio.src = sources[source]
      attempt()
    }
    audio.onplay = () => {
      window.dispatchEvent(new CustomEvent(AUDIO_STOP_EVENT, { detail: audio }))
    }
    audio.onplaying = () => { setError(false); setLoading(false); setPlaying(true); started() }
    audio.onwaiting = () => setLoading(true)
    audio.onpause = () => { setPlaying(false); setLoading(false) }
    audio.onended = () => { requested = false; setLoading(false); setPlaying(false); ended() }
    const pause = (rewind = false) => {
      requested = false
      audio.pause()
      if (rewind) audio.currentTime = 0
      setPlaying(false)
      setLoading(false)
    }
    playback.current = { pause, start() {
      if (audio.error) { source = 0; audio.src = sources[0] }
      setError(false)
      attempt()
    } }
    const stop = (event: Event) => {
      if ((event as CustomEvent).detail !== audio) pause(true)
    }
    window.addEventListener(AUDIO_STOP_EVENT,stop)
    if (autoPlay && canAutoplay()) attempt()
    return () => {
      playback.current = null
      active = false
      window.removeEventListener(AUDIO_STOP_EVENT,stop)
      audio.onplay = audio.onplaying = audio.onpause = audio.onwaiting = audio.onerror = audio.onended = null
      audioRef.current = null
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  }, [resolvedUrl, freePreview, url, preview, autoPlay, lookingUp])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed
  }, [speed])

  useEffect(() => {
    if (stopSignal || disabled) playback.current?.pause(true)
  }, [stopSignal, disabled])

  if (!resolvedUrl) return null

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (disabled) return
    if (playing || loading) playback.current?.pause()
    else playback.current?.start()
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
    try { localStorage.setItem('kivora_audio_speed', String(newSpeed)) } catch { /* Optional preference. */ }
    window.dispatchEvent(new CustomEvent(AUDIO_SPEED_EVENT, { detail: newSpeed }))
  }

  const isGame = variant === 'game'
  const isTile = variant === 'tile'

  return (
    <div
      className={`relative z-50 pointer-events-auto inline-flex items-center gap-1.5 ${
        isGame
          ? 'bg-[var(--listening-soft)] p-1.5 rounded-full border border-transparent'
          : isTile
            ? 'rounded-full border border-border-muted/20 bg-surface-container-low p-0.5 shadow-sm'
            : ''
      } ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {(loading || lookingUp) && <span role="status" className="sr-only">Carregando áudio…</span>}
      {error && <span className="sr-only" role="status">Áudio indisponível. Tente novamente.</span>}
      <button
        type="button"
        data-audio-play
        onClick={handlePlay}
        className={`inline-flex items-center justify-center rounded-full transition-all ${
          isGame ? 'p-2.5' : isTile ? 'p-1.5' : 'p-2'
        } ${
          disabled
            ? 'text-text-subtle opacity-40 cursor-not-allowed'
            : error
            ? 'text-error'
            : playing
              ? 'text-primary bg-primary-light scale-110'
              : 'text-text-subtle hover:text-primary hover:bg-[var(--color-surface-hover)] active:scale-90'
        }`}
        title={disabled ? 'Áudio bloqueado durante a gravação' : error ? 'Áudio indisponível. Tentar novamente' : playing || loading ? 'Pausar áudio' : label || 'Ouvir pronúncia'}
        disabled={disabled || lookingUp}
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
          data-audio-speed
          onClick={handleSpeedChange}
          title="Velocidade de reprodução (clique para alterar)"
          disabled={disabled || lookingUp}
          className={`bg-transparent font-bold rounded-lg border-none focus:ring-0 transition-all ${
            isGame
              ? 'text-[var(--kivora-ink)] inline-flex min-h-11 w-16 shrink-0 items-center justify-center whitespace-nowrap px-2 text-[13px] tabular-nums hover:bg-[var(--color-surface-hover)]'
              : 'text-text-subtle text-xs px-2 py-1 hover:bg-[var(--color-surface-hover)]'
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

