import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-[20px] border border-brand-border bg-bg-card p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}
