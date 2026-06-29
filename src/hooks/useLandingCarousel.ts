'use client'

import { useCallback, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { useSafariIOS } from '@/hooks/useSafariIOS'

export function useLandingCarousel(length: number) {
  const [index, setIndex] = useState(0)
  const isIOS = useSafariIOS()

  const goNext = useCallback(() => {
    setIndex((current) => (current + 1) % length)
  }, [length])

  const goPrev = useCallback(() => {
    setIndex((current) => (current === 0 ? length - 1 : current - 1))
  }, [length])

  const bindSwipe = useDrag(
    ({ swipe: [swipeX], movement: [mx], last }) => {
      if (swipeX === -1 || (last && mx < (isIOS ? -36 : -48))) goNext()
      if (swipeX === 1 || (last && mx > (isIOS ? 36 : 48))) goPrev()
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
      swipe: {
        distance: isIOS ? 16 : 24,
        velocity: isIOS ? 0.08 : 0.15,
      },
    }
  )

  return { index, goNext, goPrev, bindSwipe }
}