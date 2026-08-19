'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

interface FluencyRadarProps {
  data: {
    category: string
    accuracy: number
  }[]
}

export default function FluencyRadar({ data }: FluencyRadarProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center text-sm text-text-subtle italic">
        Estude mais packs para calibrar seu radar...
      </div>
    )
  }

  // Ensure we have at least 3 points for a radar chart to look good
  const chartData = data.length < 3 
    ? [...data, ...Array(3 - data.length).fill({ category: '-', accuracy: 0 })]
    : data

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 'bold' }} 
          />
          <Radar
            name="Fluência"
            dataKey="accuracy"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
