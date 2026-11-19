import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { chartPalette as palette } from '@/lib/chartTheme'

import type { ChartDataPoint } from './HistoryChart'

export default function HistoryChartPlot({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={palette.grid} vertical={false} />
        <XAxis
          dataKey="date"
          stroke={palette.axis}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={palette.axis}
          fontSize={11}
          width={38}
          ticks={[0, 25, 50, 75, 100]}
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
        <Line
          type="monotone"
          dataKey="acerto"
          stroke={palette.accent}
          strokeWidth={3}
          isAnimationActive={false}
          dot={data.length === 1 ? { r: 5, fill: palette.accent } : false}
          activeDot={{
            r: 6,
            fill: palette.accent,
            stroke: palette.activeDotStroke,
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
