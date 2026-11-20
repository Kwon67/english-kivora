'use client'

import { useRef } from 'react'
import { useLandingLite } from './useLandingLite'
import { gsap, useGSAP } from '@/lib/gsap'
import styles from './MindmarketLanding.module.css'

export default function JourneyRibbon() {
  const path = useRef<SVGPathElement>(null)
  const lite = useLandingLite()
  useGSAP(() => {
    if (lite) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(path.current, { drawSVG: '0% 3%' }, {
        drawSVG: '0% 100%', ease: 'none',
        scrollTrigger: { trigger: path.current!.closest('main'), start: 'top top', end: 'bottom bottom', scrub: .35 },
      })
    })
    return () => media.revert()
  }, { scope: path, dependencies: [lite], revertOnUpdate: true })
  return <svg aria-hidden="true" focusable="false" className={styles.ribbon} viewBox="0 0 1200 6000" preserveAspectRatio="none">
    <path ref={path} data-ribbon-path fill="none" stroke="currentColor" strokeWidth="58" strokeLinecap="round"
      d="M1020 -100 C1320 200 1240 380 920 510 S40 600 80 990 S1230 1310 1100 1630 S40 1760 130 2170 S1220 2500 1100 2850 S-80 3080 120 3520 S1270 3730 1090 4190 S-40 4430 140 4800 S1180 5100 1050 5460 S80 5650 250 6150" />
  </svg>
}
