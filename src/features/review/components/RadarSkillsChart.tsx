'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface SkillData {
  subject: string
  A: number
  fullMark: number
}

export default function RadarSkillsChart({ data }: { data: SkillData[] }) {
  if (!data || data.length === 0 || data.every(d => d.A === 0)) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-sm text-[var(--color-text-muted)]">
        Faltam dados de treino para análise de habilidades.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(193,200,196,0.3)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#727975', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Habilidades"
            dataKey="A"
            stroke="#276356"
            strokeWidth={3}
            fill="#466259"
            fillOpacity={0.25}
          />
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}% Precisão`, '']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
