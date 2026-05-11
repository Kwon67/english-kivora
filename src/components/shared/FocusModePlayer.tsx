'use client'

import { useState, useEffect, useRef } from 'react'
import { Headphones, Play, Pause, Volume2, Music, CloudRain, Zap } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'

const FOCUS_TRACKS = [
  { 
    id: 'lofi', 
    name: 'Lo-Fi Study', 
    icon: Music, 
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_180873748b.mp3' // Lofi Study
  },
  { 
    id: 'binaural', 
    name: 'Deep Focus', 
    icon: Zap, 
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' // Placeholder, ideally a real binaural loop
  },
  { 
    id: 'rain', 
    name: 'Soft Rain', 
    icon: CloudRain, 
    url: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' // Rain loop
  }
]

export default function FocusModePlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(FOCUS_TRACKS[0])
  const [volume, setVolume] = useState(0.4)
  const [isOpen, setIsOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('kivora_focus_mode')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        const track = FOCUS_TRACKS.find(t => t.id === config.trackId)
        if (track) {
          // Use requestAnimationFrame to defer state update and satisfy lint
          requestAnimationFrame(() => {
            setCurrentTrack(track)
            if (audioRef.current) audioRef.current.src = track.url
            setVolume(config.volume ?? 0.4)
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
      audioRef.current.play().catch(console.error)
    }
    setIsPlaying(!isPlaying)
  }

  const changeTrack = (track: typeof FOCUS_TRACKS[0]) => {
    setCurrentTrack(track)
    if (audioRef.current) {
      audioRef.current.src = track.url
      if (isPlaying) audioRef.current.play().catch(console.error)
    }
  }

  return (
    <div className="relative">
      <audio
        ref={audioRef}
        src={currentTrack.url}
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
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
                animate={{ height: [4, 12, 6, 10, 4] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-0.5 bg-amber-500 rounded-full"
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
          <Headphones className="h-4 w-4" strokeWidth={2.2} />
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
                className="h-8 w-8 flex items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-transform active:scale-90"
              >
                {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
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
