'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import {
  adminDashboardField,
  adminDashboardPrimaryBtn,
  adminDashboardSoftBtn,
} from '@/features/admin/lib/adminDashboardUi'

export default function DateFilter({ value }: { value: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const otherParams = [...searchParams].filter(([name]) => name !== 'date')

  const hiddenFields = otherParams.map(([name, param], index) => (
    <input key={`${name}-${index}`} type="hidden" name={name} value={param} />
  ))

  return (
    <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
      <form action={pathname} method="get" className="flex min-w-0 grow flex-wrap items-end gap-2">
        {hiddenFields}
        <label className="grid min-w-0 grow gap-1 text-sm text-brand-secondary">
          Data do desempenho
          <input
            key={value}
            name="date"
            type="date"
            aria-label="Filtrar desempenho por data"
            defaultValue={value}
            required
            className={`${adminDashboardField} min-w-0 sm:w-40`}
          />
        </label>
        <button type="submit" className={adminDashboardPrimaryBtn}>Filtrar</button>
      </form>
      {value && (
        <form action={pathname} method="get">
          {hiddenFields}
          <button type="submit" className={adminDashboardSoftBtn}>Limpar</button>
        </form>
      )}
    </div>
  )
}
