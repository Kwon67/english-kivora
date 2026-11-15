import Link from 'next/link'
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'
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
  return cn(
    variant === 'accent'
      ? 'premium-primary'
      : 'workspace-button workspace-button-outline',
    landing && 'workspace-button-large',
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
