'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { finishFocusedMotion } from '@/components/motion/finishFocusedMotion'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP, ScrollTrigger)

type MotionSurfaceProps = {
  children: ReactNode
  className?: string
  sequence?: boolean
  stagger?: boolean
  onScroll?: boolean
  delay?: number
  staggerDelay?: number
  maxItemDelay?: number
}

let refreshFrame = 0

function scheduleTriggerRefresh() {
  if (refreshFrame) return
  refreshFrame = requestAnimationFrame(() => {
    refreshFrame = 0
    ScrollTrigger.refresh()
  })
}

export default function MotionSurface({
  children,
  className,
  sequence = false,
  stagger = false,
  onScroll = false,
  delay = 0,
  staggerDelay = 0.075,
  maxItemDelay = 0.3,
}: MotionSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    (context) => {
      const root = ref.current
      if (!root) return

      const media = gsap.matchMedia()
      const owned = (selector: string) =>
        Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
          (element) => element.closest('[data-motion-surface]') === root,
        )

      let active = true
      // Font metrics must settle before measuring heading containers or triggers.
      void document.fonts.ready.then(() => {
        if (!active) return
        context.add(() => {
          media.add(
            {
              motion: '(prefers-reduced-motion: no-preference)',
              compact: '(max-width: 47.99rem)',
            },
            ({ conditions }) => {
              if (!conditions?.motion) return
              const compact = conditions.compact
              const targets = sequence
                ? owned('[data-motion-stage]')
                : stagger
                  ? Array.from(root.children).filter(
                      (child) => !child.hasAttribute('data-motion-surface'),
                    )
                  : [root]

              targets.forEach((target, index) => {
                gsap.from(target, {
                  y: compact ? 24 : 32,
                  opacity: 0,
                  duration: compact ? 0.62 : 0.72,
                  ease: 'power3.out',
                  delay: Math.min(
                    delay + index * staggerDelay,
                    maxItemDelay,
                  ),
                  clearProps: 'transform,opacity',
                  ...(onScroll
                    ? {
                        scrollTrigger: {
                          trigger: target,
                          start: 'top 94%',
                          once: true,
                        },
                      }
                    : {}),
                })
              })

              const progress = owned('[data-progress-fill]')
              progress.forEach((bar) => {
                gsap.from(bar, {
                  scaleX: 0,
                  transformOrigin: 'left center',
                  duration: 0.48,
                  ease: 'power3.out',
                  clearProps: 'transform,opacity',
                  scrollTrigger: { trigger: bar, start: 'top 96%', once: true },
                })
              })

              if (!onScroll && progress.length === 0) return
              const observer = new ResizeObserver(scheduleTriggerRefresh)
              observer.observe(root)
              return () => observer.disconnect()
            },
          )
          scheduleTriggerRefresh()
        })
      })

      return () => {
        active = false
        media.revert()
      }
    },
    {
      scope: ref,
      dependencies: [
        sequence,
        stagger,
        onScroll,
        delay,
        staggerDelay,
        maxItemDelay,
      ],
      revertOnUpdate: true,
    },
  )

  return (
    <div onFocusCapture={finishFocusedMotion} ref={ref} className={className} data-motion-surface>
      {children}
    </div>
  )
}
