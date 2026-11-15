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
import { chartPalette as palette } from '@/lib/chartTheme'

interface SkillData {
  subject: string
  A: number
  fullMark: number
}

export default function RadarSkillsChart({ data }: { data: SkillData[] }) {

  if (!data || data.length === 0 || data.every((item) => item.A === 0)) {
    return (
      <div className="flex h-64 w-full items-center justify-center font-body text-sm text-brand-secondary">
        Faltam dados de treino para análise de habilidades.
      </div>
    )
  }

  return (
    <div className="workspace-chart h-64">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke={palette.polarGrid} />
          <PolarAngleAxis dataKey="subject" tick={palette.tick} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Habilidades"
            dataKey="A"
            stroke="var(--listening-accent)"
            strokeWidth={3}
            fill="var(--listening-accent)"
            fillOpacity={0.25}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={palette.tooltip}
            formatter={(value) => [`${value}% Precisão`, '']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
