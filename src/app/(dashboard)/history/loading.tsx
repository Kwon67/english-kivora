import { BarChart3, Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-6 h-6 text-[var(--color-text-subtle)]" />
          <div className="h-8 w-32 bg-[var(--color-surface-hover)] rounded" />
        </div>
        <div className="h-4 w-48 bg-[var(--color-surface-hover)] rounded" />
      </div>

      {/* Chart Skeleton */}
      <div className="card p-6">
        <div className="h-4 w-40 bg-[var(--color-surface-hover)] rounded mb-4" />
        <div className="h-64 w-full bg-[var(--color-surface-hover)] rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
                <th className="px-4 py-3"><div className="h-4 w-16 bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3"><div className="h-4 w-24 bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3 text-center"><div className="h-4 w-16 mx-auto bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3 text-center"><div className="h-4 w-16 mx-auto bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3 text-center"><div className="h-4 w-16 mx-auto bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3 text-center"><div className="h-4 w-16 mx-auto bg-[var(--color-border)] rounded" /></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3"><div className="h-4 w-24 bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-32 bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-8 mx-auto bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-8 mx-auto bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-12 mx-auto bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-8 mx-auto bg-[var(--color-surface-hover)] rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
      </div>
    </div>
  )
}
