'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { CustomEase } from 'gsap/CustomEase'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, ScrambleTextPlugin, CustomEase, DrawSVGPlugin)
}

// Designer interactions can await this before creating their first timeline.
let interactions: Promise<void> | undefined
export function loadInteractionPlugins() {
  if (typeof window === 'undefined') throw new Error('GSAP plugins require a browser')
  return interactions ??= Promise.all([
    import('gsap/Observer'), import('gsap/Draggable'),
    import('gsap/InertiaPlugin'), import('gsap/MorphSVGPlugin'),
  ]).then(([{ Observer }, { Draggable }, { InertiaPlugin }, { MorphSVGPlugin }]) => {
    gsap.registerPlugin(Observer, Draggable, InertiaPlugin, MorphSVGPlugin)
  }).catch(error => { interactions = undefined; throw error })
}

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip }
