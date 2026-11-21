import { gsap, SplitText } from '@/lib/gsap'
import { ease } from '@/lib/motion-tokens'

/** Runs inside JourneyMotion's scoped, reduced-motion-aware GSAP context. */
export function setupHeroMotion(container: HTMLElement) {
  const select = gsap.utils.selector(container)
  const lines = select('#hero-title [data-title-line]')
  if (!lines.length) return

  const intro = gsap.timeline({ id: 'kivora-hero-intro', defaults: { ease: ease.reveal } })
  const type = (element: Element, interval: number, pause: number, aria: 'auto' | 'none') => {
    const split = SplitText.create(element, { type: 'chars', tag: 'span', aria })
    gsap.set(split.chars, { opacity: 0 })
    intro.to(split.chars, { opacity: 1, duration: 0, stagger: interval }, '+=' + pause)
  }

  // Fixed line boxes reserve the final layout while letters appear in reading order.
  for (const line of lines) type(line, .053, .115, 'none')
  const ending = intro.duration()
  intro.from(select('[data-hero-underline]'), {
    scaleX: 0, duration: .32, clearProps: 'transform',
  }, ending)
  const description = select('[data-hero-description]')[0]
  if (description) type(description, .022, 0, 'auto')

  intro.from(select('[data-hero-art]'), {
    scale: .91, rotation: -3, transformOrigin: '56% 62%', duration: .84,
    clearProps: 'transform,transformOrigin',
  }, 0)
    .from(select('[data-hero-copy] [data-action-icon] svg, [data-hero-dock] [data-action-icon] svg'), {
      x: -5, y: 5, rotation: -24, duration: .46, ease: 'back.out(1.3)', clearProps: 'transform',
    }, ending)
}
