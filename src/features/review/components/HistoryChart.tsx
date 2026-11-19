import HistoryChartViewport from './HistoryChartViewport'

export interface ChartDataPoint {
  date: string
  acerto: number
  pack: string
}

export default function HistoryChart({ data }: { data: ChartDataPoint[] }) {
  const latest = data.at(-1)

  if (!latest) return <p className="text-sm text-brand-secondary">A evolução aparece após uma sessão com respostas registradas.</p>

  return (
    <>
      <p className="mt-4 mb-2 text-sm text-brand-secondary">Última sessão: <strong className="text-brand-dark">{latest.acerto}%</strong> de acertos</p>
      <HistoryChartViewport data={data} />
      <details className="mt-2 text-sm">
        <summary className="min-h-11 cursor-pointer py-3">Ver valores por sessão</summary>
        <ul aria-label="Precisão por sessão" className="divide-y divide-brand-dark/15">
          {data.map(({ date, pack, acerto }, i) => (
            <li key={i} className="flex justify-between gap-3 py-2">
              <span>{date}{pack && ` · ${pack}`}</span><strong className="tabular-nums">{acerto}%</strong>
            </li>
          ))}
        </ul>
      </details>
    </>
  )
}
