'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface RetentionData {
  name: string
  value: number
  color: string
}

export default function RetentionChart({ data }: { data: RetentionData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-sm text-[var(--color-text-muted)]">
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
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.96)',
              border: '1px solid rgba(193,200,196,0.4)',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(27,28,24,0.08)',
              color: '#1b1c18',
              fontSize: '13px',
              fontWeight: 600,
            }}
            itemStyle={{ color: '#1b1c18' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value} cards`, '']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-[var(--color-text)] text-xs font-semibold ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
