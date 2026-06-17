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
import { useChartPalette } from '@/lib/chartTheme'

interface SkillData {
  subject: string
  A: number
  fullMark: number
}

export default function RadarSkillsChart({ data }: { data: SkillData[] }) {
  const palette = useChartPalette()

  if (!data || data.length === 0 || data.every((item) => item.A === 0)) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-sm text-text-muted">
        Faltam dados de treino para análise de habilidades.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke={palette.polarGrid} />
          <PolarAngleAxis dataKey="subject" tick={palette.tick} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Habilidades"
            dataKey="A"
            stroke={palette.accent}
            strokeWidth={3}
            fill={palette.accent}
            fillOpacity={0.25}
          />
          <Tooltip
            contentStyle={palette.tooltip}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}% Precisão`, '']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}