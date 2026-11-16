'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { chartPalette as palette } from '@/lib/chartTheme'

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
      <div className="workspace-chart h-48">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={palette.tooltip}
              itemStyle={palette.itemStyle}
              formatter={(value) => [`${value} frases`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
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
