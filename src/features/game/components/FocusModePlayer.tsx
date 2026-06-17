'use client'

import { useState, useEffect, useRef } from 'react'
import { Headphones, Play, Pause, Volume2, Music, Zap, RefreshCcw } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'

const FOCUS_TRACKS = [
  { 
    id: 'jazz', 
    name: 'Midnight Jazz Sax', 
    icon: Music, 
    url: 'https://assets.mixkit.co/music/preview/mixkit-jazz-clover-113.mp3' 
  },
  { 
    id: 'piano', 
    name: 'Elegant Piano', 
    icon: Zap, 
    url: 'https://assets.mixkit.co/music/preview/mixkit-piano-reflections-22.mp3' 
  },
  { 
    id: 'sinatra', 
    name: "Frank's Classy Vibe", 
    icon: Headphones, 
    url: 'https://assets.mixkit.co/music/preview/mixkit-swing-is-the-thing-106.mp3'
  }
]

export default function FocusModePlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState(FOCUS_TRACKS[0])
  const [volume, setVolume] = useState(0.3)
  const [isOpen, setIsOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const bufferingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('kivora_focus_mode')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        const track = FOCUS_TRACKS.find(t => t.id === config.trackId)
        if (track) {
          requestAnimationFrame(() => {
            setCurrentTrack(track)
            setVolume(config.volume ?? 0.3)
          })
        }
      } catch (e) {
        console.error('Error loading focus mode config:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      localStorage.setItem('kivora_focus_mode', JSON.stringify({
        trackId: currentTrack.id,
        volume
      }))
    }
  }, [volume, currentTrack])

  // Manage buffering timeout
  useEffect(() => {
    if (isBuffering) {
      bufferingTimeoutRef.current = setTimeout(() => {
        console.warn('Audio buffering timeout, resetting state')
        setIsBuffering(false)
      }, 8000)
    } else {
      if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current)
    }
    return () => {
      if (bufferingTimeoutRef.current) clearTimeout(bufferingTimeoutRef.current)
    }
  }, [isBuffering])

  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      setIsBuffering(false)
    } else {
      setAudioError(null)
      setIsBuffering(true)
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            setIsBuffering(false)
          })
          .catch(err => {
            const message = err instanceof Error ? err.message : 'Não foi possível iniciar o áudio.'
            setAudioError(message)
            setIsPlaying(false)
            setIsBuffering(false)
          })
      }
    }
  }

  const changeTrack = (track: typeof FOCUS_TRACKS[0]) => {
    const wasPlaying = isPlaying
    setAudioError(null)
    setCurrentTrack(track)
    
    if (audioRef.current) {
      audioRef.current.src = track.url
      audioRef.current.load()
      
      if (wasPlaying) {
        setIsBuffering(true)
        audioRef.current.play()
          .then(() => setIsBuffering(false))
          .catch((err) => {
            const message = err instanceof Error ? err.message : 'Não foi possível carregar essa faixa.'
            setAudioError(message)
            setIsPlaying(false)
            setIsBuffering(false)
          })
      }
    }
  }

  return (
    <div className="relative">
      <audio
        ref={audioRef}
        src={currentTrack.url}
        loop
        preload="auto"
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => setIsBuffering(false)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          const mediaError = e.currentTarget.error
          const fallbackMessage =
            mediaError?.code === MediaError.MEDIA_ERR_NETWORK
              ? 'Falha de rede ao carregar a faixa.'
              : mediaError?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
                ? 'Formato ou origem de áudio não suportado.'
                : 'Não foi possível carregar essa faixa.'
          setAudioError(fallbackMessage)
          setIsBuffering(false)
          setIsPlaying(false)
        }}
      />

      <div className="flex items-center gap-1">
        {isPlaying && (
          <m.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-end gap-0.5 h-3 px-1"
          >
            {[1, 2, 3].map(i => (
              <m.div
                key={i}
                animate={{ height: isBuffering ? [4, 4] : [4, 12, 6, 10, 4] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className={`w-0.5 rounded-full ${isBuffering ? 'bg-amber-500/30' : 'bg-amber-500'}`}
              />
            ))}
          </m.div>
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-10 w-10 items-center justify-center rounded-[0.8rem] transition-all ${ isPlaying ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'text-text-subtle hover:bg-surface-container-low' }`}
          title="Modo Focus"
        >
          {isBuffering ? (
            <RefreshCcw className="h-4 w-4 animate-spin text-amber-500" />
          ) : (
            <Headphones className="h-4 w-4" strokeWidth={2.2} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 z-[100] w-72 overflow-hidden rounded-[1rem] border border-border bg-card p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-text">Modo Focus</p>
                {audioError && (
                  <p className="mt-1 text-[11px] font-semibold leading-snug text-[var(--color-error)]">
                    Áudio indisponível agora
                  </p>
                )}
              </div>
              <button 
                onClick={togglePlay}
                disabled={isBuffering}
                className="h-9 w-9 flex items-center justify-center rounded-[0.75rem] bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isBuffering ? <RefreshCcw className="h-4 w-4 animate-spin" /> : (isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />)}
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {FOCUS_TRACKS.map(track => {
                const Icon = track.icon
                const isActive = currentTrack.id === track.id
                return (
                  <button
                    key={track.id}
                    onClick={() => changeTrack(track)}
                    className={`flex items-center gap-3 w-full p-2 rounded-[0.85rem] text-left transition-all ${ isActive ? 'bg-amber-500/10 text-amber-700' : 'hover:bg-surface-container-low text-text-muted' }`}
                  >
                    <div className={`h-8 w-8 flex items-center justify-center rounded-[0.65rem] ${isActive ? 'bg-amber-500 text-white' : 'bg-surface-container-lowest'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold">{track.name}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 px-1">
              <Volume2 className="h-3.5 w-3.5 text-text-subtle" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-amber-500 h-1 rounded-full appearance-none bg-[var(--color-surface-container-low)] cursor-pointer"
              />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
