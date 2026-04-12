import { Loader2, Target } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center animate-pulse">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-[var(--color-surface-hover)] flex items-center justify-center">
            <Target className="w-12 h-12 text-[var(--color-text-subtle)]" />
          </div>
        </div>
        
        {/* Title */}
        <div className="h-8 w-48 mx-auto bg-[var(--color-surface-hover)] rounded mb-3" />
        
        {/* Badge */}
        <div className="h-6 w-32 mx-auto bg-[var(--color-surface-hover)] rounded-full mb-6" />
        
        {/* Card count */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-hover)]" />
          <div className="h-4 w-32 bg-[var(--color-surface-hover)] rounded" />
        </div>
        
        {/* Button */}
        <div className="h-14 w-full bg-[var(--color-surface-hover)] rounded-xl" />

        {/* Loading text */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[var(--color-text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando cards...</span>
        </div>
      </div>
    </div>
  )
}
