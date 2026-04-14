'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CalendarDays, ChevronDown, X } from 'lucide-react'

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
        <CalendarDays className="pointer-events-none absolute left-4 h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={2} />
        <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={2.2} />
        <input
          type="date"
          value={value}
          onChange={handleChange}
          className="w-full rounded-full border border-[var(--color-border)] bg-white/70 py-2 pl-11 pr-11 text-sm font-semibold text-[var(--color-text)] outline-none transition-all [appearance:none] [-webkit-appearance:none] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-white/70 px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] hover:bg-white transition-colors"
          title="Limpar filtro"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </button>
      )}
    </div>
  )
}
