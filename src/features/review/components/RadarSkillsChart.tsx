interface SkillData {
  subject: string
  A: number
  total: number
}

export default function RadarSkillsChart({ data }: { data: SkillData[] }) {
  const measured = data.filter((item) => item.total > 0)
  if (!measured.length) return <p className="text-sm text-brand-secondary">Conclua uma prática com respostas avaliadas para ver os resultados aqui.</p>

  return (
      <ul className="mt-5 grid max-w-xl gap-4 text-sm text-brand-dark" aria-label="Precisão por tipo de prática">
        {measured.map(({ subject, A, total }) => <li key={subject}>
          <div className="flex flex-wrap justify-between gap-x-3">
            <span>{subject} <small className="text-brand-secondary">· {total} {total === 1 ? 'resposta' : 'respostas'}</small></span>
            <strong className="tabular-nums">{A}%</strong>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-dark/10" aria-hidden="true">
            <div className="h-full rounded-full bg-brand-accent" style={{ width: `${A}%` }} />
          </div>
        </li>)}
      </ul>
  )
}
