import { gsap } from '@/lib/gsap'
import { ease } from '@/lib/motion-tokens'

/** Runs inside JourneyMotion's scoped, reduced-motion-aware GSAP context. */
export function setupHeroMotion(container: HTMLElement) {
  const select = gsap.utils.selector(container)
  const lines = select('#hero-title [data-title-line]')
  if (!lines.length) return

  const intro = gsap.timeline({ id: 'kivora-hero-intro', defaults: { ease: ease.reveal } })
  intro.addLabel('headline', 0)
    .addLabel('open', .22)
    .addLabel('invite', .48)
    // The moving masks carry the lines together; the type rises through each lower edge.
    .from(select('[data-hero-mask]'), {
      // Give the last line less travel to keep the subtitle clear on small screens.
      yPercent: index => index === lines.length - 1 ? 3 : 17,
      duration: .67, stagger: .105, clearProps: 'transform',
    }, 'headline')
    .from(lines, {
      x: '-.08em', yPercent: 37, skewX: -4.5, scaleY: .95,
      duration: .7, stagger: .105, clearProps: 'transform',
    }, 'headline')
    .from(select('[data-hero-keyword]'), {
      scaleX: .79, rotation: -3, skewX: -7, duration: .65,
      ease: 'back.out(1.25)', clearProps: 'transform',
    }, 'open')
    .from(select('[data-hero-underline]'), {
      scaleX: 0, duration: .5, ease: 'power2.inOut', clearProps: 'transform',
    }, 'open+=.12')
    .from(select('[data-hero-description]'), {
      y: 10, duration: .46, clearProps: 'transform',
    }, 'open')
    .from(select('[data-hero-art]'), {
      scale: .91, rotation: -3, transformOrigin: '56% 62%', duration: .84,
      clearProps: 'transform,transformOrigin',
    }, 'open')
    .from(select('[data-hero-copy] [data-action-icon] svg, [data-hero-dock] [data-action-icon] svg'), {
      x: -5, y: 5, rotation: -24, duration: .46, ease: 'back.out(1.3)', clearProps: 'transform',
    }, 'invite')
}
