'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface ChartDataPoint {
  date: string
  acerto: number
  pack: string
}

export default function HistoryChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAcerto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f6c90e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f6c90e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e2d47" />
          <XAxis
            dataKey="date"
            stroke="#72758a"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#72758a"
            fontSize={12}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e1d2f',
              border: '1px solid #2e2d47',
              borderRadius: '8px',
              color: '#fffffe',
              fontSize: '13px',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: number) => [`${value}%`, 'Acerto']) as any}
          />
          <Area
            type="monotone"
            dataKey="acerto"
            stroke="#f6c90e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAcerto)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
