'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartPalette } from '@/lib/chartTheme'

interface ChartDataPoint {
  date: string
  acerto: number
  pack: string
}

export default function HistoryChart({ data }: { data: ChartDataPoint[] }) {
  const palette = useChartPalette()

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
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
            fill="url(#historyFill)"
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
  )
}