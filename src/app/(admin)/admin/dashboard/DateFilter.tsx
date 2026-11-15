'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import {
  adminDashboardField,
  adminDashboardSoftBtn,
} from '@/features/admin/lib/adminDashboardUi'

export default function DateFilter({ value }: { value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('date', e.target.value)
    } else {
      params.delete('date')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('date')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <input
        type="date"
        aria-label="Filtrar desempenho por data"
        value={value}
        onChange={handleChange}
        className={`${adminDashboardField} min-w-0 sm:w-40`}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className={`${adminDashboardSoftBtn} min-h-10 px-3 py-2 text-xs`}
          title="Limpar filtro"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </button>
      ) : null}
    </div>
  )
}
