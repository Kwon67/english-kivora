'use client'

import { useEffect, useRef } from 'react'

interface LiveAudioVisualizerProps {
  stream: MediaStream | null
  isActive: boolean
  color?: string
  barCount?: number
}

export default function LiveAudioVisualizer({
  stream,
  isActive,
  color = 'var(--color-primary)',
  barCount = 32,
}: LiveAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!isActive || !stream || !canvasRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
    audioContextRef.current = audioContext
    
    const analyzer = audioContext.createAnalyser()
    analyzer.fftSize = 256
    analyzerRef.current = analyzer

    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyzer)

    const bufferLength = analyzer.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyzer.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / barCount) - 2
      let x = 0

      for (let i = 0; i < barCount; i++) {
        // Pega uma média das frequências para suavizar
        const index = Math.floor((i / barCount) * bufferLength * 0.6)
        const barHeight = (dataArray[index] / 255) * canvas.height

        ctx.fillStyle = color
        
        // Desenha barras arredondadas simétricas (tipo waveform)
        const radius = barWidth / 2
        const y = (canvas.height - barHeight) / 2
        
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, Math.max(barHeight, 4), radius)
        } else {
          ctx.rect(x, y, barWidth, Math.max(barHeight, 4))
        }
        ctx.fill()

        x += barWidth + 2
      }
    }

    draw()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
    }
  }, [stream, isActive, color, barCount])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={80}
      className="w-full h-20 opacity-80"
    />
  )
}
