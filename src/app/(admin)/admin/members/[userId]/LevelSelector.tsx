'use client'

import { fieldClass, fieldLabel, nestedCardClass } from '@/features/admin/lib/adminUi'

interface LevelSelectorProps {
  englishLevel: string
  action: (formData: FormData) => void
}

export default function LevelSelector({ englishLevel, action }: LevelSelectorProps) {
  return (
    <form action={action} className={`${nestedCardClass} min-w-[200px] px-4 py-3`}>
      <label htmlFor="member-level" className={fieldLabel}>
        Nível de Inglês
      </label>
      <select
        id="member-level"
        name="level"
        defaultValue={englishLevel}
        onChange={(e) => e.target.form?.requestSubmit()}
        className={`${fieldClass} mt-2 cursor-pointer py-2`}
      >
        <option value="A1">A1 (Iniciante)</option>
        <option value="A2">A2 (Básico)</option>
        <option value="B1">B1 (Intermediário)</option>
        <option value="B2">B2 (Intermediário superior)</option>
        <option value="C1">C1 (Avançado)</option>
        <option value="C2">C2 (Proficiente)</option>
      </select>
    </form>
  )
}