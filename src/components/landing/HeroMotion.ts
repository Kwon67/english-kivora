import { gsap, SplitText } from '@/lib/gsap'

/** Runs inside JourneyMotion's scoped, reduced-motion-aware GSAP context. */
export function setupHeroMotion(container: HTMLElement) {
  const select = gsap.utils.selector(container)
  const lines = select('#hero-title [data-title-line]')
  const letters = select('[data-hero-letters]')[0]
  if (!letters || lines.length !== 3) return

  const first = SplitText.create(lines[0], { type: 'words', tag: 'span', aria: 'none' })
  const world = SplitText.create(lines[1], { type: 'chars', tag: 'span', aria: 'none' })
  const word = SplitText.create(letters, { type: 'chars', tag: 'span', aria: 'none' })
  const center = (word.chars.length - 1) / 2
  const intro = gsap.timeline({
    id: 'kivora-hero-intro',
    defaults: { ease: 'power3.out', clearProps: 'transform' },
    onComplete: () => { first.revert(); world.revert(); word.revert() },
  })
  intro.addLabel('world', .22).addLabel('open', .63)
    .from(first.words, {
      scaleX: .68, scaleY: 1.38, rotation: i => i ? 7 : -8,
      transformOrigin: '50% 82%', stagger: .075,
      duration: .52, ease: 'back.out(1.8)',
    }, 0)
    .from(world.chars, {
      rotationX: -84, transformPerspective: 440, transformOrigin: '50% 74%',
      stagger: .042, duration: .61, ease: 'back.out(1.25)',
    }, 'world')
    // Fold the letters inward, then fan them out from the middle of the word.
    .from(word.chars, {
      x: index => `${(center - index) * .27}em`,
      rotation: index => (index - center) * -10,
      scaleX: .56, scaleY: .8, transformOrigin: '50% 95%',
      stagger: { from: 'center', amount: .21 }, duration: .68, ease: 'back.out(1.35)',
    }, 'open')
    .from(select('[data-hero-underline]'), { scaleX: 0, duration: .53, ease: 'power3.inOut' }, .99)
    .from(select('[data-hero-art]'), {
      scale: .86, transformOrigin: '51% 51%', duration: 1.30,
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
