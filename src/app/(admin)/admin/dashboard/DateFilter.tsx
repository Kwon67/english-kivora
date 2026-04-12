'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CalendarDays, X } from 'lucide-react'

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
    <div className="flex items-center gap-2">
      <div className="relative flex items-center">
        <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--color-text-muted)]" strokeWidth={2} />
        <input
          type="date"
          value={value}
          onChange={handleChange}
          className="rounded-full border border-[var(--color-border)] bg-white/70 py-2 pl-9 pr-4 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
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
