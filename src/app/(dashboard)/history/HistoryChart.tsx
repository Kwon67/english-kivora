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

interface ChartDataPoint {
  date: string
  acerto: number
  pack: string
}

export default function HistoryChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2B7A0B" stopOpacity={0.28} />
              <stop offset="75%" stopColor="#1f5f08" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#1f5f08" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 10" stroke="rgba(91,107,128,0.22)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#8794A8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#8794A8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value: number) => `${value}%`}
          />
          <Tooltip
            cursor={{ stroke: 'rgba(17,32,51,0.12)', strokeDasharray: '4 4' }}
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(17,32,51,0.08)',
              borderRadius: '18px',
              boxShadow: '0 28px 60px -40px rgba(17,32,51,0.42)',
              color: '#112033',
              fontSize: '13px',
            }}
            labelStyle={{
              color: '#5B6B80',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
            formatter={(value, _name, item) => {
              const payload = item?.payload as ChartDataPoint | undefined
              const displayValue = typeof value === 'number' ? value : Number(value ?? 0)

              return [`${displayValue}%`, payload?.pack || 'Acerto']
            }}
          />
          <Area
            type="monotone"
            dataKey="acerto"
            stroke="#2B7A0B"
            strokeWidth={3}
            fill="url(#historyFill)"
            activeDot={{ r: 6, fill: '#112033', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
