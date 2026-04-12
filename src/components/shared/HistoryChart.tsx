'use client'

import dynamic from 'next/dynamic'

interface ChartDataPoint {
  date: string
  acerto: number
  pack: string
}

interface HistoryChartProps {
  data: ChartDataPoint[]
}

// Import Recharts components dynamically with no SSR
// This prevents the heavy library from being in the initial bundle
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { ssr: false }
)

const Area = dynamic(
  () => import('recharts').then((mod) => mod.Area),
  { ssr: false }
)

const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
)

const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
)

const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
)

const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
)

function ChartSkeleton() {
  return (
    <div className="h-64 w-full animate-pulse bg-[var(--color-surface-hover)] rounded-lg">
      <div className="h-full flex items-center justify-center text-[var(--color-text-subtle)] text-sm">
        Carregando gráfico...
      </div>
    </div>
  )
}

export default function HistoryChart({ data }: HistoryChartProps) {
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
