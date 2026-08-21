'use client'

import { useMemo } from 'react'
import { m } from 'motion/react'

interface WordAlignment {
  word: string
  isCorrect: boolean
}

interface PronunciationXRayProps {
  expected: WordAlignment[]
  spoken: WordAlignment[]
}

// Generate a compact comparison marker for a single recognized word.
function generateWordWaveform(word: string, isSpoken: boolean, isCorrect: boolean) {
  const barCount = Math.max(3, Math.min(10, Math.floor(word.length * 1.5)))
  const bars = []
  
  for (let i = 0; i < barCount; i++) {
    // Create a bell-like envelope for the word
    const x = i / (barCount - 1)
    const envelope = Math.sin(x * Math.PI)
    
    // Add some pseudo-randomness based on the characters
    const charCode = word.charCodeAt(Math.min(i, word.length - 1)) || 1
    const noise = 0.6 + ((charCode % 10) / 10) * 0.4
    
    const height = isSpoken 
      ? (isCorrect ? Math.max(0.1, envelope * noise) : Math.max(0.05, envelope * noise * 0.4))
      : 0.02 // Almost flat if omitted
      
    bars.push({ height, isCorrect, isSpoken })
  }
  
  // Add a small pause gap between words
  bars.push({ height: 0.02, isCorrect: true, isSpoken: true })
  return bars
}

export default function PronunciationXRay({ expected, spoken }: PronunciationXRayProps) {
  // We align them visually.
  // We'll iterate through expected words. If there's an extra spoken word, we insert it.
  
  const waveformBars = useMemo(() => {
    const bars: { expectedHeight: number, spokenHeight: number, status: 'correct' | 'wrong' | 'missed' | 'extra' }[] = []
    
    let eIdx = 0
    let sIdx = 0
    
    while (eIdx < expected.length || sIdx < spoken.length) {
      const eWord = expected[eIdx]
      const sWord = spoken[sIdx]
      
      if (eWord && sWord && eWord.isCorrect && sWord.isCorrect) {
        // Match! Both said the same word
        const wBars = generateWordWaveform(eWord.word, true, true)
        wBars.forEach(b => bars.push({ expectedHeight: b.height, spokenHeight: b.height, status: 'correct' }))
        eIdx++
        sIdx++
      } else if (eWord && !eWord.isCorrect) {
        // User missed this expected word
        const wBars = generateWordWaveform(eWord.word, false, false)
        wBars.forEach(b => bars.push({ expectedHeight: b.height / 0.02 * 0.6 /* restore expected height */, spokenHeight: 0.02, status: 'missed' }))
        eIdx++
      } else if (sWord && !sWord.isCorrect) {
        // User said an extra word
        const wBars = generateWordWaveform(sWord.word, true, false)
        wBars.forEach(b => bars.push({ expectedHeight: 0.02, spokenHeight: b.height, status: 'extra' }))
        sIdx++
      } else {
        // Fallback progress
        if (eIdx < expected.length) eIdx++
        if (sIdx < spoken.length) sIdx++
      }
    }
    
    return bars.slice(0, 72)
  }, [expected, spoken])

  return (
    <div className="w-full max-w-xl mx-auto mt-4 overflow-hidden rounded-[1.2rem] bg-surface-container-lowest border border-border p-3 shadow-[var(--shadow-sm)] sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-2xs font-black uppercase tracking-widest text-text-subtle">Mapa de Pronúncia</p>
        <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-text-muted sm:gap-3 sm:text-2xs">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary opacity-30" /> Esperado</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Certo</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" /> Revisar</span>
        </div>
      </div>
      
      <div className="relative h-20 flex w-full items-center justify-center gap-px overflow-hidden sm:h-28 sm:gap-[2px]">
        {/* Center baseline */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-border)] -translate-y-1/2 z-0" />
        
        {waveformBars.map((bar, i) => {
          const expectedPx = Math.max(3, bar.expectedHeight * 38)
          const spokenPx = Math.max(3, bar.spokenHeight * 38)
          
          let spokenColor = 'var(--color-primary)'
          if (bar.status === 'extra') spokenColor = 'var(--color-accent)'
          if (bar.status === 'missed') spokenColor = 'var(--color-surface-variant)'
          if (bar.status === 'wrong') spokenColor = 'var(--color-accent)'
            
          return (
            <div key={i} className="relative h-full w-1 flex shrink-0 flex-col items-center justify-center sm:w-1.5">
              {/* Expected Wave (Top) */}
              <m.div 
                initial={{ height: 0 }}
                animate={{ height: expectedPx }}
                transition={{ duration: 0.4, delay: i * 0.01 }}
                className="absolute bottom-1/2 w-1 origin-bottom rounded-t-full bg-primary opacity-25 sm:w-1.5"
              />
              
              {/* Spoken Wave (Bottom) */}
              <m.div 
                initial={{ height: 0 }}
                animate={{ height: spokenPx }}
                transition={{ duration: 0.4, delay: i * 0.01 + 0.2 }}
                style={{ backgroundColor: spokenColor }}
                className="absolute top-1/2 w-1 origin-top rounded-b-full sm:w-1.5"
              />
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center text-[11px] leading-snug text-text-subtle sm:text-xs">
        Comparação baseada nas palavras reconhecidas pelo navegador.
      </p>
    </div>
  )
}
