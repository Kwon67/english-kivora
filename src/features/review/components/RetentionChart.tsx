'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useChartPalette } from '@/lib/chartTheme'

interface RetentionData {
  name: string
  value: number
  color: string
}

export default function RetentionChart({ data }: { data: RetentionData[] }) {
  const palette = useChartPalette()

  if (data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center font-body text-sm text-brand-secondary">
        Nenhum dado de retenção ainda.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
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
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={palette.tooltip}
            itemStyle={palette.itemStyle}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value} cards`, '']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="ml-1 font-body text-xs font-semibold text-brand-dark">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
