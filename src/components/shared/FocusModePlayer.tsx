'use client'

import { useState, useEffect, useRef } from 'react'
import { Headphones, Play, Pause, Volume2, Music, Zap, RefreshCcw } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'

const FOCUS_TRACKS = [
  { 
    id: 'jazz', 
    name: 'Midnight Jazz Sax', 
    icon: Music, 
    url: 'https://cdn.pixabay.com/audio/2022/03/09/audio_c8c8a73a5b.mp3' // Real Sax/Jazz recording
  },
  { 
    id: 'piano', 
    name: 'Elegant Piano', 
    icon: Zap, 
    url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884ce92305.mp3' // High-quality Solo Piano
  },
  { 
    id: 'sinatra', 
    name: "Frank's Classy Vibe", 
    icon: Headphones, 
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_14f369d71c.mp3' // Professional Swing/Big Band
  }
]

const REAL_TRACKS: Record<string, string> = {
  jazz: 'https://cdn.pixabay.com/audio/2022/03/09/audio_c8c8a73a5b.mp3',
  piano: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884ce92305.mp3',
  sinatra: 'https://cdn.pixabay.com/audio/2022/10/25/audio_14f369d71c.mp3'
}

export default function FocusModePlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(FOCUS_TRACKS[0])
  const [volume, setVolume] = useState(0.3)
  const [isOpen, setIsOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('kivora_focus_mode')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        const track = FOCUS_TRACKS.find(t => t.id === config.trackId)
        if (track) {
          requestAnimationFrame(() => {
            setCurrentTrack(track)
            if (audioRef.current) audioRef.current.src = REAL_TRACKS[track.id] || track.url
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

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      setIsBuffering(true)
      audioRef.current.play().catch(err => {
        console.error('Playback error:', err)
        setIsPlaying(false)
        setIsBuffering(false)
      })
    }
    setIsPlaying(!isPlaying)
  }

  const changeTrack = (track: typeof FOCUS_TRACKS[0]) => {
    setCurrentTrack(track)
    if (audioRef.current) {
      setIsBuffering(true)
      audioRef.current.src = REAL_TRACKS[track.id] || track.url
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false))
      }
    }
  }

  return (
    <div className="relative">
      <audio
        ref={audioRef}
        src={REAL_TRACKS[currentTrack.id] || currentTrack.url}
        loop
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlay={() => {
          setIsPlaying(true)
          setIsBuffering(false)
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          console.error('Audio error, attempting fallback...')
          if (audioRef.current) audioRef.current.src = currentTrack.url // try placeholder
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
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
            isPlaying 
              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' 
              : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-container-low)]'
          }`}
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
            className="absolute right-0 top-full mt-2 z-[100] w-64 rounded-2xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]">Modo Focus</p>
              <button 
                onClick={togglePlay}
                disabled={isBuffering}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-transform active:scale-90 disabled:opacity-50"
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
                    className={`flex items-center gap-3 w-full p-2 rounded-xl text-left transition-all ${
                      isActive 
                        ? 'bg-amber-500/10 text-amber-700' 
                        : 'hover:bg-[var(--color-surface-container-low)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    <div className={`h-8 w-8 flex items-center justify-center rounded-lg ${isActive ? 'bg-amber-500 text-white' : 'bg-[var(--color-surface-container-lowest)]'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold">{track.name}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 px-1">
              <Volume2 className="h-3.5 w-3.5 text-[var(--color-text-subtle)]" />
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
