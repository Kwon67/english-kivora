'use client'
import { useGSAP } from '@gsap/react'
import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { finishFocusedMotion } from '@/components/motion/finishFocusedMotion'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
export default function ProductMotion({ children, className = '', motionKey = '', subtle = false }: { children: ReactNode; className?: string; motionKey?: string; subtle?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (!root.current) return
      if (subtle) {
        gsap.from(root.current, { y: 5, duration: .18, ease: 'power2.out', clearProps: 'transform' })
        return
      }
      gsap.fromTo(root.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .66, ease: 'power3.out', clearProps: 'transform,opacity' })
      const words = root.current.querySelectorAll('[data-product-word]')
      if (words.length) gsap.fromTo(words, { y: 44, opacity: 0, rotation: 1.5 }, { y: 0, opacity: 1, rotation: 0, duration: .65, stagger: .09, ease: 'power3.out', clearProps: 'transform,opacity' })
      root.current.querySelectorAll('[data-product-reveal]').forEach(el => gsap.fromTo(el, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: .7, clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }))
    }, root)
    return () => media.revert()
  }, { scope: root, dependencies: [motionKey, subtle], revertOnUpdate: true })
  return <div onFocusCapture={finishFocusedMotion} data-product-motion ref={root} className={className}>{children}</div>
}
