'use client'

interface LevelSelectorProps {
  englishLevel: string
  action: (formData: FormData) => void
}

export default function LevelSelector({ englishLevel, action }: LevelSelectorProps) {
  return (
    <form action={action} className="flex items-center gap-3 rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-3 py-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
          Nível de Inglês
        </p>
        <select
          name="level"
          defaultValue={englishLevel}
          onChange={(e) => e.target.form?.requestSubmit()}
          className="mt-1 cursor-pointer border-none bg-transparent p-0 text-sm font-medium text-[var(--color-text)] outline-none transition-colors hover:text-[var(--color-primary)]"
        >
          <option value="A1">A1 (Iniciante)</option>
          <option value="A2">A2 (Básico)</option>
          <option value="B1">B1 (Intermediário)</option>
          <option value="B2">B2 (Intermediário superior)</option>
          <option value="C1">C1 (Avançado)</option>
          <option value="C2">C2 (Proficiente)</option>
        </select>
      </div>
    </form>
  )
}