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
              <stop offset="0%" stopColor="#466259" stopOpacity={0.22} />
              <stop offset="75%" stopColor="#466259" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#466259" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 10" stroke="rgba(193,200,196,0.35)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#727975"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#727975"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(value: number) => `${value}%`}
          />
          <Tooltip
            cursor={{ stroke: 'rgba(17,32,51,0.12)', strokeDasharray: '4 4' }}
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.96)',
              border: '1px solid rgba(193,200,196,0.4)',
              borderRadius: '18px',
              boxShadow: '0 18px 44px rgba(27,28,24,0.08)',
              color: '#1b1c18',
              fontSize: '13px',
            }}
            labelStyle={{
              color: '#727975',
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
            stroke="#466259"
            strokeWidth={3}
            fill="url(#historyFill)"
            activeDot={{ r: 6, fill: '#466259', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
