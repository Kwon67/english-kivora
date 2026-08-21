import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'accent' | 'outline'

type SharedProps = {
  children: ReactNode
  variant?: ButtonVariant
  className?: string
  /** Landing CTAs: 1px border, 13px radius, 18px label */
  landing?: boolean
}

type LinkButtonProps = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
  }

type NativeButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never
  }

type ButtonProps = LinkButtonProps | NativeButtonProps

function getVariantClasses(variant: ButtonVariant, landing: boolean) {
  const shared = landing
    ? 'border border-brand-dark rounded-container px-6 py-3 font-heading text-lg font-bold'
    : 'border-2 border-brand-dark rounded-lg px-5 py-2.5 font-heading text-sm font-bold'

  if (variant === 'accent') {
    return cn(
      shared,
      'bg-brand-accent text-brand-dark hover:opacity-90 transition-all duration-200',
    )
  }

  return cn(
    shared,
    'text-brand-dark hover:bg-brand-dark hover:text-white transition-all duration-200',
  )
}

export default function Button({
  children,
  variant = 'accent',
  landing = false,
  className = '',
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    getVariantClasses(variant, landing),
    className,
  )

  if ('href' in props && props.href) {
    const { href, ...linkProps } = props as LinkButtonProps

    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    )
  }

  const buttonProps = props as NativeButtonProps

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  )
}