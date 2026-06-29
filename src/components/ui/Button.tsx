import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'accent' | 'outline'

type SharedProps = {
  children: ReactNode
  variant?: ButtonVariant
  className?: string
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

const variants: Record<ButtonVariant, string> = {
  accent:
    'bg-brand-accent border-2 border-brand-dark rounded-lg px-5 py-2.5 font-heading text-sm font-bold text-brand-dark hover:opacity-90 transition-all duration-200',
  outline:
    'border-2 border-brand-dark rounded-lg px-5 py-2.5 font-heading text-sm font-bold text-brand-dark hover:bg-brand-dark hover:text-white transition-all duration-200',
}

export default function Button({
  children,
  variant = 'accent',
  className = '',
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 whitespace-nowrap ${variants[variant]} ${className}`

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
