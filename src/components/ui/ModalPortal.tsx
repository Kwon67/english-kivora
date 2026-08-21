'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export const MODAL_OVERLAY_CLASS =
  'fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center overflow-y-auto overscroll-contain bg-brand-dark/15 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] backdrop-blur-2xl'

type ModalPortalProps = {
  children: ReactNode
  onClose?: () => void
  closeOnBackdrop?: boolean
  className?: string
  lockScroll?: boolean
}

export default function ModalPortal({
  children,
  onClose,
  closeOnBackdrop = true,
  className = MODAL_OVERLAY_CLASS,
  lockScroll = true,
}: ModalPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!lockScroll || !mounted) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [lockScroll, mounted])

  if (!mounted) return null

  return createPortal(
    <div
      className={className}
      role="presentation"
      onMouseDown={(event) => {
        if (closeOnBackdrop && onClose && event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      {children}
    </div>,
    document.body
  )
}