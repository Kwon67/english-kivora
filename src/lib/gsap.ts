'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin)
}

// Designer interactions can await this before creating their first timeline.
let interactions: Promise<void> | undefined
export function loadInteractionPlugins() {
  if (typeof window === 'undefined') throw new Error('GSAP plugins require a browser')
  return interactions ??= Promise.all([
    import('gsap/Observer'), import('gsap/Flip'), import('gsap/Draggable'),
    import('gsap/InertiaPlugin'), import('gsap/MorphSVGPlugin'), import('gsap/ScrambleTextPlugin'),
  ]).then(([{ Observer }, { Flip }, { Draggable }, { InertiaPlugin }, { MorphSVGPlugin }, { ScrambleTextPlugin }]) => {
    gsap.registerPlugin(Observer, Flip, Draggable, InertiaPlugin, MorphSVGPlugin, ScrambleTextPlugin)
  }).catch(error => { interactions = undefined; throw error })
}

export { gsap, useGSAP, ScrollTrigger, SplitText }
