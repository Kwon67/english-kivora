import { Loader2 } from 'lucide-react'

function StatCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-4 w-24 bg-[var(--color-surface-hover)] rounded" />
        <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-hover)]" />
      </div>
      <div className="h-8 w-16 bg-[var(--color-surface-hover)] rounded" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Team Daily Status Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="h-5 w-48 bg-[var(--color-surface-hover)] rounded" />
          <div className="h-4 w-24 bg-[var(--color-surface-hover)] rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-hover)]">
              <tr>
                <th className="px-4 py-3"><div className="h-4 w-20 bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3"><div className="h-4 w-24 bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3 text-center"><div className="h-4 w-16 mx-auto bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3 text-center"><div className="h-4 w-16 mx-auto bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3 text-center"><div className="h-4 w-16 mx-auto bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3 text-center"><div className="h-4 w-16 mx-auto bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3"><div className="h-4 w-16 bg-[var(--color-border)] rounded" /></th>
                <th className="px-4 py-3 text-right"><div className="h-4 w-16 ml-auto bg-[var(--color-border)] rounded" /></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)]" />
                      <div className="h-4 w-24 bg-[var(--color-surface-hover)] rounded" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="h-4 w-32 bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-8 mx-auto bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-8 mx-auto bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-8 mx-auto bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3 text-center"><div className="h-4 w-16 mx-auto bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 bg-[var(--color-surface-hover)] rounded" /></td>
                  <td className="px-4 py-3 text-right"><div className="h-4 w-16 ml-auto bg-[var(--color-surface-hover)] rounded" /></td>
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
