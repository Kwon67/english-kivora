'use client'

import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { chartPalette as palette } from '@/lib/chartTheme'

interface ChartDataPoint {
  date: string
  acerto: number
  pack: string
}

export default function HistoryChart({ data }: { data: ChartDataPoint[] }) {
  const gradientId = useId()
  const latest = data.at(-1)

  if (!latest) return <p className="text-sm text-brand-secondary">A evolução aparece após uma sessão com respostas registradas.</p>

  return (
    <>
      <p className="mb-2 text-sm text-brand-secondary">Última sessão: <strong className="text-brand-dark">{latest.acerto}%</strong> de acertos</p>
      <div className="workspace-chart h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.accent} stopOpacity={0.22} />
                <stop offset="75%" stopColor={palette.accent} stopOpacity={0.05} />
                <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 10" stroke={palette.grid} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={palette.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={palette.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip
              cursor={{ stroke: palette.cursor, strokeDasharray: '4 4' }}
              contentStyle={palette.tooltip}
              labelStyle={palette.tooltipLabel}
              formatter={(value, _name, item) => {
                const payload = item?.payload as ChartDataPoint | undefined
                const displayValue = typeof value === 'number' ? value : Number(value ?? 0)

                return [`${displayValue}%`, payload?.pack || 'Acerto']
              }}
            />
            <Area
              type="monotone"
              dataKey="acerto"
              stroke={palette.accent}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              dot={data.length === 1 ? { r: 5, fill: palette.accent } : false}
              activeDot={{
                r: 6,
                fill: palette.accent,
                stroke: palette.activeDotStroke,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
