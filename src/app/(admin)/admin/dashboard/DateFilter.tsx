'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CalendarDays, ChevronDown, X } from 'lucide-react'
import { adminDashboardField, adminDashboardSoftBtn } from '@/features/admin/lib/adminDashboardUi'

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
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <div className="relative flex w-full items-center sm:w-[190px]">
        <CalendarDays className="pointer-events-none absolute left-4 h-4 w-4 text-brand-secondary" strokeWidth={2} />
        <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-brand-secondary" strokeWidth={2.2} />
        <input
          type="date"
          value={value}
          onChange={handleChange}
          className={adminDashboardField}
        />
      </div>
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