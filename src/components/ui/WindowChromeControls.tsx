import { Minus, Square, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type WindowChromeControlsProps = {
  className?: string
}

const controlButtonClass =
  'flex h-4 w-4 items-center justify-center rounded-[3px] border border-brand-dark bg-bg-primary sm:h-[18px] sm:w-[18px]'

export function MacTrafficLights({ className }: WindowChromeControlsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} aria-hidden="true">
      <span className="h-3 w-3 rounded-full bg-red-400" />
      <span className="h-3 w-3 rounded-full bg-yellow-400" />
      <span className="h-3 w-3 rounded-full bg-brand-accent" />
    </div>
  )
}

export function MacWindowControlButtons({ className }: WindowChromeControlsProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-hidden="true">
      <span className={controlButtonClass} title="Minimizar">
        <Minus className="h-2 w-2 text-brand-dark" strokeWidth={2.75} />
      </span>
      <span className={controlButtonClass} title="Expandir">
        <Square className="h-2 w-2 text-brand-dark" strokeWidth={2.75} />
      </span>
      <span className={controlButtonClass} title="Fechar">
        <X className="h-2 w-2 text-brand-dark" strokeWidth={2.75} />
      </span>
    </div>
  )
}