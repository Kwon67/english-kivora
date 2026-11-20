'use client'

import { useId, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './MindmarketLanding.module.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// Recovered verbatim from the pre-extension landing. Their original viewBox
// mapping is retained; only commands after these endpoints are appended.
const DESKTOP_START = 'M1460 100C1050 80 1270 420 1115 510S1140 720 815 720 320 580 220 760 230 1000 460 1050 1310 930 1325 1200 1080 1540 870 1570 150 1390 140 1710 670 2050 840 2130 1240 2320 1465 2300'
const MOBILE_START = 'M410 240C325 220 385 430 325 500S270 555 240 570'
const SVG_NS = 'http://www.w3.org/2000/svg'

function layoutPosition(element: HTMLElement, ancestor: HTMLElement) {
  let x = 0, y = 0
  let current: HTMLElement | null = element
  while (current && current !== ancestor) {
    x += current.offsetLeft
    y += current.offsetTop
    current = current.offsetParent as HTMLElement | null
  }
  return { x, y }
}

type Point = { x: number; y: number }

type Cubic = { start: Point; first: Point; second: Point; end: Point }
type Arrival = { y: number; length: number; area: number }

// The approved prefix uses only absolute M/C/S commands (including implicit S
// repetitions). Parsing it avoids duplicating or editing its control points.
function prefixCurves(path: string): Cubic[] {
  const tokens = path.match(/[MCS]|-?\d+(?:\.\d+)?/g) ?? []
  const curves: Cubic[] = []
  let index = 0, command = ''
  let current: Point = { x: 0, y: 0 }, previousControl = current
  const point = () => ({ x: Number(tokens[index++]), y: Number(tokens[index++]) })
  while (index < tokens.length) {
    if (/^[MCS]$/.test(tokens[index])) command = tokens[index++]
    if (command === 'M') { current = point(); previousControl = current; continue }
    const first = command === 'C' ? point() : { x: 2 * current.x - previousControl.x, y: 2 * current.y - previousControl.y }
    const second = point(), end = point()
    curves.push({ start: current, first, second, end })
    current = end; previousControl = second
  }
  return curves
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

function flattenCurve(curve: Cubic): Point[] {
  const points = [curve.start]
  const split = ({ start, first, second, end }: Cubic, depth: number) => {
    const polygon = distance(start, first) + distance(first, second) + distance(second, end)
    if (depth >= 14 || polygon - distance(start, end) <= .002) { points.push(end); return }
    const a = midpoint(start, first), b = midpoint(first, second), c = midpoint(second, end)
    const d = midpoint(a, b), e = midpoint(b, c), center = midpoint(d, e)
    split({ start, first: a, second: d, end: center }, depth + 1)
    split({ start: center, first: e, second: c, end }, depth + 1)
  }
  split(curve, 0)
  return points
}

function arrivalLookup(curves: Cubic[], cache: Map<string, Point[]>, scaleX: number, scaleY: number) {
  const nextCache = new Map<string, Point[]>()
  const samples: { y: number; travel: number }[] = []
  const segmentEnds: number[] = []
  let travel = 0
  let previous: Point | undefined
  curves.forEach(curve => {
    const key = [curve.start, curve.first, curve.second, curve.end].flatMap(point => [point.x, point.y]).join(',')
    const points = cache.get(key) ?? flattenCurve(curve)
    nextCache.set(key, points)
    points.forEach((point, index) => {
      if (samples.length && index === 0) return
      const pixel = { x: point.x * scaleX, y: point.y * scaleY }
      if (previous) travel += distance(previous, pixel)
      samples.push({ y: pixel.y, travel })
      previous = pixel
    })
    // A non-scaling stroke paints its dashes in CSS pixels, including on curved joins.
    segmentEnds.push(travel)
  })
  // Weighted isotonic regression with a finite minimum slope. Backtracking or
  // nearly horizontal curves get a continuous arrival interval, never a jump
  // across a running-maximum plateau. Weights represent screen-space arc length.
  const slope = .08
  const blocks: { first: number; last: number; weight: number; mean: number }[] = []
  samples.forEach((sample, index) => {
    const before = samples[Math.max(0, index - 1)], after = samples[Math.min(samples.length - 1, index + 1)]
    const weight = Math.max(.001, (after.travel - before.travel) / 2)
    blocks.push({ first: index, last: index, weight, mean: sample.y - slope * sample.travel })
    while (blocks.length > 1 && blocks[blocks.length - 2].mean > blocks[blocks.length - 1].mean) {
      const right = blocks.pop()!, left = blocks.pop()!
      const total = left.weight + right.weight
      blocks.push({ first: left.first, last: right.last, weight: total, mean: (left.mean * left.weight + right.mean * right.weight) / total })
    }
  })
  const lookup: Arrival[] = new Array(samples.length)
  blocks.forEach(block => {
    for (let index = block.first; index <= block.last; index++) {
      lookup[index] = { y: block.mean + slope * samples[index].travel, length: samples[index].travel, area: 0 }
    }
  })
  for (let i = 1; i < lookup.length; i++) {
    lookup[i].area = lookup[i - 1].area + (lookup[i].y - lookup[i - 1].y) * (lookup[i].length + lookup[i - 1].length) / 2
  }
  return { lookup, segmentEnds, cache: nextCache }
}

// Integral of the piecewise-linear arrival map. A spatial box average gives
// continuous velocity at isotonic block boundaries without time-based lag.
function arrivalIntegral(lookup: Arrival[], y: number) {
  if (!lookup.length || y <= lookup[0].y) return 0
  const last = lookup[lookup.length - 1]
  if (y >= last.y) return last.area + (y - last.y) * last.length
  let low = 0, high = lookup.length - 1
  while (high - low > 1) {
    const middle = (low + high) >>> 1
    if (lookup[middle].y <= y) low = middle
    else high = middle
  }
  const first = lookup[low], next = lookup[high], delta = y - first.y
  const value = first.length + (next.length - first.length) * delta / (next.y - first.y)
  return first.area + delta * (first.length + value) / 2
}

function lengthAtY(lookup: Arrival[], y: number) {
  const radius = 72
  return (arrivalIntegral(lookup, y + radius) - arrivalIntegral(lookup, y - radius)) / (radius * 2)
}


export default function JourneyRibbon() {
  const root = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')
  useGSAP(() => {
    const journey = root.current?.parentElement
    if (!journey) return
    const media = gsap.matchMedia()
    media.add({
      mobile: '(max-width: 767px)',
      desktop: '(min-width: 768px)',
      touch: '(pointer: coarse)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, context => {
      const mobile = Boolean(context.conditions?.mobile)
      // Touch scrolling can update the compositor independently of the main thread.
      // Keep the full ribbon anchored to document geometry on coarse pointers.
      const staticRibbon = Boolean(context.conditions?.touch || context.conditions?.reduce)
      const svg = root.current?.querySelector<SVGSVGElement>(mobile ? '[data-ribbon-mobile]' : '[data-ribbon-desktop]')
      const ink = svg?.querySelector<SVGPathElement>('[data-ribbon-path]')
      const maskBase = svg?.querySelector<SVGRectElement>('[data-mask-base]')
      const maskContent = svg?.querySelector<SVGGElement>('[data-mask-content]')
      if (!svg || !ink || !maskBase || !maskContent) return
      const sections = Array.from(journey.querySelectorAll<HTMLElement>('main > section, footer'))
      const playhead = { value: 0 }
      let height = 0, initialSpan = 0, length = 0, frame = 0
      let resizeTimer: ReturnType<typeof setTimeout> | undefined
      let clipRoot: SVGGElement | undefined
      const clips: SVGClipPathElement[] = []
      let segments: { setOffset: ReturnType<typeof gsap.quickSetter>; path: SVGPathElement; length: number; end: number; visible: boolean; partial: boolean }[] = []
      let oldStart = 0, fullEnd = 0, journeyTop = 0, focusOffset = 0, footerStart = 0
      let lookup: Arrival[] = []
      let curveCache = new Map<string, Point[]>()
      let layoutKey = ''
      const prefix = mobile ? MOBILE_START : DESKTOP_START
      const originalCurves = prefixCurves(prefix)
      const copyClasses = [styles.sectionIntro, styles.smallManifesto, styles.practiceCopy, styles.memoryCopy, styles.conversationCopy, styles.pricingHeading, styles.faqList, styles.sketchLabel]
      const clearance = sections.slice(mobile ? 1 : 3).flatMap(section => {
        const foreground = Array.from(section.querySelectorAll<HTMLElement>(copyClasses.map(name => `.${name}`).join(',')))
        if (section.id === 'faq' && section.firstElementChild instanceof HTMLElement) foreground.push(section.firstElementChild)
        if (section.tagName === 'FOOTER') foreground.push(...Array.from(section.children) as HTMLElement[])
        return foreground.map(element => {
          const rect = document.createElementNS(SVG_NS, 'rect')
          rect.setAttribute('fill', 'black')
          return { element, rect }
        })
      })
      maskContent.replaceChildren(...clearance.map(item => item.rect))
      const setAttribute = (element: Element, name: string, value: string) => {
        if (element.getAttribute(name) !== value) element.setAttribute(name, value)
      }

      const draw = () => {
        if (staticRibbon) return
        const virtualScroll = oldStart + playhead.value * (fullEnd - oldStart)
        const spatial = lengthAtY(lookup, virtualScroll + focusOffset - journeyTop)
        // Blend into the hidden tail as the footer enters the viewport.
        const footer = Math.min(1, Math.max(0, (virtualScroll - footerStart) / Math.max(1, fullEnd - footerStart)))
        const blend = footer * footer * (3 - 2 * footer)
        const drawn = spatial + (length - spatial) * blend
        for (const segment of segments) {
          const { path, length: segmentLength, end } = segment
          const remaining = end - drawn
          const visible = remaining < segmentLength
          if (visible !== segment.visible) {
            path.setAttribute('visibility', visible ? 'visible' : 'hidden')
            segment.visible = visible
          }
          const partial = visible && remaining > 0
          if (partial !== segment.partial) {
            // A longer gap prevents a second round cap at the far end on subpixel rounding.
            if (partial) path.style.strokeDasharray = `${segmentLength}px ${2 * segmentLength}px`
            else {
              path.style.removeProperty('stroke-dasharray')
              path.style.removeProperty('stroke-dashoffset')
            }
            segment.partial = partial
          }
          if (partial) segment.setOffset(remaining)
        }
      }
      const updateScrollBounds = () => {
        journeyTop = journey.getBoundingClientRect().top + window.scrollY
        oldStart = journeyTop - window.innerHeight * .8
        focusOffset = window.innerHeight * .5
        fullEnd = journeyTop + height - window.innerHeight
        footerStart = Math.max(journeyTop + layoutPosition(sections[9], journey).y - window.innerHeight, fullEnd - window.innerHeight * .35)
      }
      const measure = () => {
        const svgBox = svg.getBoundingClientRect()
        const width = journey.clientWidth
        height = journey.offsetHeight
        const dimensions = (element: HTMLElement) => ({
          ...layoutPosition(element, journey),
          width: element.offsetWidth,
          height: element.offsetHeight,
        })
        const sectionBoxes = sections.map(dimensions)
        const clearanceBoxes = clearance.map(({ element }) => dimensions(element))
        const nextKey = [svgBox.width, svgBox.height, width, height, ...[...sectionBoxes, ...clearanceBoxes].flatMap(
          box => [box.x, box.y, box.width, box.height],
        )].join(',')
        if (nextKey === layoutKey) return false
        layoutKey = nextKey
        const hero = sectionBoxes[0]
        const practice = sectionBoxes[2]
        // Exactly the old SVG boxes: hero alone on mobile; first three sections
        // on desktop. Extending the viewBox height does not stretch this prefix.
        initialSpan = mobile ? hero.height : practice.y + practice.height
        const scaleX = width / (mobile ? 390 : 1440)
        const scaleY = initialSpan / (mobile ? 950 : 2400)
        const viewWidth = width / scaleX
        const viewHeight = height / scaleY
        const point = (section: typeof hero, x: number, y: number): Point => ({ x: viewWidth * x, y: (section.y + section.height * y) / scaleY })
        const end: Point = mobile ? { x: 240, y: 570 } : { x: 1465, y: 2300 }
        const points: Point[] = mobile
          ? [end, point(hero, .28, .93), point(sectionBoxes[1], .76, .45), point(sectionBoxes[1], .3, .92), point(practice, .72, .32), point(practice, .24, .86), point(sectionBoxes[3], .72, .63), point(sectionBoxes[3], .3, .94), point(sectionBoxes[4], .72, .68), point(sectionBoxes[5], .5, .5), point(sectionBoxes[6], .7, .7), point(sectionBoxes[7], .2, .55), point(sectionBoxes[8], .75, .65), point(sectionBoxes[9], .42, .6), { x: viewWidth * 1.12, y: viewHeight + 50 / scaleY }]
          : [end, point(sectionBoxes[3], .28, .65), point(sectionBoxes[4], .73, .65), point(sectionBoxes[5], .54, .5), point(sectionBoxes[6], .65, .65), point(sectionBoxes[7], .2, .55), point(sectionBoxes[8], .75, .65), point(sectionBoxes[9], .38, .6), { x: viewWidth * 1.12, y: viewHeight + 70 / scaleY }]
        let extension = ''
        const curves = [...originalCurves]
        for (let index = 0; index < points.length - 1; index++) {
          const current = points[index], next = points[index + 1]
          const previous = points[Math.max(0, index - 1)], after = points[Math.min(points.length - 1, index + 2)]
          const first = index === 0 ? (mobile ? { x: 210, y: 585 } : { x: 1690, y: 2280 }) : { x: current.x + (next.x - previous.x) / 6, y: current.y + (next.y - previous.y) / 6 }
          const second = { x: next.x - (after.x - current.x) / 6, y: next.y - (after.y - current.y) / 6 }
          curves.push({ start: current, first, second, end: next })
          extension += ` C${first.x} ${first.y} ${second.x} ${second.y} ${next.x} ${next.y}`
        }
        svg.setAttribute('viewBox', `0 0 ${viewWidth} ${viewHeight}`)
        // The artwork uses a wide band. Size it in CSS pixels regardless of
        // the different desktop/mobile SVG viewBox mappings.
        const strokeWidth = mobile ? Math.min(220, width * .54) : Math.min(385, width * .27)
        ink.setAttribute('stroke-width', String(strokeWidth))
        ink.setAttribute('d', prefix + extension)
        let segmentEnds: number[] = []
        if (staticRibbon) ink.style.removeProperty('stroke-dasharray')
        else {
          const mapped = arrivalLookup(curves, curveCache, svgBox.width / viewWidth, svgBox.height / viewHeight)
          lookup = mapped.lookup
          curveCache = mapped.cache
          segmentEnds = mapped.segmentEnds
          length = segmentEnds[segmentEnds.length - 1]
        }
        // Opaque cards naturally sit above the negative-z ribbon. Lower text
        // is kept as one clear foreground block, not chopped into sentence gaps.
        setAttribute(maskBase, 'width', `${viewWidth}`)
        setAttribute(maskBase, 'height', `${viewHeight}`)
        clearance.forEach(({ rect }, index) => {
          const position = clearanceBoxes[index]
          setAttribute(rect, 'x', `${(position.x - 7) / scaleX}`)
          setAttribute(rect, 'y', `${(position.y - 7) / scaleY}`)
          setAttribute(rect, 'width', `${(position.width + 14) / scaleX}`)
          setAttribute(rect, 'height', `${(position.height + 14) / scaleY}`)
          setAttribute(rect, 'rx', `${7 / scaleX}`)
        })
        for (const [name, index] of [['memory', 3], ['footer', 9]] as const) {
          const surface = root.current?.querySelector<HTMLElement>(`[data-ribbon-surface="${name}"]`)
          if (!surface) continue
          const position = sectionBoxes[index]
          Object.assign(surface.style, { left: `${position.x}px`, top: `${position.y}px`, width: `${position.width}px`, height: `${position.height}px`, borderRadius: getComputedStyle(sections[index]).borderRadius })
        }
        // Keep the reference path for geometry and reduced motion. In motion,
        // only the cubic at the tip animates. Earlier cubics are solid paths.
        svg.append(ink)
        clipRoot?.remove()
        clips.forEach(clip => clip.remove()); clips.length = 0
        clipRoot = document.createElementNS(SVG_NS, 'g')
        svg.append(clipRoot)
        const clearances = clearance.map(({ rect }, index) => {
          const x = Number(rect.getAttribute('x')), y = Number(rect.getAttribute('y'))
          const w = Number(rect.getAttribute('width')), h = Number(rect.getAttribute('height'))
          const r = Math.min(Number(rect.getAttribute('rx')), w / 2, h / 2)
          const clip = document.createElementNS(SVG_NS, 'clipPath')
          clip.id = `${id}-${mobile ? 'mobile' : 'desktop'}-clip-${index}`
          clip.setAttribute('clipPathUnits', 'userSpaceOnUse')
          const shape = document.createElementNS(SVG_NS, 'path')
          shape.setAttribute('clip-rule', 'evenodd')
          shape.setAttribute('d', `M0 0H${viewWidth}V${viewHeight}H0Z M${x+r} ${y}H${x+w-r}A${r} ${r} 0 0 1 ${x+w} ${y+r}V${y+h-r}A${r} ${r} 0 0 1 ${x+w-r} ${y+h}H${x+r}A${r} ${r} 0 0 1 ${x} ${y+h-r}V${y+r}A${r} ${r} 0 0 1 ${x+r} ${y}Z`)
          clip.append(shape); svg.querySelector('defs')!.append(clip); clips.push(clip)
          return { clip, x, y, w, h }
        })
        const appendClipped = (path: SVGPathElement, areas: typeof clearances) => {
          let parent: SVGElement = clipRoot!
          for (const { clip } of areas) {
            const group = document.createElementNS(SVG_NS, 'g')
            group.setAttribute('data-ribbon-clip', '')
            group.setAttribute('clip-path', `url(#${clip.id})`)
            parent.append(group)
            parent = group
          }
          parent.append(path)
        }
        ink.removeAttribute('mask')
        segments = staticRibbon ? [] : curves.map(({ start, first, second, end }, index) => {
          const path = document.createElementNS(SVG_NS, 'path')
          path.setAttribute('class', styles.ribbonInk)
          path.setAttribute('fill', 'none')
          path.setAttribute('visibility', 'hidden')
          path.setAttribute('vector-effect', 'non-scaling-stroke')
          path.setAttribute('stroke-width', String(strokeWidth))
          path.setAttribute('d', `M${start.x} ${start.y}C${first.x} ${first.y} ${second.x} ${second.y} ${end.x} ${end.y}`)
          const points = [start, first, second, end]
          const padX = (strokeWidth / 2 + 1) / scaleX
          const padY = (strokeWidth / 2 + 1) / scaleY
          const minX = Math.min(...points.map(p => p.x)) - padX
          const maxX = Math.max(...points.map(p => p.x)) + padX
          const minY = Math.min(...points.map(p => p.y)) - padY
          const maxY = Math.max(...points.map(p => p.y)) + padY
          appendClipped(path, clearances.filter(({ x, y, w, h }) => x < maxX && x + w > minX && y < maxY && y + h > minY))
          const endDistance = segmentEnds[index]
          const segmentLength = endDistance - (segmentEnds[index - 1] ?? 0)
          return { path, setOffset: gsap.quickSetter(path, 'strokeDashoffset', 'px'), length: segmentLength, end: endDistance, visible: false, partial: false }
        })
        if (staticRibbon) appendClipped(ink, clearances)
        else ink.setAttribute('visibility', 'hidden')
        if (!staticRibbon) {
          updateScrollBounds()
          draw()
        }
        return true
      }
      measure()
      const syncAfterRefresh = (trigger: ScrollTrigger) => {
        updateScrollBounds()
        // Align the tween immediately to the restored position after layout changes.
        const position = (window.scrollY - oldStart) / Math.max(1, fullEnd - oldStart)
        trigger.animation?.progress(gsap.utils.clamp(0, 1, position), true)
        draw()
      }
      const tween = staticRibbon ? null : gsap.fromTo(playhead, { value: 0 }, {
        value: 1,
        immediateRender: false,
        ease: 'none',
        onUpdate: draw,
        scrollTrigger: {
          trigger: journey,
          start: 'top 80%',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: syncAfterRefresh,
        },
      })
      const resize = new ResizeObserver(() => {
        // FAQ and practice height animations notify every frame. Rebuild once
        // after they settle, while preserving their animated layout transition.
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          cancelAnimationFrame(frame)
          frame = requestAnimationFrame(() => { if (measure() && !staticRibbon) ScrollTrigger.refresh() })
        }, 100)
      })
      resize.observe(journey)
      sections.forEach(section => resize.observe(section))
      return () => {
        clearTimeout(resizeTimer)
        cancelAnimationFrame(frame)
        resize.disconnect()
        tween?.scrollTrigger?.kill()
        tween?.kill()
        svg.append(ink)
        clipRoot?.remove()
        clips.forEach(clip => clip.remove())
        ink.setAttribute('mask', `url(#${id}-${mobile ? 'mobile' : 'desktop'})`)
        ink.removeAttribute('visibility')
        ink.style.removeProperty('stroke-dasharray')
        ink.style.removeProperty('stroke-dashoffset')
      }
    })
    return () => media.revert()
  }, { scope: root })

  return <div ref={root} aria-hidden="true">
    <div data-ribbon-surface="memory" className={styles.ribbonMemorySurface} />
    <div data-ribbon-surface="footer" className={styles.ribbonFooterSurface} />
    {(['desktop', 'mobile'] as const).map(mode => <svg key={mode} data-ribbon-desktop={mode === 'desktop' ? '' : undefined} data-ribbon-mobile={mode === 'mobile' ? '' : undefined} className={`${styles.ribbon} ${mode === 'mobile' ? styles.ribbonMobile : styles.ribbonDesktop}`} preserveAspectRatio="none" focusable="false"><defs><mask id={`${id}-${mode}`} maskUnits="userSpaceOnUse"><rect data-mask-base fill="white" /><g data-mask-content /></mask></defs><path data-ribbon-path className={styles.ribbonInk} fill="none" vectorEffect="non-scaling-stroke" mask={`url(#${id}-${mode})`} /></svg>)}
  </div>
}
