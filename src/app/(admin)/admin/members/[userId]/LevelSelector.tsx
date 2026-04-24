'use client'

interface LevelSelectorProps {
  englishLevel: string
  action: (formData: FormData) => void
}

export default function LevelSelector({ englishLevel, action }: LevelSelectorProps) {
  return (
    <form action={action} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-6 py-4 flex items-center gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Nível de Inglês
        </p>
        <select 
          name="level" 
          defaultValue={englishLevel}
          onChange={(e) => e.target.form?.requestSubmit()}
          className="mt-1 text-sm font-black text-slate-700 bg-transparent border-none p-0 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
        >
          <option value="A1">A1 (Beginner)</option>
          <option value="A2">A2 (Elementary)</option>
          <option value="B1">B1 (Intermediate)</option>
          <option value="B2">B2 (Upper Intermediate)</option>
          <option value="C1">C1 (Advanced)</option>
          <option value="C2">C2 (Proficient)</option>
        </select>
      </div>
    </form>
  )
}
