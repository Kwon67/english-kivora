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
  total: number
}

export default function RadarSkillsChart({ data }: { data: SkillData[] }) {
  const measured = data.filter((item) => item.total > 0)
  if (!measured.length) return <p className="text-sm text-brand-secondary">Pratique uma habilidade para ver sua precisão aqui.</p>

  return (
    <>
      {measured.length >= 3 && <div className="workspace-chart h-56">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={measured}>
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
      </div>}
      <ul className="grid gap-3 text-sm text-brand-dark" aria-label="Precisão por habilidade">
        {measured.map(({ subject, A, total }) => <li key={subject}>
          <div className="flex flex-wrap justify-between gap-x-3">
            <span>{subject} <small className="text-brand-secondary">· {total} {total === 1 ? 'resposta' : 'respostas'}</small></span>
            <strong className="tabular-nums">{A}%</strong>
          </div>
          {measured.length < 3 && <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-dark/10" aria-hidden="true">
            <div className="h-full rounded-full bg-brand-accent" style={{ width: `${A}%` }} />
          </div>}
        </li>)}
      </ul>
    </>
  )
}
