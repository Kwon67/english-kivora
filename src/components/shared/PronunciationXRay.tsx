'use client'

import { useMemo } from 'react'
import { m } from 'framer-motion'

interface WordAlignment {
  word: string
  isCorrect: boolean
}

interface PronunciationXRayProps {
  expected: WordAlignment[]
  spoken: WordAlignment[]
}

// Generate a realistic-looking waveform chunk for a single word based on its length
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
    
    return bars
  }, [expected, spoken])

  return (
    <div className="w-full max-w-xl mx-auto mt-4 p-4 rounded-[1.2rem] bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] dark:bg-[var(--color-surface-container-low)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">Raio-X de Pronúncia</p>
        <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--color-primary)] opacity-30"></div> Nativo</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></div> Você (Acerto)</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--color-error)]"></div> Você (Erro)</span>
        </div>
      </div>
      
      <div className="relative h-28 flex items-center gap-[2px] justify-center w-full">
        {/* Center baseline */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-border)] -translate-y-1/2 z-0" />
        
        {waveformBars.map((bar, i) => {
          const expectedPx = Math.max(4, bar.expectedHeight * 50)
          const spokenPx = Math.max(4, bar.spokenHeight * 50)
          
          let spokenColor = 'var(--color-primary)'
          if (bar.status === 'extra') spokenColor = 'var(--color-error)'
          if (bar.status === 'missed') spokenColor = 'var(--color-surface-variant)'
          if (bar.status === 'wrong') spokenColor = 'var(--color-error)'
            
          return (
            <div key={i} className="relative w-1.5 h-full flex flex-col justify-center items-center z-10 group">
              {/* Expected Wave (Top) */}
              <m.div 
                initial={{ height: 0 }}
                animate={{ height: expectedPx }}
                transition={{ duration: 0.4, delay: i * 0.01 }}
                className="w-1.5 rounded-t-full bg-[var(--color-primary)] opacity-25 absolute bottom-1/2 origin-bottom"
              />
              
              {/* Spoken Wave (Bottom) */}
              <m.div 
                initial={{ height: 0 }}
                animate={{ height: spokenPx }}
                transition={{ duration: 0.4, delay: i * 0.01 + 0.2 }}
                style={{ backgroundColor: spokenColor }}
                className="w-1.5 rounded-b-full absolute top-1/2 origin-top"
              />
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-[var(--color-text-subtle)]">
        Onda superior: Ritmo do professor. Onda inferior: O seu ritmo.
      </p>
    </div>
  )
}
