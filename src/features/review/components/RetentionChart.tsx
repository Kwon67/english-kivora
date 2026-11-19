interface RetentionData {
  name: string
  value: number
  color: string
}

const shareFormatter = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })

export default function RetentionChart({ data }: { data: RetentionData[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) {
    return (
      <p className="font-body text-sm text-brand-secondary">
        As primeiras revisões vão preencher este gráfico.
      </p>
    )
  }

  return (
    <>
      <div className="my-4 flex h-3 overflow-hidden rounded-full bg-brand-dark/10" aria-hidden="true">
        {data.map(({ name, value, color }) => <span key={name} style={{ width: `${100 * value / total}%`, background: color }} />)}
      </div>
      <ul className="grid gap-2 text-sm text-brand-dark" aria-label="Distribuição do vocabulário">
        {data.map(({ name, value, color }) => <li key={name} className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: color }} />{name}</span>
          <strong className="tabular-nums">{value} · {shareFormatter.format(value / total)}</strong>
        </li>)}
      </ul>
    </>
  )
}
