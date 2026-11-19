'use client'

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import type { ChartDataPoint } from './HistoryChart'

export default function HistoryChartViewport({ data }: { data: ChartDataPoint[] }) {
  const root = useRef<HTMLDivElement>(null)
  const pending = useRef<Promise<void> | null>(null)
  const [Plot, setPlot] = useState<ComponentType<{ data: ChartDataPoint[] }> | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    if (pending.current) return
    setFailed(false)
    pending.current = import('./HistoryChartPlot').then(
      module => setPlot(() => module.default),
      () => setFailed(true),
    ).finally(() => { pending.current = null })
  }, [])

  useEffect(() => {
    const element = root.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      load()
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      load()
    }, { rootMargin: '240px 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [load])

  return (
    <div ref={root} className="workspace-chart h-44 sm:h-56">
      {Plot && <Plot data={data} />}
      {failed && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm">
          <p role="status">Não foi possível carregar o gráfico.</p>
          <button type="button" className="min-h-11 underline" onClick={load}>Tentar novamente</button>
        </div>
      )}
    </div>
  )
}
