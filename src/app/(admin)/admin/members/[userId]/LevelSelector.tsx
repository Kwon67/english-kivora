'use client'
import { useActionState } from 'react'
import { fieldClass, fieldLabel, nestedCardClass } from '@/features/admin/lib/adminUi'
type Result = { success?: boolean; error?: string }
export default function LevelSelector({ englishLevel, action }: { englishLevel: string; action: (data: FormData) => Promise<Result> }) {
  const [state, submit, pending] = useActionState(async (_: Result, data: FormData) => {
    try { return await action(data) } catch { return { error: 'Não foi possível atualizar o nível. Tente novamente.' } }
  }, {})
  return <form action={submit} className={`${nestedCardClass} w-full min-w-0 p-4`}>
    <label htmlFor="member-level" className={fieldLabel}>Nível de inglês</label>
    <p className="my-2 text-sm text-brand-secondary">Uma alteração manual fixa o nível de avaliação. O currículo continua respeitando as etapas já liberadas.</p>
    <select id="member-level" name="level" defaultValue={englishLevel} disabled={pending} className={`${fieldClass} mt-2`}>
      {['A1','A2','B1','B2','C1','C2'].map(level => <option key={level}>{level}</option>)}
    </select>
    <button type="submit" disabled={pending} className="mt-3 min-h-11 rounded-full border border-brand-dark bg-primary-light px-5 py-2 font-semibold">{pending ? 'Salvando…' : 'Salvar nível'}</button>
    <p role="status" className="mt-2 text-sm">{state.error || (state.success ? 'Nível atualizado.' : '')}</p>
  </form>
}
