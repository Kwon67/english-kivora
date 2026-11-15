'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
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
  const overlay = useRef<HTMLDivElement>(null)
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

  useGSAP(() => {
    if (!mounted || !overlay.current) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(overlay.current, { opacity: 0, duration: .3, clearProps: 'opacity' })
      const panel = overlay.current?.firstElementChild
      if (panel) gsap.from(panel, { y: 38, scale: .94, opacity: 0, duration: .52, ease: 'power3.out', clearProps: 'transform,opacity' })
    })
    return () => media.revert()
  }, { scope: overlay, dependencies: [mounted], revertOnUpdate: true })

  if (!mounted) return null

  return createPortal(
    <div
      ref={overlay}
      data-modal-overlay
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