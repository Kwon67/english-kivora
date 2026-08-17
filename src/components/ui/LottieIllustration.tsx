'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

/**
 * The light build: svg renderer only and no expression engine, which is the
 * smaller half of the player and enough for illustration work. It is loaded
 * through `dynamic` so none of it reaches the initial bundle.
 */
const LottieLight = dynamic(() => import('lottie-react').then((mod) => mod.LottieLight), {
  ssr: false,
})

type LottieIllustrationProps = {
  /** Path under /public, e.g. `/animations/empty-library.json`. */
  src: string
  /** Static image shown before the animation mounts and under reduced motion. */
  poster: string
  /** Empty string marks the illustration as decorative. */
  alt: string
  className?: string
  loop?: boolean
}

/**
 * Renders a Lottie animation that costs nothing until it is on screen: the
 * player chunk and the JSON are both fetched only once the element comes near
 * the viewport. Until then — and permanently, for anyone who asks for reduced
 * motion — the poster is what renders, so every animation needs a still image
 * carrying the same meaning.
 */
export default function LottieIllustration({
  src,
  poster,
  alt,
  className = '',
  loop = true,
}: LottieIllustrationProps) {
  const prefersReducedMotion = useHydratedReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element || prefersReducedMotion) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  const decorative = alt === ''

  return (
    <div ref={containerRef} className={className}>
      {visible && !prefersReducedMotion ? (
        <LottieLight
          src={src}
          loop={loop}
          className="h-auto w-full"
          aria-hidden={decorative || undefined}
          aria-label={decorative ? undefined : alt}
          role={decorative ? undefined : 'img'}
        />
      ) : (
        <Image
          src={poster}
          alt={alt}
          width={300}
          height={240}
          unoptimized
          aria-hidden={decorative || undefined}
          className="h-auto w-full"
        />
      )}
    </div>
  )
}
