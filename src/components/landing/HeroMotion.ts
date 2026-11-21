import { gsap, SplitText } from '@/lib/gsap'

/** Runs inside JourneyMotion's scoped, reduced-motion-aware GSAP context. */
export function setupHeroMotion(container: HTMLElement) {
  const select = gsap.utils.selector(container)
  const lines = select('#hero-title [data-title-line]')
  const letters = select('[data-hero-letters]')[0]
  if (!letters || lines.length !== 3) return

  const word = SplitText.create(letters, { type: 'chars', tag: 'span', aria: 'none' })
  const intro = gsap.timeline({
    id: 'kivora-hero-intro',
    defaults: { ease: 'power3.out', clearProps: 'transform' },
    onComplete: () => word.revert(),
  })
  intro.addLabel('world', .18).addLabel('open', .48)
    .from(lines[0], { yPercent: 88, duration: .51 }, 0)
    .from(lines[1], { yPercent: 105, duration: .55 }, 'world')
    .from(lines[2], { yPercent: 105, duration: .55 }, 'open')
    // Increasing offsets tighten the tracking without changing the line's width.
    .from(word.chars, { x: index => `-${index * .045}em`, duration: .82, ease: 'power2.inOut' }, 'open')
    .from(select('[data-hero-underline]'), { scaleX: 0, duration: .56, ease: 'power2.inOut' }, .74)
    .from(select('[data-hero-art]'), {
      scale: .86, transformOrigin: '51% 51%', duration: 1.12,
      ease: 'power2.inOut', clearProps: 'transform,transformOrigin',
    }, 'world')
    .from(select('[data-hero-description]'), { y: 7, duration: .43 }, .57)
    .from(select('[data-hero-copy] [data-action-icon] svg, [data-hero-dock] [data-action-icon] svg'), {
      x: -4, y: 4, duration: .36,
    }, .79)

  const welcome = container.querySelector<HTMLElement>('#kivora-intro')
  if (welcome?.dataset.intro) {
    intro.pause(0)
    const play = () => { intro.play() }
    welcome.addEventListener('kivora-intro-finished', play, { once: true })
    return () => welcome.removeEventListener('kivora-intro-finished', play)
  }
}
